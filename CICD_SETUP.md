# CI/CD Pipeline Setup Guide

This guide will help you set up the automated CI/CD pipeline for Marketing OS.

## Overview

The pipeline:
- ✅ Builds backend (TypeScript → JavaScript)
- ✅ Builds frontend (React + Vite)
- ✅ Deploys to EC2 via SSH
- ✅ Restarts services with PM2
- ✅ Reloads Nginx automatically

**Trigger:** Every push to the `production` branch (or manual trigger)

---

## Prerequisites

1. **GitHub Repository** - Your code pushed to GitHub
2. **EC2 Instance** - Running the application
3. **SSH Key Pair** - For GitHub to connect to EC2
4. **Node.js 18+** - On your EC2 instance

---

## Step 1: Create SSH Key Pair (if you don't have one)

### On your local machine:
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/ec2-deploy-key -C "github-deploy"
```

Leave the passphrase empty for CI/CD automation.

### Copy public key to EC2:
```bash
# From your local machine
ssh-copy-id -i ~/.ssh/ec2-deploy-key.pub ec2-user@your-ec2-ip
```

Or manually add to `~/.ssh/authorized_keys` on EC2.

---

## Step 2: Get Your SSH Private Key

```bash
cat ~/.ssh/ec2-deploy-key
```

Copy the entire output (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`).

---

## Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

| Secret Name | Value |
|---|---|
| `EC2_HOST` | Your EC2 public IP or domain (e.g., `13.233.177.3`) |
| `EC2_USER` | `ec2-user` (for Amazon Linux 2023) |
| `EC2_SSH_KEY` | Paste the entire private key from Step 2 |

**Example:**
- `EC2_HOST`: `13.233.177.3`
- `EC2_USER`: `ec2-user`
- `EC2_SSH_KEY`: (full RSA private key)

---

## Step 4: Make `deploy.sh` Executable on EC2

SSH into your EC2 instance:
```bash
ssh -i ~/.ssh/ec2-deploy-key ec2-user@your-ec2-ip

# Make script executable
chmod +x ~/marketting-os/deploy.sh

# Verify it works
bash ~/marketting-os/deploy.sh
```

---

## Step 5: Create `production` Branch

```bash
git checkout -b production
git push origin production
```

Or rename your current branch:
```bash
git branch -m main production
git push -u origin production
```

---

## Step 6: Push to Trigger Pipeline

```bash
# Make some changes
git add .
git commit -m "Deploy to production"
git push origin production
```

Watch the pipeline run:
1. Go to GitHub repo
2. Click **Actions** tab
3. See your workflow running

---

## Monitoring Deployment

### GitHub Actions Dashboard
- Shows build logs
- Displays success/failure status
- Can re-run failed deployments

### On EC2, Check Logs
```bash
# PM2 logs
pm2 logs marketing-os-api

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Process status
pm2 status
```

---

## Troubleshooting

### Connection Refused
```bash
# Check if server is running
pm2 list

# Check port 8000
lsof -i :8000

# Restart manually
cd ~/marketting-os/marketing-os-server
npm start
```

### Nginx Not Reloading
```bash
# Test config
sudo nginx -t

# View errors
sudo systemctl status nginx
```

### SSH Connection Failed
- Verify EC2 security group allows SSH (port 22)
- Check private key permissions: `chmod 600 ~/.ssh/ec2-deploy-key`
- Verify public key is in EC2's `~/.ssh/authorized_keys`

### Build Fails
- Check Node.js version: `node -v` (should be 18+)
- Clear node_modules: `rm -rf node_modules && npm ci`
- Check tsconfig.json for TypeScript errors

---

## Deployment Workflow Summary

```
Developer pushes to `production` branch
           ↓
GitHub Actions triggers workflow
           ↓
Build backend (npm run build)
           ↓
Build frontend (npm run build)
           ↓
Compress artifacts
           ↓
SSH into EC2
           ↓
Copy files to server
           ↓
Run deploy.sh
           ↓
PM2 restarts backend
           ↓
Nginx reloads
           ↓
✅ Live in production!
```

---

## Optional: Environment Variables

If you need to pass `.env` variables to EC2:

1. Add them as GitHub Secrets (e.g., `DATABASE_URL`)
2. Modify `.github/workflows/deploy.yml` to create `.env` file before deployment
3. Example:
```yaml
- name: Create .env file
  run: |
    echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" > marketing-os-server/.env
    scp marketing-os-server/.env ${{ secrets.EC2_USER }}@...
```

---

## Rollback to Previous Version

If deployment fails:

```bash
# on EC2
git checkout main  # or previous commit
npm run build
pm2 restart marketing-os-api
sudo systemctl reload nginx
```

---

## Next Steps

1. Test locally: `npm run build`
2. Push to GitHub `production` branch
3. Watch Actions tab
4. Check your site at `https://app.wayon.in`

For questions or issues, check PM2/Nginx logs first!
