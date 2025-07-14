# Test script to verify deployment is working
Write-Host "🧪 Testing Shopping List App Deployment..." -ForegroundColor Green

# Get ALB URLs
$FRONTEND_ALB = kubectl get ingress shopping-list-frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
$BACKEND_ALB = kubectl get ingress shopping-list-backend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

Write-Host "📱 Frontend URL: http://$FRONTEND_ALB" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://$BACKEND_ALB" -ForegroundColor Cyan

# Test backend API
Write-Host "`n🔍 Testing Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://$BACKEND_ALB/api/list" -Method GET -TimeoutSec 10
    Write-Host "✅ Backend API is responding correctly" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Depth 1)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Backend API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test frontend
Write-Host "`n🔍 Testing Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$FRONTEND_ALB" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is responding correctly" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend returned status code: $($response.StatusCode)" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Frontend test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check service endpoints
Write-Host "`n🔍 Checking Service Endpoints..." -ForegroundColor Yellow
$backendEndpoints = kubectl get endpoints shopping-list-backend -o jsonpath='{.subsets[0].addresses[*].ip}'
$frontendEndpoints = kubectl get endpoints shopping-list-frontend -o jsonpath='{.subsets[0].addresses[*].ip}'

if ($backendEndpoints) {
    Write-Host "✅ Backend service has endpoints: $backendEndpoints" -ForegroundColor Green
} else {
    Write-Host "❌ Backend service has no endpoints" -ForegroundColor Red
}

if ($frontendEndpoints) {
    Write-Host "✅ Frontend service has endpoints: $frontendEndpoints" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend service has no endpoints" -ForegroundColor Red
}

Write-Host "`n🎉 Deployment test completed!" -ForegroundColor Green 