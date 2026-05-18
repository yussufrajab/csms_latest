# VPS Migration Guide - CSMS

Complete guide for migrating your CSMS application to a new VPS server.

## 📊 Backup Summary

**Backup Created**: 2026-01-30 15:08:50 UTC
**Database**: nody (PostgreSQL)
**Total Size**: ~43 MB (without MinIO file data)

### What's Backed Up

✅ **Database** (5.6 MB binary + 34 MB SQL)
- All tables and data
- Indexes and constraints
- Foreign key relationships
- Complete schema definition

✅ **Prisma ORM**
- Schema definition (421 lines)
- 3 database migrations
- Migration history

✅ **MinIO Configuration**
- Server settings
- 4 bucket inventories (documents, certificates, photos, attachments)
- Access credentials

✅ **Environment Configuration**
- Full `.env` backup (sensitive)
- Template for new setup

## 🚀 Migration Steps

### Phase 1: Preparation (Current Server)

```bash
# 1. Create fresh backup (if needed)
cd /home/latest/backedDB/scripts
sudo ./backup.sh

# 2. Optional: Backup MinIO file data
sudo ./backup-minio-data.sh

# 3. Verify backup
./verify-backup.sh

# 4. Create transfer package
cd /home/latest
tar -czf csms-backup-$(date +%Y%m%d).tar.gz backedDB/
```

### Phase 2: Transfer to New VPS

```bash
# Option A: Direct SCP transfer
scp csms-backup-20260130.tar.gz user@new-vps:/home/latest/

# Option B: Using rsync (resumable)
rsync -avz --progress csms-backup-20260130.tar.gz user@new-vps:/home/latest/

# On new VPS: Extract
cd /home/latest
tar -xzf csms-backup-20260130.tar.gz
```

### Phase 3: New VPS Setup

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# 4. Install MinIO Server
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create MinIO user and directories
sudo useradd -r minio-user -s /sbin/nologin
sudo mkdir -p /mnt/minio/data
sudo chown -R minio-user:minio-user /mnt/minio

# 5. Install MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# 6. Configure PostgreSQL (if needed)
sudo -u postgres createuser -s postgres
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'YOUR_PASSWORD';"

# Edit PostgreSQL config to allow connections
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: listen_addresses = 'localhost'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: local all postgres md5

sudo systemctl restart postgresql
```

### Phase 4: Run Restore

```bash
# 1. Navigate to backup directory
cd /home/latest/backedDB/scripts

# 2. Run restore script
sudo ./restore.sh

# Follow prompts:
# - Choose to use backed up .env or create new one
# - Confirm database drop/recreation if exists
# - Confirm MinIO bucket creation
```

### Phase 5: Deploy Application

```bash
# 1. Clone or transfer application code
cd /home/latest
git clone <your-repo-url> latest  # or transfer files

# 2. Install dependencies
npm install

# 3. Generate Prisma Client
npx prisma generate

# 4. Build application
npm run build

# 5. Start MinIO (create systemd service)
sudo nano /etc/systemd/system/minio.service
```

Add to `/etc/systemd/system/minio.service`:
```ini
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target

[Service]
User=minio-user
Group=minio-user
WorkingDirectory=/usr/local/bin/
Environment="MINIO_ROOT_USER=csmsadmin"
Environment="MINIO_ROOT_PASSWORD=Mamlaka2020MinIO"
ExecStart=/usr/local/bin/minio server /mnt/minio/data --console-address ":9001"
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start MinIO
sudo systemctl daemon-reload
sudo systemctl enable minio
sudo systemctl start minio

# 6. Restore MinIO file data (if backed up)
cd /home/latest/backedDB/scripts
sudo ./restore-minio-data.sh

# 7. Start application with PM2
sudo npm install -g pm2
pm2 start npm --name "csms" -- start
pm2 save
pm2 startup
```

### Phase 6: Configure Web Server

If using Nginx:

```bash
# Install Nginx
sudo apt install nginx -y

# Create site configuration
sudo nano /etc/nginx/sites-available/csms
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/csms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL with Certbot
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### Phase 7: Verification

