# Automation Dashboard Helm Chart

Production-ready Helm chart for deploying Automation Dashboard to Kubernetes.

## Prerequisites

- Kubernetes 1.20+
- Helm 3.0+
- Docker images built and available:
  - `automation-dashboard-backend:latest`
  - `automation-dashboard-frontend:latest`

## Quick Start

### 1. Add Helm Repository (Optional)

```bash
helm repo add automation-dashboard https://your-registry.example.com/helm
helm repo update
```

### 2. Create Custom Values File

Copy the default values and customize:

```bash
cp helm-chart/values.yaml my-values.yaml
```

Edit `my-values.yaml` to set:
- Container image versions
- Replica counts
- Database password
- JWT secret
- Encryption key
- Domain name
- Resource limits

### 3. Install Chart

```bash
helm install automation-dashboard helm-chart \
  -f my-values.yaml \
  --namespace automation-dashboard \
  --create-namespace
```

Or using provided values:

```bash
helm install automation-dashboard helm-chart \
  --set postgresql.auth.postgresPassword=your-secure-password \
  --set secrets.jwtSecret=your-jwt-secret \
  --set secrets.encryptionKey=your-encryption-key \
  --set ingress.hosts[0].host=your-domain.com \
  --namespace automation-dashboard \
  --create-namespace
```

## Configuration

### Image Configuration

```yaml
backend:
  image: automation-dashboard-backend
  tag: latest
  pullPolicy: IfNotPresent

frontend:
  image: automation-dashboard-frontend
  tag: latest
  pullPolicy: IfNotPresent
```

### Scaling

```yaml
replicaCount:
  backend: 2
  frontend: 2

backend:
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80

frontend:
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 4
    targetCPUUtilizationPercentage: 70
```

### Database

```yaml
postgresql:
  enabled: true
  auth:
    username: admin
    postgresPassword: changeme
    database: automation_dashboard
  primary:
    persistence:
      enabled: true
      size: 10Gi
```

### Ingress

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: automation-dashboard.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: automation-dashboard-tls
      hosts:
        - automation-dashboard.example.com
```

## Installation Methods

### Method 1: Using Helm Values

```bash
helm install automation-dashboard helm-chart \
  --namespace automation-dashboard \
  --create-namespace \
  --values values-production.yaml
```

### Method 2: Using Command Line Flags

```bash
helm install automation-dashboard helm-chart \
  --namespace automation-dashboard \
  --create-namespace \
  --set backend.replicas=3 \
  --set frontend.replicas=2 \
  --set postgresql.auth.postgresPassword="$(openssl rand -base64 32)" \
  --set secrets.jwtSecret="$(openssl rand -base64 32)" \
  --set secrets.encryptionKey="$(openssl rand -base64 32)" \
  --set ingress.hosts[0].host=automation-dashboard.example.com
```

### Method 3: Using Helmfile (for GitOps)

Create `helmfile.yaml`:

```yaml
releases:
- name: automation-dashboard
  namespace: automation-dashboard
  createNamespace: true
  chart: ./helm-chart
  values:
  - backend:
      replicas: 3
    postgresql:
      auth:
        postgresPassword: "${DB_PASSWORD}"
    secrets:
      jwtSecret: "${JWT_SECRET}"
      encryptionKey: "${ENCRYPTION_KEY}"
```

Install with helmfile:

```bash
helmfile sync
```

## Verification

Check deployment status:

```bash
# List all resources
kubectl -n automation-dashboard get all

# Check pods
kubectl -n automation-dashboard get pods

# View resource usage
kubectl -n automation-dashboard top pods

# Get service info
kubectl -n automation-dashboard get svc

# Get ingress info
kubectl -n automation-dashboard get ingress
```

## Upgrading

### Update Chart Values

```bash
helm upgrade automation-dashboard helm-chart \
  -f my-values.yaml \
  --namespace automation-dashboard
```

### Update Container Images

```bash
helm upgrade automation-dashboard helm-chart \
  --set backend.tag=v0.2.0 \
  --set frontend.tag=v0.2.0 \
  --namespace automation-dashboard
```

### Rollback to Previous Release

```bash
helm rollback automation-dashboard 1 \
  --namespace automation-dashboard
```

## Uninstall

```bash
helm uninstall automation-dashboard \
  --namespace automation-dashboard
```

To also delete the namespace:

```bash
kubectl delete namespace automation-dashboard
```

## Production Considerations

### Security

1. **Secrets Management**
   - Use dedicated secret management (Vault, Sealed Secrets)
   - Never commit secrets to git
   - Rotate secrets regularly

2. **Network Policies**
   - Implement NetworkPolicies to restrict traffic
   - Use TLS for all connections
   - Consider service mesh (Istio, Linkerd)

3. **RBAC**
   - Create dedicated service accounts
   - Limit permissions to minimum required
   - Use pod security policies

### High Availability

1. **Multiple Replicas**
   - Set minReplicas ≥ 2 for all services
   - Use pod anti-affinity for better distribution
   - Configure PDB (Pod Disruption Budgets)

2. **Database**
   - Use managed PostgreSQL for production
   - Enable automated backups
   - Configure read replicas

3. **Load Balancing**
   - Use LoadBalancer service type
   - Configure health checks
   - Implement rate limiting

### Monitoring

1. **Logging**
   - Configure centralized logging (ELK, Loki)
   - Set appropriate log levels
   - Archive logs for compliance

2. **Metrics**
   - Install Prometheus for metrics collection
   - Configure Grafana dashboards
   - Set up alerts

3. **Tracing**
   - Consider distributed tracing (Jaeger, Zipkin)
   - Instrument applications
   - Monitor performance metrics

## Troubleshooting

### Chart Validation

```bash
helm lint helm-chart/
```

### Dry Run

```bash
helm install automation-dashboard helm-chart \
  --dry-run \
  --debug \
  --namespace automation-dashboard
```

### View Rendered Templates

```bash
helm template automation-dashboard helm-chart \
  -f my-values.yaml
```

### Check Release Status

```bash
helm status automation-dashboard -n automation-dashboard
helm history automation-dashboard -n automation-dashboard
```

### Pod Issues

```bash
# View pod logs
kubectl -n automation-dashboard logs <pod-name>

# Describe pod for events
kubectl -n automation-dashboard describe pod <pod-name>

# Execute command in pod
kubectl -n automation-dashboard exec -it <pod-name> -- /bin/bash
```

## Values Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `backend.image` | `automation-dashboard-backend` | Backend image name |
| `backend.tag` | `latest` | Backend image tag |
| `backend.port` | `8000` | Backend service port |
| `frontend.image` | `automation-dashboard-frontend` | Frontend image name |
| `frontend.tag` | `latest` | Frontend image tag |
| `frontend.port` | `3000` | Frontend service port |
| `postgresql.auth.postgresPassword` | `changeme` | PostgreSQL password |
| `secrets.jwtSecret` | `changeme-jwt-secret-32-chars-min` | JWT signing secret |
| `secrets.encryptionKey` | `changeme-encryption-32-chars-min` | Data encryption key |
| `ingress.enabled` | `true` | Enable ingress |
| `ingress.hosts[0].host` | `automation-dashboard.example.com` | Ingress hostname |

## Support

For issues and questions:
1. Check the [Kubernetes README](../kubernetes/README.md)
2. Review [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
3. Check pod logs and events
4. Report issues on GitHub

## License

Same as main project
