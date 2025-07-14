aws_region = "eu-west-1"
project_name = "shopping-list-test"
environment = "dev"
kubernetes_version = "1.28"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
availability_zones = ["eu-west-1a", "eu-west-1b"]
private_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
public_subnet_cidrs = ["10.0.101.0/24", "10.0.102.0/24"]

# Tags
common_tags = {
  Project     = "shopping-list-test"
  Environment = "dev"
  ManagedBy   = "terraform"
  Owner       = "devops-test"
  Purpose     = "devops-interview"
} 