# CI/CD Pipeline Setup Guide

This guide explains how to set up the automated CI/CD pipeline for the Shopping List App.

## 🔧 Required Setup

### 1. GitHub Repository Secrets

You need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

#### AWS Credentials

- **Name**: `AWS_ACCESS_KEY_ID`
- **Value**: Your AWS access key ID

- **Name**: `AWS_SECRET_ACCESS_KEY`
- **Value**: Your AWS secret access key

#### Docker Hub Credentials

- **Name**: `DOCKER_HUB_USERNAME`
- **Value**: Your Docker Hub username

- **Name**: `DOCKER_HUB_PASSWORD`
- **Value**: Your Docker Hub password or access token

### 2. Docker Hub Setup

1. **Create a Docker Hub account** (if you don't have one)
2. **Create an access token**:
   - Go to Docker Hub → Account Settings → Security
   - Click "New Access Token"
   - Give it a name (e.g., "GitHub Actions")
   - Copy the token and use it as `DOCKER_HUB_PASSWORD`

### 3. AWS IAM Permissions

Ensure your AWS user has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters",
        "eks:AccessKubernetesApi"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["ec2:DescribeInstances", "ec2:DescribeRegions"],
      "Resource": "*"
    }
  ]
}
```

## 🚀 How the Pipeline Works

### Trigger

- **On push to main branch**: Full build and deploy
- **On pull request**: Build and test only (no deploy)

### Pipeline Steps

1. **Build and Push Images**

   - Builds both backend and frontend Docker images
   - Pushes to Docker Hub with commit SHA as tag
   - Uses GitHub Actions cache for faster builds

2. **Deploy to EKS** (only on main branch)
   - Configures AWS credentials
   - Updates kubeconfig for EKS cluster
   - Installs/updates controllers (Load Balancer, EBS CSI)
   - Deploys applications with Helm
   - Tests the deployment
   - Comments on PRs with deployment URLs

## 📋 Manual Deployment vs CI/CD

### Before CI/CD (Manual)

```bash
# Build and push images
docker build -t yourusername/shopping-list-backend:latest ./backend
docker push yourusername/shopping-list-backend:latest

# Deploy to cluster
helm upgrade --install shopping-list-backend ./helm/backend \
  --set image.repository=yourusername/shopping-list-backend \
  --set image.tag=latest
```

### After CI/CD (Automatic)

```bash
# Just push to main branch
git push origin main
# Everything else happens automatically!
```

## 🔍 Monitoring the Pipeline

1. **View pipeline runs**: Go to your GitHub repo → **Actions** tab
2. **Check deployment status**: Look for green checkmarks
3. **View logs**: Click on any step to see detailed logs
4. **Get deployment URLs**: Check the "Get ALB URLs" step output

## 🛠️ Troubleshooting

### Common Issues

1. **Docker Hub authentication failed**

   - Check your Docker Hub credentials in GitHub secrets
   - Ensure your access token is valid

2. **AWS authentication failed**

   - Verify AWS credentials in GitHub secrets
   - Check IAM permissions

3. **EKS cluster not found**

   - Ensure the cluster name matches in the workflow
   - Verify AWS region is correct

4. **Helm deployment failed**
   - Check the Helm chart templates
   - Verify image tags are correct

### Debug Commands

```bash
# Check if secrets are set (in GitHub Actions)
echo "Docker Hub username: ${{ secrets.DOCKER_HUB_USERNAME }}"

# Test AWS connectivity
aws eks describe-cluster --name shopping-list-test-cluster --region eu-west-1

# Check Helm releases
helm list -n default
```

## 🎯 Benefits of This CI/CD Setup

- ✅ **Fully automated**: Push to main = automatic deployment
- ✅ **Versioned deployments**: Each commit gets a unique image tag
- ✅ **Rollback capability**: Can easily rollback to previous versions
- ✅ **Testing**: Automatic testing of deployments
- ✅ **Transparency**: Clear logs and status updates
- ✅ **Security**: Secrets are encrypted and secure

## 📝 Next Steps

1. **Set up the GitHub secrets** as described above
2. **Push your code** to the main branch
3. **Monitor the pipeline** in the Actions tab
4. **Access your application** via the ALB URLs provided

The pipeline will automatically handle everything else!
