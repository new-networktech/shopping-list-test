# Terraform Infrastructure for Shopping List App

This directory contains the Terraform configuration for provisioning the AWS infrastructure required for the Shopping List application.

## 🏗️ Infrastructure Components

- **VPC** with public and private subnets across 2 availability zones
- **EKS Cluster** with 2 t3.medium worker nodes
- **S3 Bucket** for application backups and logs
- **IAM Roles and Policies** for EKS and Load Balancer Controller
- **Security Groups** and networking configuration

## 📋 Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **kubectl** for Kubernetes management
4. **AWS Load Balancer Controller** policy attached to your AWS account

## 🚀 Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Plan the Infrastructure

```bash
terraform plan
```

### 3. Apply the Infrastructure

```bash
terraform apply
```

### 4. Configure kubectl

```bash
aws eks update-kubeconfig --region eu-west-1 --name shopping-list-test-cluster
```

### 5. Verify the Cluster

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

## 🧹 Cleanup

To destroy all resources:

```bash
terraform destroy
```

## 📊 Outputs

After successful deployment, Terraform will output:

- `cluster_endpoint`: EKS cluster endpoint
- `cluster_certificate_authority_data`: CA certificate for kubectl
- `s3_bucket_name`: S3 bucket for backups
- `vpc_id`: VPC ID
- `private_subnets`: Private subnet IDs
- `public_subnets`: Public subnet IDs

## 🔧 Configuration

Edit `terraform.tfvars` to customize:

- AWS region
- Project name
- VPC CIDR blocks
- Availability zones
- Node group configuration

## 🛡️ Security Features

- Private subnets for worker nodes
- Public subnets only for load balancers
- S3 bucket with encryption and versioning
- IAM roles with least privilege access
- Security groups with minimal required access

## 💰 Cost Estimation

Estimated monthly cost (eu-west-1):

- EKS Cluster: ~$73/month
- 2x t3.medium nodes: ~$60/month
- NAT Gateway: ~$45/month
- S3 Storage: ~$5/month (depending on usage)
- **Total: ~$183/month**

_Note: Costs may vary based on usage and AWS pricing changes._
