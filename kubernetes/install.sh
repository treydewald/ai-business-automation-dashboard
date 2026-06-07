#!/bin/bash

set -e

echo "=== Automation Dashboard Kubernetes Installation ==="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
  echo -e "${YELLOW}Checking prerequisites...${NC}"

  if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl not found. Please install kubectl.${NC}"
    exit 1
  fi

  if ! command -v helm &> /dev/null; then
    echo -e "${YELLOW}Helm not installed. You can still use kubectl to deploy.${NC}"
  fi

  echo -e "${GREEN}Prerequisites OK${NC}"
}

# Get configuration
get_config() {
  echo -e "${YELLOW}Configuration${NC}"

  read -p "Enter domain name (default: automation-dashboard.example.com): " DOMAIN
  DOMAIN=${DOMAIN:-automation-dashboard.example.com}

  read -s -p "Enter PostgreSQL password: " DB_PASSWORD
  echo

  read -s -p "Enter JWT secret (min 32 chars): " JWT_SECRET
  echo

  read -s -p "Enter encryption key (min 32 chars): " ENCRYPTION_KEY
  echo

  read -p "Use Helm for installation? (y/n, default: n): " USE_HELM
  USE_HELM=${USE_HELM:-n}
}

# Deploy with kubectl
deploy_with_kubectl() {
  echo -e "${YELLOW}Deploying with kubectl...${NC}"

  # Create namespace
  echo "Creating namespace..."
  kubectl apply -f kubernetes/namespace.yaml

  # Create secrets
  echo "Creating secrets..."
  kubectl -n automation-dashboard create secret generic postgres-secret \
    --from-literal=password="$DB_PASSWORD" \
    --dry-run=client -o yaml | kubectl apply -f -

  kubectl -n automation-dashboard create secret generic jwt-secret \
    --from-literal=secret="$JWT_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -

  kubectl -n automation-dashboard create secret generic encryption-secret \
    --from-literal=key="$ENCRYPTION_KEY" \
    --dry-run=client -o yaml | kubectl apply -f -

  # Deploy PostgreSQL
  echo "Deploying PostgreSQL..."
  kubectl apply -f kubernetes/postgres-deployment.yaml
  echo "Waiting for PostgreSQL to be ready..."
  kubectl -n automation-dashboard wait --for=condition=ready pod -l app=postgres --timeout=300s

  # Deploy backend
  echo "Deploying backend..."
  kubectl apply -f kubernetes/backend-deployment.yaml

  # Deploy frontend
  echo "Deploying frontend..."
  kubectl apply -f kubernetes/frontend-deployment.yaml

  # Update and deploy ingress
  echo "Configuring ingress..."
  sed "s/automation-dashboard.example.com/$DOMAIN/g" kubernetes/ingress.yaml | kubectl apply -f -

  echo -e "${GREEN}Deployment completed!${NC}"
}

# Deploy with Helm
deploy_with_helm() {
  echo -e "${YELLOW}Deploying with Helm...${NC}"

  echo "Installing Helm chart..."
  helm install automation-dashboard ./helm-chart \
    --namespace automation-dashboard \
    --create-namespace \
    --set ingress.hosts[0].host="$DOMAIN" \
    --set postgresql.auth.postgresPassword="$DB_PASSWORD" \
    --set secrets.jwtSecret="$JWT_SECRET" \
    --set secrets.encryptionKey="$ENCRYPTION_KEY"

  echo -e "${GREEN}Helm deployment completed!${NC}"
}

# Print next steps
print_next_steps() {
  echo ""
  echo -e "${YELLOW}=== Next Steps ===${NC}"
  echo ""
  echo "1. Verify deployment status:"
  echo "   kubectl -n automation-dashboard get pods"
  echo ""
  echo "2. Get your service information:"
  echo "   kubectl -n automation-dashboard get svc"
  echo ""
  echo "3. Configure DNS for your domain:"
  echo "   - Point $DOMAIN to your Kubernetes cluster IP/LoadBalancer"
  echo ""
  echo "4. Access the application:"
  echo "   - Open browser and navigate to: http://$DOMAIN"
  echo ""
  echo "5. View logs:"
  echo "   kubectl -n automation-dashboard logs -f deploy/backend"
  echo ""
}

# Main
main() {
  check_prerequisites
  get_config

  if [[ "$USE_HELM" == "y" || "$USE_HELM" == "Y" ]]; then
    deploy_with_helm
  else
    deploy_with_kubectl
  fi

  print_next_steps
}

main
