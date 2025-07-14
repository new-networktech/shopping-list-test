#!/bin/bash

# Shopping List App - Terraform Destroy Script
# This script properly cleans up all resources before destroying the infrastructure

set -e

echo "🧹 Starting infrastructure cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the terraform directory
if [ ! -f "main.tf" ]; then
    print_error "Please run this script from the terraform directory"
    exit 1
fi

# Step 1: Get cluster name from terraform
print_status "Getting cluster information..."
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "shopping-list-test-cluster")
REGION=$(terraform output -raw region 2>/dev/null || echo "eu-west-1")

print_status "Cluster: $CLUSTER_NAME"
print_status "Region: $REGION"

# Step 2: Clean up Kubernetes resources first
print_status "Cleaning up Kubernetes resources..."

# Check if kubectl is available and cluster is accessible
if command -v kubectl &> /dev/null; then
    print_status "Checking cluster connectivity..."
    if kubectl cluster-info &> /dev/null; then
        print_status "Connected to cluster, cleaning up resources..."
        
        # Delete Helm releases
        print_status "Deleting Helm releases..."
        helm uninstall shopping-list-frontend --namespace default 2>/dev/null || true
        helm uninstall shopping-list-backend --namespace default 2>/dev/null || true
        helm uninstall aws-ebs-csi-driver --namespace kube-system 2>/dev/null || true
        helm uninstall aws-load-balancer-controller --namespace kube-system 2>/dev/null || true
        
        # Delete any remaining resources
        print_status "Deleting remaining Kubernetes resources..."
        kubectl delete ingress --all --namespace default 2>/dev/null || true
        kubectl delete service --all --namespace default 2>/dev/null || true
        kubectl delete deployment --all --namespace default 2>/dev/null || true
        kubectl delete pvc --all --namespace default 2>/dev/null || true
        kubectl delete pv --all 2>/dev/null || true
        
        # Delete service accounts
        kubectl delete serviceaccount aws-load-balancer-controller --namespace kube-system 2>/dev/null || true
        kubectl delete serviceaccount ebs-csi-controller-sa --namespace kube-system 2>/dev/null || true
        
        print_status "Kubernetes cleanup completed"
    else
        print_warning "Cannot connect to cluster, skipping Kubernetes cleanup"
    fi
else
    print_warning "kubectl not found, skipping Kubernetes cleanup"
fi

# Step 3: Clean up AWS Load Balancers
print_status "Cleaning up AWS Load Balancers..."
if command -v aws &> /dev/null; then
    # Get ALB ARNs
    ALB_ARNS=$(aws elbv2 describe-load-balancers --region $REGION --query 'LoadBalancers[?contains(LoadBalancerName, `shopping-list`)].LoadBalancerArn' --output text 2>/dev/null || echo "")
    
    if [ ! -z "$ALB_ARNS" ]; then
        print_status "Found ALBs: $ALB_ARNS"
        
        for ALB_ARN in $ALB_ARNS; do
            print_status "Deleting ALB: $ALB_ARN"
            
            # Get target groups
            TG_ARNS=$(aws elbv2 describe-target-groups --region $REGION --load-balancer-arn $ALB_ARN --query 'TargetGroups[].TargetGroupArn' --output text 2>/dev/null || echo "")
            
            # Delete listeners
            LISTENER_ARNS=$(aws elbv2 describe-listeners --region $REGION --load-balancer-arn $ALB_ARN --query 'Listeners[].ListenerArn' --output text 2>/dev/null || echo "")
            
            for LISTENER_ARN in $LISTENER_ARNS; do
                aws elbv2 delete-listener --region $REGION --listener-arn $LISTENER_ARN 2>/dev/null || true
            done
            
            # Delete load balancer
            aws elbv2 delete-load-balancer --region $REGION --load-balancer-arn $ALB_ARN 2>/dev/null || true
            
            # Delete target groups
            for TG_ARN in $TG_ARNS; do
                aws elbv2 delete-target-group --region $REGION --target-group-arn $TG_ARN 2>/dev/null || true
            done
        done
    else
        print_status "No ALBs found to clean up"
    fi
else
    print_warning "AWS CLI not found, skipping ALB cleanup"
fi

# Step 4: Clean up S3 bucket contents
print_status "Cleaning up S3 bucket..."
if command -v aws &> /dev/null; then
    BUCKET_NAME=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
    
    if [ ! -z "$BUCKET_NAME" ]; then
        print_status "Cleaning bucket: $BUCKET_NAME"
        
        # Delete all objects in the bucket
        aws s3 rm s3://$BUCKET_NAME --recursive --region $REGION 2>/dev/null || true
        
        # Delete bucket versioning
        aws s3api delete-bucket-versioning --bucket $BUCKET_NAME --region $REGION 2>/dev/null || true
        
        print_status "S3 bucket cleaned"
    fi
else
    print_warning "AWS CLI not found, skipping S3 cleanup"
fi

# Step 5: Wait a bit for resources to be fully cleaned up
print_status "Waiting for resources to be cleaned up..."
sleep 30

# Step 6: Run terraform destroy
print_status "Running terraform destroy..."
print_warning "This will destroy all infrastructure. Are you sure? (y/N)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    print_status "Proceeding with terraform destroy..."
    
    # Run terraform destroy with auto-approve
    terraform destroy -auto-approve
    
    print_status "✅ Infrastructure destroyed successfully!"
else
    print_status "Destroy cancelled by user"
    exit 0
fi 