#!/bin/bash

# Shopping List App - Automated Deployment Script
# This script sets up everything after Terraform has created the EKS cluster

set -e  # Exit on any error

echo "🚀 Starting automated deployment of Shopping List App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check if helm is available
if ! command -v helm &> /dev/null; then
    print_error "helm is not installed or not in PATH"
    exit 1
fi

# Check if we can connect to the cluster
print_status "Checking cluster connectivity..."
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please ensure:"
    print_error "1. Terraform has been applied successfully"
    print_error "2. AWS credentials are configured"
    print_error "3. kubeconfig is updated with: aws eks update-kubeconfig --region eu-west-1 --name shopping-list-test-cluster"
    exit 1
fi

print_status "✅ Connected to cluster successfully"

# Step 1: Add Helm repositories
print_status "Adding Helm repositories..."
helm repo add eks https://aws.github.io/eks-charts
helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
helm repo update

# Step 2: Get Terraform outputs
print_status "Getting Terraform outputs..."
cd terraform
LOAD_BALANCER_CONTROLLER_ROLE_ARN=$(terraform output -raw aws_load_balancer_controller_role_arn)
EBS_CSI_CONTROLLER_ROLE_ARN=$(terraform output -raw ebs_csi_controller_role_arn)
cd ..

print_status "Load Balancer Controller Role ARN: $LOAD_BALANCER_CONTROLLER_ROLE_ARN"
print_status "EBS CSI Controller Role ARN: $EBS_CSI_CONTROLLER_ROLE_ARN"

# Step 3: Create service accounts and annotate with IAM roles
print_status "Creating service accounts with IAM role annotations..."

# AWS Load Balancer Controller service account
kubectl create serviceaccount aws-load-balancer-controller -n kube-system --dry-run=client -o yaml | kubectl apply -f -
kubectl annotate serviceaccount aws-load-balancer-controller -n kube-system eks.amazonaws.com/role-arn="$LOAD_BALANCER_CONTROLLER_ROLE_ARN"

# EBS CSI Controller service account
kubectl create serviceaccount ebs-csi-controller-sa -n kube-system --dry-run=client -o yaml | kubectl apply -f -
kubectl annotate serviceaccount ebs-csi-controller-sa -n kube-system eks.amazonaws.com/role-arn="$EBS_CSI_CONTROLLER_ROLE_ARN"

# Step 4: Install AWS Load Balancer Controller
print_status "Installing AWS Load Balancer Controller..."
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    --namespace kube-system \
    --set clusterName=shopping-list-test-cluster \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller

# Wait for Load Balancer Controller to be ready
print_status "Waiting for AWS Load Balancer Controller to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=aws-load-balancer-controller -n kube-system --timeout=300s

# Step 5: Install EBS CSI Driver
print_status "Installing EBS CSI Driver..."
helm install aws-ebs-csi-driver aws-ebs-csi-driver/aws-ebs-csi-driver \
    --namespace kube-system \
    --set controller.serviceAccount.create=false \
    --set controller.serviceAccount.name=ebs-csi-controller-sa

# Wait for EBS CSI Driver to be ready
print_status "Waiting for EBS CSI Driver to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=aws-ebs-csi-driver -n kube-system --timeout=300s

# Step 6: Deploy Backend
print_status "Deploying backend application..."
helm install shopping-list-backend ./helm/backend --namespace default

# Wait for backend to be ready
print_status "Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=shopping-list-backend --timeout=300s

# Step 7: Deploy Frontend
print_status "Deploying frontend application..."
helm install shopping-list-frontend ./helm/frontend --namespace default

# Wait for frontend to be ready
print_status "Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=shopping-list-frontend --timeout=300s

# Step 8: Wait for ALB to be provisioned
print_status "Waiting for Application Load Balancers to be provisioned..."
sleep 60

# Step 9: Get the ALB URLs
print_status "Getting ALB URLs..."
FRONTEND_ALB=$(kubectl get ingress shopping-list-frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
BACKEND_ALB=$(kubectl get ingress shopping-list-backend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Frontend URL: http://$FRONTEND_ALB"
echo "🔧 Backend API: http://$BACKEND_ALB"
echo ""
echo "📋 To check the status of your deployment:"
echo "   kubectl get pods"
echo "   kubectl get ingress"
echo "   kubectl get services"
echo ""
echo "🔍 To view logs:"
echo "   kubectl logs -l app.kubernetes.io/name=shopping-list-backend"
echo "   kubectl logs -l app.kubernetes.io/name=shopping-list-frontend"
echo ""
print_status "✅ Shopping List App is now deployed and ready to use!" 