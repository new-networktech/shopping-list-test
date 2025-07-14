# Force cleanup script for remaining VPC resources
Write-Host "🧹 Force cleaning up remaining VPC resources..." -ForegroundColor Green

# Get VPC ID from terraform state
$VPC_ID = terraform state show module.vpc.aws_vpc.this[0] | Select-String "id" | ForEach-Object { ($_ -split '"')[1] }

if ($VPC_ID) {
    Write-Host "Found VPC: $VPC_ID" -ForegroundColor Yellow
    
    # Get subnets
    $SUBNET_IDS = @()
    $SUBNET_IDS += terraform state show module.vpc.aws_subnet.public[0] | Select-String "id" | ForEach-Object { ($_ -split '"')[1] }
    $SUBNET_IDS += terraform state show module.vpc.aws_subnet.public[1] | Select-String "id" | ForEach-Object { ($_ -split '"')[1] }
    
    # Get Internet Gateway
    $IGW_ID = terraform state show module.vpc.aws_internet_gateway.this[0] | Select-String "id" | ForEach-Object { ($_ -split '"')[1] }
    
    Write-Host "Found Subnets: $($SUBNET_IDS -join ', ')" -ForegroundColor Yellow
    Write-Host "Found IGW: $IGW_ID" -ForegroundColor Yellow
    
    # Detach and delete Internet Gateway
    if ($IGW_ID) {
        Write-Host "Detaching Internet Gateway..." -ForegroundColor Cyan
        aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID --region eu-west-1 2>$null
        
        Write-Host "Deleting Internet Gateway..." -ForegroundColor Cyan
        aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID --region eu-west-1 2>$null
    }
    
    # Delete subnets
    foreach ($SUBNET_ID in $SUBNET_IDS) {
        if ($SUBNET_ID) {
            Write-Host "Deleting subnet: $SUBNET_ID" -ForegroundColor Cyan
            aws ec2 delete-subnet --subnet-id $SUBNET_ID --region eu-west-1 2>$null
        }
    }
    
    # Delete VPC
    Write-Host "Deleting VPC: $VPC_ID" -ForegroundColor Cyan
    aws ec2 delete-vpc --vpc-id $VPC_ID --region eu-west-1 2>$null
    
    Write-Host "✅ VPC resources cleaned up!" -ForegroundColor Green
} else {
    Write-Host "❌ No VPC found in terraform state" -ForegroundColor Red
}

# Remove from terraform state
Write-Host "Removing resources from terraform state..." -ForegroundColor Yellow
terraform state rm module.vpc.aws_internet_gateway.this[0] 2>$null
terraform state rm module.vpc.aws_subnet.public[0] 2>$null
terraform state rm module.vpc.aws_subnet.public[1] 2>$null
terraform state rm module.vpc.aws_vpc.this[0] 2>$null

Write-Host "✅ Cleanup completed!" -ForegroundColor Green 