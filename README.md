# Shopping List App - DevOps Test Task

A complete DevOps solution featuring a FastAPI backend and Next.js frontend deployed on AWS EKS with Terraform, Helm, and automated CI/CD.

## 🏗️ Architecture

- **Infrastructure**: AWS EKS cluster provisioned with Terraform
- **Backend**: FastAPI application with S3 data persistence
- **Frontend**: Next.js application with modern UI
- **Load Balancing**: AWS Application Load Balancer (ALB) with ingress controller
- **Storage**: EBS volumes for persistent data + S3 backup
- **Monitoring**: Health checks and auto-scaling

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform installed
- kubectl installed
- Helm installed
- Docker installed

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd shopping-list-test
```

### 2. Deploy Infrastructure

```bash
cd terraform
terraform init
terraform apply -auto-approve
```

### 3. Update Kubeconfig

```bash
aws eks update-kubeconfig --region eu-west-1 --name shopping-list-test-cluster
```

### 4. Automated Application Deployment

**For Linux/Mac:**

```bash
chmod +x deploy.sh
./deploy.sh
```

**For Windows:**

```powershell
.\deploy.ps1
```

### 5. Access Your Application

The deployment script will output the URLs for your frontend and backend applications.

## 🔄 CI/CD Pipeline (Optional)

For automated deployments, set up the GitHub Actions CI/CD pipeline:

1. **Set up GitHub secrets** (see `CI-CD-SETUP.md` for details):

   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `DOCKER_HUB_USERNAME`
   - `DOCKER_HUB_PASSWORD`

2. **Push to main branch** - the pipeline will automatically:
   - Build and push Docker images to Docker Hub
   - Deploy to EKS cluster
   - Test the deployment
   - Provide ALB URLs in the pipeline output

See `CI-CD-SETUP.md` for detailed setup instructions.

## 🔧 Manual Deployment (if needed)

If you prefer to deploy manually or troubleshoot:

### 1. Install Controllers

```bash
# Add Helm repositories
helm repo add eks https://aws.github.io/eks-charts
helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
helm repo update

# Get IAM role ARNs from Terraform
cd terraform
LOAD_BALANCER_CONTROLLER_ROLE_ARN=$(terraform output -raw aws_load_balancer_controller_role_arn)
EBS_CSI_CONTROLLER_ROLE_ARN=$(terraform output -raw ebs_csi_controller_role_arn)
cd ..

# Create service accounts with IAM role annotations
kubectl create serviceaccount aws-load-balancer-controller -n kube-system
kubectl annotate serviceaccount aws-load-balancer-controller -n kube-system eks.amazonaws.com/role-arn="$LOAD_BALANCER_CONTROLLER_ROLE_ARN"

kubectl create serviceaccount ebs-csi-controller-sa -n kube-system
kubectl annotate serviceaccount ebs-csi-controller-sa -n kube-system eks.amazonaws.com/role-arn="$EBS_CSI_CONTROLLER_ROLE_ARN"

# Install AWS Load Balancer Controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    --namespace kube-system \
    --set clusterName=shopping-list-test-cluster \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller

# Install EBS CSI Driver
helm install aws-ebs-csi-driver aws-ebs-csi-driver/aws-ebs-csi-driver \
    --namespace kube-system \
    --set controller.serviceAccount.create=false \
    --set serviceAccount.name=ebs-csi-controller-sa
```

### 2. Deploy Applications

```bash
# Deploy backend
helm install shopping-list-backend ./helm/backend --namespace default

# Deploy frontend
helm install shopping-list-frontend ./helm/frontend --namespace default
```

## 📁 Project Structure

```
shopping-list-test/
├── terraform/                 # Infrastructure as Code
│   ├── main.tf               # EKS cluster, VPC, IAM roles
│   ├── variables.tf          # Terraform variables
│   └── terraform.tfvars      # Variable values
├── backend/                  # FastAPI application
│   ├── main.py              # API endpoints
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile          # Container image
├── frontend/                # Next.js application
│   ├── package.json        # Node.js dependencies
│   ├── pages/              # React components
│   └── Dockerfile          # Container image
├── helm/                    # Helm charts
│   ├── backend/            # Backend deployment chart
│   └── frontend/           # Frontend deployment chart
├── deploy.sh               # Linux/Mac deployment script
├── deploy.ps1              # Windows deployment script
└── README.md               # This file
```

## 🔍 Troubleshooting

### Common Issues

1. **Service Selector Mismatch**: If you see 503 errors, check that service selectors match pod labels
2. **IAM Permission Errors**: Ensure AWS Load Balancer Controller has proper IAM permissions
3. **CORS Errors**: Backend CORS settings are configured for the frontend ALB DNS

### Useful Commands

```bash
# Check cluster status
kubectl get nodes
kubectl get pods --all-namespaces

# Check ingress status
kubectl get ingress
kubectl describe ingress shopping-list-frontend

# View logs
kubectl logs -l app.kubernetes.io/name=shopping-list-backend
kubectl logs -l app.kubernetes.io/name=shopping-list-frontend

# Check service endpoints
kubectl get endpoints shopping-list-backend
kubectl get endpoints shopping-list-frontend
```

## 🧹 Cleanup

To destroy all resources safely:

### **Option 1: Automated Cleanup (Recommended)**

**For Linux/Mac:**

```bash
cd terraform
chmod +x destroy.sh
./destroy.sh
```

**For Windows:**

```powershell
cd terraform
.\destroy.ps1
```

The automated scripts will:

- Clean up Kubernetes resources (Helm releases, services, etc.)
- Delete AWS Load Balancers and target groups
- Clean S3 bucket contents
- Run `terraform destroy` with proper dependency handling

### **Option 2: Manual Cleanup**

```bash
# Delete Helm releases
helm uninstall shopping-list-frontend
helm uninstall shopping-list-backend
helm uninstall aws-ebs-csi-driver
helm uninstall aws-load-balancer-controller

# Destroy Terraform infrastructure
cd terraform
terraform destroy -auto-approve
```

**Note**: The automated scripts handle dependency issues that can cause manual `terraform destroy` to fail.

## 🎯 Features

- ✅ **Infrastructure as Code**: Complete Terraform setup
- ✅ **Container Orchestration**: Kubernetes with EKS
- ✅ **Load Balancing**: AWS ALB with ingress controller
- ✅ **Persistent Storage**: EBS volumes + S3 backup
- ✅ **Auto-scaling**: Horizontal Pod Autoscaler
- ✅ **Health Monitoring**: Liveness and readiness probes
- ✅ **Automated Deployment**: One-command deployment scripts
- ✅ **CI/CD Pipeline**: GitHub Actions with automatic build and deploy
- ✅ **Modern UI**: Responsive Next.js frontend
- ✅ **RESTful API**: FastAPI backend with OpenAPI docs

## 📝 Notes

- The deployment scripts automatically handle all post-Terraform setup
- IAM roles and service accounts are created with proper annotations
- CORS is configured to allow frontend-backend communication
- All Helm templates use consistent labeling for proper service discovery
