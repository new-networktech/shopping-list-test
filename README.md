# 🛒 Shopping List App – DevOps Testaufgabe

Eine vollständige CI/CD-Pipeline und Infrastruktur auf AWS für einen professionell entwickelten Webservice: eine "Shopping List App" mit FastAPI-Backend und Next.js-Frontend.

## 🎯 Projektübersicht

Diese Anwendung demonstriert:

- **DevOps Skills**: Terraform, Kubernetes, CI/CD
- **Full-Stack Development**: FastAPI + Next.js
- **Cloud Infrastructure**: AWS EKS, EBS, S3, ALB
- **Containerization**: Docker + Helm
- **Best Practices**: Infrastructure as Code, GitOps

## 🏗️ Architektur

```
                User
                 ↓
           AWS ALB (Ingress)
                 ↓
         NGINX Ingress Controller
             ↙           ↘
        FastAPI         Next.js
         (API)         (Frontend)
             ↘           ↙
            PVC (EBS) / S3 Backup
```

## 🚀 Quick Start (Local Development)

### Prerequisites

- Docker Desktop
- Node.js 18+
- Python 3.9+
- Git

### Local Setup

```bash
# 1. Start local development
docker-compose up -d

# 2. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## 📁 Projektstruktur

```
.
├── backend/               # FastAPI App
├── frontend/              # Next.js App
├── helm/                  # Kubernetes Helm Charts
│   ├── backend/
│   └── frontend/
├── terraform/             # AWS Infrastructure
├── docker-compose.yml     # Local development
├── .gitlab-ci.yml         # CI/CD Pipeline
└── README.md
```

## 🛠️ Technologie-Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (React)
- **Infrastructure**: Terraform + AWS EKS
- **Containerization**: Docker + Helm
- **CI/CD**: GitLab CI
- **Storage**: EBS + S3
- **Load Balancing**: AWS ALB + Nginx Ingress

## 🌐 Deployment

### Local Development

```bash
docker-compose up -d
```

### Production (AWS EKS)

```bash
# 1. Deploy infrastructure
cd terraform/
terraform init
terraform apply

# 2. Deploy application
helm upgrade --install shopping-list ./helm/
```

## 📚 API Endpoints

- `GET /api/list` - Get shopping list
- `POST /api/add` - Add item to list
- `DELETE /api/remove/{item_id}` - Remove item
- `GET /api/defaults` - Get default items

## 🧹 Cleanup

### Local Development

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (optional - will delete all data)
docker-compose down -v

# Remove images (optional)
docker rmi shopping-list-test-backend shopping-list-test-frontend
```

### Production Infrastructure (AWS)

#### Option 1: Safe Destroy Script (Recommended)

```bash
# Linux/Mac
cd terraform/
chmod +x destroy.sh
./destroy.sh

# Windows PowerShell
cd terraform/
.\destroy.ps1
```

#### Option 2: Manual Terraform Destroy

```bash
cd terraform/
terraform destroy
```

#### Option 3: Force Destroy (if resources are stuck)

```bash
cd terraform/
terraform destroy -auto-approve
```

### What Gets Destroyed

- ✅ EKS Cluster and all worker nodes
- ✅ VPC, subnets, and networking components
- ✅ S3 bucket with all backup data
- ✅ IAM roles and policies
- ✅ Load balancers and security groups
- ✅ All associated AWS resources

### Manual Cleanup (if needed)

1. **Check AWS Console** for any remaining resources
2. **Delete S3 bucket contents** manually if bucket deletion fails
3. **Remove IAM roles** manually if they have dependencies
4. **Clean up local files**:
   ```bash
   rm -rf terraform/.terraform
   rm terraform/terraform.tfstate*
   ```


## 📝 License

MIT License