```bash
# 1. Check database
psql -U postgres -d nody -c "\dt"
psql -U postgres -d nody -c "SELECT COUNT(*) FROM \"User\";"

# 2. Check MinIO
mc alias set local http://localhost:9000 csmsadmin Mamlaka2020MinIO
mc ls local/

# 3. Check application
curl http://localhost:9002/api/health

# 4. Test in browser
# Navigate to http://your-ip:9002 or https://your-domain.com
```

## 🔒 Security Checklist

After migration:

- [ ] Change PostgreSQL password
- [ ] Update MinIO credentials
- [ ] Generate new CSRF secret
- [ ] Rotate API keys (Gemini, etc.)
- [ ] Configure firewall (ufw)
  ```bash
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```
- [ ] Set up fail2ban
- [ ] Enable automatic security updates
- [ ] Restrict database to localhost only
- [ ] Secure MinIO console (change port or disable)
- [ ] Set proper file permissions
  ```bash
  chmod 600 /home/latest/.env
  chmod 700 /home/latest
  ```

## 📋 Post-Migration Tasks

- [ ] Update DNS records to point to new VPS IP
- [ ] Test all critical features:
  - [ ] User login
  - [ ] Employee management
  - [ ] File uploads/downloads
  - [ ] Report generation
  - [ ] HR workflow submissions
- [ ] Set up monitoring
- [ ] Configure backup schedule
  ```bash
  # Add to crontab
  crontab -e
  # Add: 0 2 * * * /home/latest/backedDB/scripts/backup.sh >> /var/log/csms-backup.log 2>&1
  ```
- [ ] Set up log rotation
- [ ] Document new server credentials (securely!)
- [ ] Decommission old server (after verification period)

## 🆘 Troubleshooting

### Database Won't Restore
```bash
# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Manually create database
sudo -u postgres createdb nody

# Manual restore
sudo -u postgres pg_restore -d nody /home/latest/backedDB/database/nody_latest.backup
```

### Application Won't Start
```bash
# Check Node.js version (should be 18+)
node --version

# Reinstall dependencies
cd /home/latest
rm -rf node_modules package-lock.json
npm install

# Check logs
pm2 logs csms
```

### MinIO Connection Issues
```bash
# Check MinIO is running
sudo systemctl status minio

# Check MinIO logs
sudo journalctl -u minio -f

# Test connectivity
curl http://localhost:9000/minio/health/live
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /home/latest

# Fix MinIO permissions
sudo chown -R minio-user:minio-user /mnt/minio
```

## 📞 Support Files

- **Quick Start**: [QUICK_START.md](QUICK_START.md)
- **Full Documentation**: [README.md](README.md)
- **Backup Info**: [backup-info.json](backup-info.json)

## 🔄 Backup Schedule Recommendation

Set up automated backups on the new server:

```bash
# Create backup script location
sudo mkdir -p /opt/csms-backup

# Copy backup scripts
sudo cp /home/latest/backedDB/scripts/backup.sh /opt/csms-backup/
sudo chmod +x /opt/csms-backup/backup.sh

# Add to crontab
sudo crontab -e
```

Add these lines:
```cron
# Daily database backup at 2 AM
0 2 * * * /opt/csms-backup/backup.sh >> /var/log/csms-backup.log 2>&1

# Weekly full backup (with MinIO) on Sundays at 3 AM
0 3 * * 0 /home/latest/backedDB/scripts/backup-minio-data.sh >> /var/log/csms-backup.log 2>&1

# Monthly cleanup of old backups (keep last 30 days)
0 4 1 * * find /home/latest/backedDB/database/ -name "*.backup" -mtime +30 -delete
```

## 📊 Migration Timeline

Estimated time for complete migration:

1. **Backup Creation**: 5-10 minutes
2. **File Transfer**: 10-30 minutes (depends on connection)
3. **New Server Setup**: 30-60 minutes
4. **Database Restore**: 5-10 minutes
5. **Application Deploy**: 15-30 minutes
6. **Testing & Verification**: 30-60 minutes

**Total**: ~2-4 hours

---

**Version**: 1.0.0
**Created**: 2026-01-30
**Database**: nody
**Application**: CSMS (Civil Service Management System)
