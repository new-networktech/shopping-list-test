# Shopping List App - Automated Deployment Script (PowerShell)
# This script sets up everything after Terraform has created the EKS cluster

param(
    [switch]$SkipChecks
)

Write-Host "🚀 Starting automated deployment of Shopping List App..." -ForegroundColor Green

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

# Check if kubectl is available
if (-not $SkipChecks) {
    Write-Status "Checking prerequisites..."
    try {
        $null = Get-Command kubectl -ErrorAction Stop
    }
    catch {
        Write-Error "kubectl is not installed or not in PATH"
        exit 1
    }

    try {
        $null = Get-Command helm -ErrorAction Stop
    }
    catch {
        Write-Error "helm is not installed or not in PATH"
        exit 1
    }
}

# Check if we can connect to the cluster
Write-Status "Checking cluster connectivity..."
try {
    $null = kubectl cluster-info 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Cannot connect to cluster"
    }
}
catch {
    Write-Error "Cannot connect to Kubernetes cluster. Please ensure:"
    Write-Error "1. Terraform has been applied successfully"
    Write-Error "2. AWS credentials are configured"
    Write-Error "3. kubeconfig is updated with: aws eks update-kubeconfig --region eu-west-1 --name shopping-list-test-cluster"
    exit 1
}

Write-Status "✅ Connected to cluster successfully"

# Step 1: Add Helm repositories
Write-Status "Adding Helm repositories..."
helm repo add eks https://aws.github.io/eks-charts
helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
helm repo update

# Step 2: Get Terraform outputs
Write-Status "Getting Terraform outputs..."
Push-Location terraform
$LOAD_BALANCER_CONTROLLER_ROLE_ARN = terraform output -raw aws_load_balancer_controller_role_arn
$EBS_CSI_CONTROLLER_ROLE_ARN = terraform output -raw ebs_csi_controller_role_arn
Pop-Location

Write-Status "Load Balancer Controller Role ARN: $LOAD_BALANCER_CONTROLLER_ROLE_ARN"
Write-Status "EBS CSI Controller Role ARN: $EBS_CSI_CONTROLLER_ROLE_ARN"

# Step 3: Create service accounts and annotate with IAM roles
Write-Status "Creating service accounts with IAM role annotations..."

# AWS Load Balancer Controller service account
kubectl create serviceaccount aws-load-balancer-controller -n kube-system --dry-run=client -o yaml | kubectl apply -f -
kubectl annotate serviceaccount aws-load-balancer-controller -n kube-system eks.amazonaws.com/role-arn="$LOAD_BALANCER_CONTROLLER_ROLE_ARN"

# EBS CSI Controller service account
kubectl create serviceaccount ebs-csi-controller-sa -n kube-system --dry-run=client -o yaml | kubectl apply -f -
kubectl annotate serviceaccount ebs-csi-controller-sa -n kube-system eks.amazonaws.com/role-arn="$EBS_CSI_CONTROLLER_ROLE_ARN"

# Step 4: Install AWS Load Balancer Controller
Write-Status "Installing AWS Load Balancer Controller..."
helm install aws-load-balancer-controller eks/aws-load-balancer-controller `
    --namespace kube-system `
    --set clusterName=shopping-list-test-cluster `
    --set serviceAccount.create=false `
    --set serviceAccount.name=aws-load-balancer-controller

# Wait for Load Balancer Controller to be ready
Write-Status "Waiting for AWS Load Balancer Controller to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=aws-load-balancer-controller -n kube-system --timeout=300s

# Step 5: Install EBS CSI Driver
Write-Status "Installing EBS CSI Driver..."
helm install aws-ebs-csi-driver aws-ebs-csi-driver/aws-ebs-csi-driver `
    --namespace kube-system `
    --set controller.serviceAccount.create=false `
    --set controller.serviceAccount.name=ebs-csi-controller-sa

# Wait for EBS CSI Driver to be ready
Write-Status "Waiting for EBS CSI Driver to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=aws-ebs-csi-driver -n kube-system --timeout=300s

# Step 6: Deploy Backend
Write-Status "Deploying backend application..."
helm install shopping-list-backend ./helm/backend --namespace default

# Wait for backend to be ready
Write-Status "Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=shopping-list-backend --timeout=300s

# Step 7: Deploy Frontend
Write-Status "Deploying frontend application..."
helm install shopping-list-frontend ./helm/frontend --namespace default

# Wait for frontend to be ready
Write-Status "Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=shopping-list-frontend --timeout=300s

# Step 8: Wait for ALB to be provisioned
Write-Status "Waiting for Application Load Balancers to be provisioned..."
Start-Sleep -Seconds 60

# Step 9: Get the ALB URLs
Write-Status "Getting ALB URLs..."
$FRONTEND_ALB = kubectl get ingress shopping-list-frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
$BACKEND_ALB = kubectl get ingress shopping-list-backend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend URL: http://$FRONTEND_ALB" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://$BACKEND_ALB" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 To check the status of your deployment:" -ForegroundColor Yellow
Write-Host "   kubectl get pods"
Write-Host "   kubectl get ingress"
Write-Host "   kubectl get services"
Write-Host ""
Write-Host "🔍 To view logs:" -ForegroundColor Yellow
Write-Host "   kubectl logs -l app.kubernetes.io/name=shopping-list-backend"
Write-Host "   kubectl logs -l app.kubernetes.io/name=shopping-list-frontend"
Write-Host ""
Write-Status "✅ Shopping List App is now deployed and ready to use!" 