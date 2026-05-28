# Complete Database Restoration Guide

Step-by-step instructions to restore the CSMS database from backup on a new VPS.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Prepare New VPS](#prepare-new-vps)
3. [Transfer Backup Files](#transfer-backup-files)
4. [Restore Database](#restore-database)
5. [Configure Environment](#configure-environment)
6. [Setup MinIO for Documents](#setup-minio-for-documents)
7. [Deploy Application](#deploy-application)
8. [Verify Restoration](#verify-restoration)
9. [Post-Restoration Tasks](#post-restoration-tasks)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Root/sudo access to new VPS
- [ ] Backup archive file (`.tar.gz`)
- [ ] Database credentials
- [ ] MinIO credentials (for documents)
- [ ] GitHub access to clone application code

---

## Prepare New VPS

### Step 1: Update System Packages

```bash
# Connect to new VPS
ssh root@your-new-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip
```

### Step 2: Install PostgreSQL

```bash
# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### Step 3: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -i -u postgres

# Set password for postgres user
psql -c "ALTER USER postgres WITH PASSWORD 'Mamlaka2020';"

# Exit postgres user
exit

# Edit PostgreSQL configuration for remote access
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Find and update:
```conf
listen_addresses = '*'
```

```bash
# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Add at the end:
```conf
# Allow all connections with password
host    all    all    0.0.0.0/0    md5
host    all    all    ::/0         md5
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 4: Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install global packages
sudo npm install -g pm2
```

### Step 5: Install MinIO

```bash
# Download MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create MinIO user
sudo useradd -r minio-user -s /sbin/nologin 2>/dev/null || true

# Create data directory
sudo mkdir -p /data/minio
sudo chown minio-user:minio-user /data/minio

# Create systemd service
sudo nano /etc/systemd/system/minio.service
```

Add this content:
```ini
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target

[Service]
User=minio-user
Group=minio-user
EnvironmentFile=-/etc/default/minio
ExecStart=/usr/local/bin/minio server /data/minio
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Configure MinIO environment
sudo nano /etc/default/minio
```

Add:
```conf
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_VOLUMES="/data/minio"
MINIO_OPTS="--console-address :9001"
```

```bash
# Start MinIO
sudo systemctl daemon-reload
sudo systemctl start minio
sudo systemctl enable minio

# Check MinIO status
sudo systemctl status minio
```

---

## Transfer Backup Files

### Option A: Transfer from GitHub

```bash
# Clone repository
cd /opt
git clone https://github.com/yussufrajab/nextjs.git
cd nextjs/docs/database

# Backup files are now available
ls -lh *.tar.gz
```

### Option B: Transfer from Old VPS

```bash
# From your local machine, download from old VPS
scp root@old-vps-ip:/home/latest/docs/database/csms-disaster-recovery-with-employees-*.tar.gz ./

# Upload to new VPS
scp csms-disaster-recovery-with-employees-*.tar.gz root@new-vps-ip:/tmp/
```

### Option C: Transfer Using SCP

```bash
# On new VPS, pull from old VPS directly
scp root@old-vps-ip:/home/latest/docs/database/csms-disaster-recovery-with-employees-*.tar.gz /tmp/
```

---

## Restore Database

### Step 1: Extract Backup Archive

```bash
# Navigate to backup location
cd /tmp

# Or if from GitHub
cd /opt/nextjs/docs/database

# Extract archive
tar -xzf csms-disaster-recovery-with-employees-*.tar.gz

# Enter extracted directory
cd csms-disaster-recovery-with-employees-*

# List contents
ls -la
```

You should see:
```
schema.prisma
schema_full_YYYYMMDD_HHMMSS.sql
nody_with_employees_YYYYMMDD_HHMMSS.sql
migrations/
backup-with-employees.sh
disaster-recovery.sh
...documentation files
```

### Step 2: Create Database

```bash
# Create the nody database
sudo -u postgres createdb nody

# Verify database was created
sudo -u postgres psql -c "\l" | grep nody
```

### Step 3: Restore Schema

```bash
# Restore database schema
sudo -u postgres psql -d nody -f schema_full_*.sql
```

Expected output:
```
CREATE TABLE
CREATE INDEX
CREATE TABLE
...
```

### Step 4: Restore Data

```bash
# Restore all data including employees
sudo -u postgres psql -d nody -f nody_with_employees_*.sql
```

Expected output:
```
SET
SET
SET
...
COPY XXX
COPY XXX
...
```

### Step 5: Verify Database Restoration

```bash
# Connect to database
sudo -u postgres psql -d nody
```

Run verification queries:
```sql
-- Check tables exist
\dt

-- Count records in key tables
SELECT 'Employee' as table_name, count(*) FROM "Employee"
UNION ALL
SELECT 'User', count(*) FROM "User"
UNION ALL
SELECT 'Institution', count(*) FROM "Institution"
UNION ALL
SELECT 'PromotionRequest', count(*) FROM "PromotionRequest"
UNION ALL
SELECT 'ConfirmationRequest', count(*) FROM "ConfirmationRequest"
UNION ALL
SELECT 'RetirementRequest', count(*) FROM "RetirementRequest";

-- Check admin user exists
SELECT username, role FROM "User" WHERE role = 'ADMIN';

-- Exit
\q
```

---

## Configure Environment

### Step 1: Setup Application

```bash
# Navigate to application directory
cd /opt/nextjs

# Copy environment template
cp .env.example .env

# Or create new .env file
nano .env
```

### Step 2: Configure Database Connection

Add to `.env`:
```env
# Database
DATABASE_URL="postgresql://postgres:Mamlaka2020@localhost:5432/nody?schema=public"

# Application
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://your-vps-ip:9002"

# MinIO Configuration
MINIO_ENDPOINT="localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="csms-documents"
MINIO_USE_SSL="false"

# Application Port
PORT=9002
```

### Step 3: Generate Secrets

```bash
# Generate random secret for NEXTAUTH_SECRET
openssl rand -base64 32
```

Copy the output and use it as `NEXTAUTH_SECRET` value.

---

## Setup MinIO for Documents

### Step 1: Install MinIO Client

```bash
# Download MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
```

### Step 2: Configure MinIO Client

```bash
# Add MinIO alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Verify connection
mc admin info local
```

### Step 3: Create Bucket

```bash
# Create the documents bucket
mc mb local/csms-documents

# Verify bucket
mc ls local/
```

### Step 4: Restore Documents (If Backup Available)

If you have a MinIO backup from the old VPS:

```bash
# Option A: Mirror from backup location
mc mirror /path/to/minio-backup/csms-documents local/csms-documents

# Option B: Sync from old MinIO server
mc alias set old-vps http://old-vps-ip:9000 minioadmin minioadmin
mc mirror old-vps/csms-documents local/csms-documents

# Option C: Restore from S3-compatible storage
mc alias set s3 https://s3.amazonaws.com your-access-key your-secret-key
mc mirror s3/your-backup-bucket/csms-documents local/csms-documents
```

### Step 5: Set Bucket Policy (Public Read for Images)

```bash
# Create policy file
cat > /tmp/minio-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["*"]
      },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::csms-documents/employee-photos/*"]
    }
  ]
}
EOF

# Apply policy
mc anonymous set-json /tmp/minio-policy.json local/csms-documents
```

### Step 6: Verify MinIO Setup

```bash
# List bucket contents (should be empty or show restored files)
mc ls local/csms-documents/

# Check bucket info
mc stat local/csms-documents
```

---

## Deploy Application

### Step 1: Install Dependencies

```bash
# Navigate to application directory
cd /opt/nextjs

# Install npm dependencies
npm install

# If you encounter errors, try:
npm install --legacy-peer-deps
```

### Step 2: Generate Prisma Client

```bash
# Generate Prisma client
npx prisma generate
```

### Step 3: Run Database Migrations

```bash
# Check migration status
npx prisma migrate status

# Deploy any pending migrations
npx prisma migrate deploy
```

### Step 4: Build Application

```bash
# Build for production
npm run build
```

### Step 5: Start Application with PM2

```bash
# Start application
pm2 start npm --name "csms" -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs

# Check application status
pm2 status
```

### Step 6: Verify Application is Running

```bash
# Check if application is listening on port 9002
netstat -tlnp | grep 9002

# Or using curl
curl http://localhost:9002
```

---

## Verify Restoration

### Step 1: Access Application

Open browser and navigate to:
```
http://your-vps-ip:9002
```

### Step 2: Test Login

1. You should see the login page
2. Login with admin credentials:
   - Username: `admin` (or your admin username)
   - Password: (from your old system)

### Step 3: Verify Data Integrity

After logging in, verify:

- [ ] **Dashboard loads** - Check main dashboard
- [ ] **Employees visible** - Go to Employees section
- [ ] **Institutions listed** - Check Institutions page
- [ ] **Requests accessible** - View pending requests
- [ ] **User management** - Check Users section
- [ ] **Audit logs** - View audit trail

### Step 4: Test Employee Documents

1. Go to an employee profile
2. Try to view their photo
3. Try to download a certificate

If documents don't load:
- Check MinIO connection
- Verify MinIO bucket has files
- Check application logs for errors

### Step 5: Test Request Workflows

1. Create a test request (e.g., Promotion Request)
2. Verify it appears in the list
3. Test approval workflow
4. Delete test request

---

## Post-Restoration Tasks

### Task 1: Update DNS/Domain

If using a domain name:

```bash
# Update DNS records to point to new VPS IP
# A Record: yourdomain.com -> new-vps-ip

# Update .env with domain
nano /opt/nextjs/.env
```

Update:
```env
NEXTAUTH_URL="https://yourdomain.com"
```

```bash
# Restart application
pm2 restart csms
```

### Task 2: Setup SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot

# Get SSL certificate (if using Nginx)
sudo certbot --nginx -d yourdomain.com

# Or standalone
sudo certbot certonly --standalone -d yourdomain.com
```

### Task 3: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/csms
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/csms /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Task 4: Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MinIO (if external access needed)
sudo ufw allow 9000/tcp
sudo ufw allow 9001/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Task 5: Setup Automated Backups

```bash
# Copy backup scripts to accessible location
cp /opt/nextjs/docs/database/backup-with-employees.sh /usr/local/bin/
cp /opt/nextjs/docs/database/package-backup-with-employees.sh /usr/local/bin/

# Make executable
chmod +x /usr/local/bin/backup-with-employees.sh
chmod +x /usr/local/bin/package-backup-with-employees.sh

# Create backup directory
mkdir -p /var/backups/csms

# Edit crontab
crontab -e
```

Add:
```cron
# Daily database backup at 2 AM
0 2 * * * /usr/local/bin/backup-with-employees.sh >> /var/log/csms-backup.log 2>&1

# Weekly package backup on Sunday at 3 AM
0 3 * * 0 /usr/local/bin/package-backup-with-employees.sh >> /var/log/csms-backup.log 2>&1

# Cleanup old backups (keep 7 days)
0 4 * * * find /var/backups/csms -name "*.sql" -mtime +7 -delete
0 4 * * * find /var/backups/csms -name "*.tar.gz" -mtime +30 -delete
```

### Task 6: Setup Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Check application logs
pm2 logs csms

# Check system resources
htop

# Check disk space
df -h
```

---

## Troubleshooting

### Issue: PostgreSQL Connection Refused

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Check if listening on correct port
sudo netstat -tlnp | grep 5432

# Check pg_hba.conf for authentication issues
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

### Issue: Database Already Exists

```bash
# Drop and recreate database
sudo -u postgres dropdb nody
sudo -u postgres createdb nody

# Then restore again
sudo -u postgres psql -d nody -f schema_full_*.sql
sudo -u postgres psql -d nody -f nody_with_employees_*.sql
```

### Issue: Permission Denied on Restore

```bash
# Run as postgres user
sudo -u postgres psql -d nody -f schema_full_*.sql

# Or disable triggers temporarily
sudo -u postgres psql -d nody -c "SET session_replication_role = 'replica';"
sudo -u postgres psql -d nody -f nody_with_employees_*.sql
sudo -u postgres psql -d nody -c "SET session_replication_role = 'origin';"
```

### Issue: Application Won't Start

```bash
# Check application logs
pm2 logs csms

# Check for port conflicts
sudo netstat -tlnp | grep 9002

# Kill process on port if needed
sudo kill $(sudo lsof -t -i:9002)

# Restart application
pm2 restart csms
```

### Issue: MinIO Documents Not Loading

```bash
# Check MinIO status
mc admin info local

# Verify bucket exists
mc ls local/

# Check bucket permissions
mc anonymous list local/csms-documents

# Test file upload
echo "test" > /tmp/test.txt
mc cp /tmp/test.txt local/csms-documents/test.txt
mc ls local/csms-documents/
mc rm local/csms-documents/test.txt
```

### Issue: Employee Photos Not Showing

```bash
# Check if photos exist in MinIO
mc ls local/csms-documents/employee-photos/

# Verify photo URL format in database
sudo -u postgres psql -d nody -c "SELECT id, \"profileImageUrl\" FROM \"Employee\" LIMIT 5;"

# Check application logs for MinIO errors
pm2 logs csms | grep -i minio
```

### Issue: Foreign Key Constraint Errors

```bash
# Disable constraints during restore
sudo -u postgres psql -d nody << 'EOF'
SET session_replication_role = 'replica';
-- Run restore here
EOF

# Re-enable constraints
sudo -u postgres psql -d nody << 'EOF'
SET session_replication_role = 'origin';
EOF
```

### Issue: Out of Disk Space

```bash
# Check disk usage
df -h

# Find large files
sudo du -sh /* 2>/dev/null | sort -rh | head -20

# Clean up apt cache
sudo apt clean

# Remove old logs
sudo journalctl --vacuum-time=7d

# Check PostgreSQL data size
sudo du -sh /var/lib/postgresql/
```

---

## Quick Reference Commands

### Database Operations

```bash
# Connect to database
sudo -u postgres psql -d nody

# Backup database
sudo -u postgres pg_dump nody > /tmp/nody_backup.sql

# Restore database
sudo -u postgres psql -d nody < /tmp/nody_backup.sql

# Check database size
sudo -u postgres psql -d nody -c "SELECT pg_size_pretty(pg_database_size('nody'));"
```

### Application Operations

```bash
# View logs
pm2 logs csms

# Restart application
pm2 restart csms

# Stop application
pm2 stop csms

# Check status
pm2 status

# Monitor resources
pm2 monit
```

### MinIO Operations

```bash
# List files
mc ls local/csms-documents/

# Upload file
mc cp /path/to/file.pdf local/csms-documents/path/

# Download file
mc cp local/csms-documents/path/file.pdf /local/path/

# Remove file
mc rm local/csms-documents/path/file.pdf

# Mirror directory
mc mirror /local/dir/ local/csms-documents/dir/
```

### System Operations

```bash
# Check system resources
htop

# Check disk space
df -h

# Check memory
free -h

# Check network connections
sudo netstat -tlnp

# Restart services
sudo systemctl restart postgresql
sudo systemctl restart minio
sudo systemctl restart nginx
```

---

## Recovery Checklist

Use this checklist to ensure complete restoration:

### Pre-Restoration
- [ ] New VPS provisioned
- [ ] Root access available
- [ ] Backup files transferred
- [ ] Domain DNS updated (if applicable)

### System Setup
- [ ] PostgreSQL installed and running
- [ ] Node.js installed
- [ ] MinIO installed and running
- [ ] Firewall configured

### Database Restoration
- [ ] Database created
- [ ] Schema restored
- [ ] Data restored
- [ ] Record counts verified

### MinIO Setup
- [ ] Bucket created
- [ ] Documents restored (if backup available)
- [ ] Bucket policy configured
- [ ] Connection tested

### Application Deployment
- [ ] Environment configured
- [ ] Dependencies installed
- [ ] Prisma generated
- [ ] Migrations applied
- [ ] Application built
- [ ] PM2 configured
- [ ] Application running

### Verification
- [ ] Login working
- [ ] Employees visible
- [ ] Institutions listed
- [ ] Requests accessible
- [ ] Documents loading
- [ ] Workflows functional

### Post-Restoration
- [ ] SSL configured
- [ ] Nginx configured
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Documentation updated

---

## Contact Information

For issues or questions:

- **Application Logs:** `pm2 logs csms`
- **System Logs:** `sudo journalctl -f`
- **Database Logs:** `sudo tail -f /var/log/postgresql/postgresql-15-main.log`
- **MinIO Logs:** `sudo journalctl -u minio -f`

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-28 | 1.0 | Initial restoration guide |

---

**Last Updated:** 2026-05-28
