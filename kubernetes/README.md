# Kubernetes Deployment

Self-hosted Kubernetes deployment for Automation Dashboard.

## Prerequisites

- Kubernetes 1.20+
- kubectl configured to access your cluster
- Docker images built and accessible:
  - `automation-dashboard-backend:latest`
  - `automation-dashboard-frontend:latest`

## Quick Start with kubectl

### 1. Create Secrets

Generate secure passwords first:

```bash
# Create namespace
kubectl apply -f kubernetes/namespace.yaml

# Create secrets template with your values
cat kubernetes/secrets-template.yaml | \
  sed 's/CHANGE_ME_SECURE_PASSWORD_HERE/your-secure-db-password/g' | \
  sed 's/CHANGE_ME_JWT_SECRET_KEY_32_CHARS_MIN/your-32-char-jwt-secret-here/g' | \
  sed 's/CHANGE_ME_ENCRYPTION_KEY_32_CHARS_MIN/your-32-char-encryption-key/g' | \
  kubectl apply -f -
```

### 2. Deploy PostgreSQL

```bash
kubectl apply -f kubernetes/postgres-deployment.yaml
```

Wait for PostgreSQL to be ready:
```bash
kubectl -n automation-dashboard wait --for=condition=ready pod -l app=postgres --timeout=300s
```

### 3. Deploy Backend

```bash
kubectl apply -f kubernetes/backend-deployment.yaml
```

Verify backend is running:
```bash
kubectl -n automation-dashboard get pods -l app=backend
```

### 4. Deploy Frontend

```bash
kubectl apply -f kubernetes/frontend-deployment.yaml
```

### 5. Set Up Ingress

First, install ingress controller (nginx):

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
```

Update `kubernetes/ingress.yaml` with your domain:

```bash
sed -i 's/automation-dashboard.example.com/your-domain.com/g' kubernetes/ingress.yaml
kubectl apply -f kubernetes/ingress.yaml
```

## Deployment with Helm

### 1. Update values

Edit `helm-chart/values.yaml` with your configuration:

```yaml
backend:
  image: automation-dashboard-backend
  tag: latest
  
frontend:
  image: automation-dashboard-frontend
  tag: latest
  
postgresql:
  auth:
    postgresPassword: your-secure-password
    
secrets:
  jwtSecret: "your-32-char-jwt-secret"
  encryptionKey: "your-32-char-encryption-key"
  
ingress:
  hosts:
    - host: your-domain.com
      paths:
        - path: /
          pathType: Prefix
```

### 2. Install Helm Chart

```bash
helm install automation-dashboard ./helm-chart \
  --namespace automation-dashboard \
  --create-namespace
```

### 3. Verify Installation

```bash
kubectl -n automation-dashboard get all
```

Access the application:
- Get the external IP: `kubectl -n automation-dashboard get ingress`
- Access at: `http://your-domain.com`

## Monitoring Deployments

Check pod status:
```bash
kubectl -n automation-dashboard get pods
```

View logs:
```bash
# Backend
kubectl -n automation-dashboard logs -f deploy/backend

# Frontend
kubectl -n automation-dashboard logs -f deploy/frontend

# PostgreSQL
kubectl -n automation-dashboard logs -f deploy/postgres
```

Check resource usage:
```bash
kubectl -n automation-dashboard top pods
```

## Scaling

### Manual Scaling

```bash
# Scale backend to 3 replicas
kubectl -n automation-dashboard scale deployment backend --replicas=3

# Scale frontend to 2 replicas
kubectl -n automation-dashboard scale deployment frontend --replicas=2
```

### Auto-scaling

HPA is configured in the manifests. Check status:

```bash
kubectl -n automation-dashboard get hpa
```

## Database Backups

### Backup PostgreSQL

```bash
kubectl -n automation-dashboard exec postgres-pod-name -- \
  pg_dump -U admin automation_dashboard > backup.sql
```

### Restore PostgreSQL

```bash
kubectl -n automation-dashboard exec -i postgres-pod-name -- \
  psql -U admin automation_dashboard < backup.sql
```

## Upgrades

### Update Docker Images

Edit deployment and change image tag:

```bash
kubectl -n automation-dashboard set image deployment/backend \
  backend=automation-dashboard-backend:v0.2.0

kubectl -n automation-dashboard set image deployment/frontend \
  frontend=automation-dashboard-frontend:v0.2.0
```

### Rollback to Previous Version

```bash
kubectl -n automation-dashboard rollout undo deployment/backend
kubectl -n automation-dashboard rollout undo deployment/frontend
```

## SSL/TLS

Install cert-manager for automatic certificate management:

```bash
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true
```

Create ClusterIssuer for Let's Encrypt:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

## Troubleshooting

### Pods not starting

```bash
# Check events
kubectl -n automation-dashboard describe pod <pod-name>

# Check logs
kubectl -n automation-dashboard logs <pod-name>
```

### Database connection errors

```bash
# Verify PostgreSQL is running
kubectl -n automation-dashboard get pods -l app=postgres

# Check database connectivity
kubectl -n automation-dashboard run -it --rm debug \
  --image=postgres:15-alpine --restart=Never -- \
  psql postgresql://admin:password@postgres:5432/automation_dashboard
```

### Ingress not working

```bash
# Check ingress resource
kubectl -n automation-dashboard get ingress

# Check ingress controller logs
kubectl -n ingress-nginx logs -f deployment/ingress-nginx-controller
```

## Cleanup

Remove entire deployment:

```bash
# Delete Helm release
helm uninstall automation-dashboard --namespace automation-dashboard

# Or delete namespace entirely
kubectl delete namespace automation-dashboard
```

## Further Reading

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [PostgreSQL on Kubernetes](https://www.postgresql.org/about/news/postgresql-in-kubernetes-41/)
