# Shopping List App - Terraform Destroy Script (PowerShell)
# This script properly cleans up all resources before destroying the infrastructure

param(
    [switch]$Force
)

Write-Host "🧹 Starting infrastructure cleanup..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the terraform directory
if (-not (Test-Path "main.tf")) {
    Write-Error "Please run this script from the terraform directory"
    exit 1
}

# Step 1: Get cluster name from terraform
Write-Status "Getting cluster information..."
try {
    $CLUSTER_NAME = terraform output -raw cluster_name 2>$null
    if (-not $CLUSTER_NAME) { $CLUSTER_NAME = "shopping-list-test-cluster" }
} catch {
    $CLUSTER_NAME = "shopping-list-test-cluster"
}

try {
    $REGION = terraform output -raw region 2>$null
    if (-not $REGION) { $REGION = "eu-west-1" }
} catch {
    $REGION = "eu-west-1"
}

Write-Status "Cluster: $CLUSTER_NAME"
Write-Status "Region: $REGION"

# Step 2: Clean up Kubernetes resources first
Write-Status "Cleaning up Kubernetes resources..."

# Check if kubectl is available and cluster is accessible
if (Get-Command kubectl -ErrorAction SilentlyContinue) {
    Write-Status "Checking cluster connectivity..."
    try {
        $null = kubectl cluster-info 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Connected to cluster, cleaning up resources..."
            
            # Delete Helm releases
            Write-Status "Deleting Helm releases..."
            helm uninstall shopping-list-frontend --namespace default 2>$null
            helm uninstall shopping-list-backend --namespace default 2>$null
            helm uninstall aws-ebs-csi-driver --namespace kube-system 2>$null
            helm uninstall aws-load-balancer-controller --namespace kube-system 2>$null
            
            # Delete any remaining resources
            Write-Status "Deleting remaining Kubernetes resources..."
            kubectl delete ingress --all --namespace default 2>$null
            kubectl delete service --all --namespace default 2>$null
            kubectl delete deployment --all --namespace default 2>$null
            kubectl delete pvc --all --namespace default 2>$null
            kubectl delete pv --all 2>$null
            
            # Delete service accounts
            kubectl delete serviceaccount aws-load-balancer-controller --namespace kube-system 2>$null
            kubectl delete serviceaccount ebs-csi-controller-sa --namespace kube-system 2>$null
            
            Write-Status "Kubernetes cleanup completed"
        } else {
            Write-Warning "Cannot connect to cluster, skipping Kubernetes cleanup"
        }
    } catch {
        Write-Warning "Cannot connect to cluster, skipping Kubernetes cleanup"
    }
} else {
    Write-Warning "kubectl not found, skipping Kubernetes cleanup"
}

# Step 3: Clean up AWS Load Balancers
Write-Status "Cleaning up AWS Load Balancers..."
if (Get-Command aws -ErrorAction SilentlyContinue) {
    try {
        # Get ALB ARNs
        $ALB_ARNS = aws elbv2 describe-load-balancers --region $REGION --query 'LoadBalancers[?contains(LoadBalancerName, `shopping-list`)].LoadBalancerArn' --output text 2>$null
        
        if ($ALB_ARNS) {
            Write-Status "Found ALBs: $ALB_ARNS"
            
            foreach ($ALB_ARN in $ALB_ARNS.Split("`n")) {
                if ($ALB_ARN.Trim()) {
                    Write-Status "Deleting ALB: $ALB_ARN"
                    
                    # Get target groups
                    $TG_ARNS = aws elbv2 describe-target-groups --region $REGION --load-balancer-arn $ALB_ARN --query 'TargetGroups[].TargetGroupArn' --output text 2>$null
                    
                    # Delete listeners
                    $LISTENER_ARNS = aws elbv2 describe-listeners --region $REGION --load-balancer-arn $ALB_ARN --query 'Listeners[].ListenerArn' --output text 2>$null
                    
                    foreach ($LISTENER_ARN in $LISTENER_ARNS.Split("`n")) {
                        if ($LISTENER_ARN.Trim()) {
                            aws elbv2 delete-listener --region $REGION --listener-arn $LISTENER_ARN 2>$null
                        }
                    }
                    
                    # Delete load balancer
                    aws elbv2 delete-load-balancer --region $REGION --load-balancer-arn $ALB_ARN 2>$null
                    
                    # Delete target groups
                    foreach ($TG_ARN in $TG_ARNS.Split("`n")) {
                        if ($TG_ARN.Trim()) {
                            aws elbv2 delete-target-group --region $REGION --target-group-arn $TG_ARN 2>$null
                        }
                    }
                }
            }
        } else {
            Write-Status "No ALBs found to clean up"
        }
    } catch {
        Write-Warning "Error cleaning up ALBs: $($_.Exception.Message)"
    }
} else {
    Write-Warning "AWS CLI not found, skipping ALB cleanup"
}

# Step 4: Clean up S3 bucket contents
Write-Status "Cleaning up S3 bucket..."
if (Get-Command aws -ErrorAction SilentlyContinue) {
    try {
        $BUCKET_NAME = terraform output -raw s3_bucket_name 2>$null
        
        if ($BUCKET_NAME) {
            Write-Status "Cleaning bucket: $BUCKET_NAME"
            
            # Delete all objects in the bucket
            aws s3 rm s3://$BUCKET_NAME --recursive --region $REGION 2>$null
            
            # Delete bucket versioning
            aws s3api delete-bucket-versioning --bucket $BUCKET_NAME --region $REGION 2>$null
            
            Write-Status "S3 bucket cleaned"
        }
    } catch {
        Write-Warning "Error cleaning up S3 bucket: $($_.Exception.Message)"
    }
} else {
    Write-Warning "AWS CLI not found, skipping S3 cleanup"
}

# Step 5: Wait a bit for resources to be fully cleaned up
Write-Status "Waiting for resources to be cleaned up..."
Start-Sleep -Seconds 30

# Step 6: Run terraform destroy
Write-Status "Running terraform destroy..."

if (-not $Force) {
    Write-Warning "This will destroy all infrastructure. Are you sure? (y/N)"
    $response = Read-Host
    
    if ($response -notmatch '^[yY](es)?$') {
        Write-Status "Destroy cancelled by user"
        exit 0
    }
}

Write-Status "Proceeding with terraform destroy..."

# Run terraform destroy with auto-approve
terraform destroy -auto-approve

Write-Status "✅ Infrastructure destroyed successfully!" 