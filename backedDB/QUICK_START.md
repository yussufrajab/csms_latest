# Quick Start Guide - CSMS Database Backup & Restore

## 🎯 Quick Reference

### Create Backup (Current Server)

```bash
cd /home/latest/backedDB/scripts
sudo ./backup.sh
```

### Restore on New VPS

```bash
# 1. Transfer files
scp -r /home/latest/backedDB user@new-vps:/home/latest/

# 2. On new VPS
cd /home/latest/backedDB/scripts
sudo ./restore.sh
```

## 📦 What Gets Backed Up?

✅ PostgreSQL database (`nody`)
✅ Prisma schema & migrations
✅ MinIO configuration
✅ Environment variables
✅ Application settings

## ⚡ Common Commands

```bash
# Create backup
sudo ./scripts/backup.sh

# Backup MinIO files (optional, may be large)
sudo ./scripts/backup-minio-data.sh

# Verify backup
./scripts/verify-backup.sh

# Restore everything
sudo ./scripts/restore.sh

# Restore MinIO files
sudo ./scripts/restore-minio-data.sh
```

## 🔍 Check What's Backed Up

```bash
# View backup info
cat backup-info.json

# List database backups
ls -lh database/

# Check backup size
du -sh /home/latest/backedDB/
```

## 🚀 New VPS Setup Steps

### 1. Install Prerequisites

```bash
# PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# MinIO Client (optional)
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc && sudo mv mc /usr/local/bin/
```

### 2. Transfer Backup

```bash
# Option A: Direct transfer
scp -r /home/latest/backedDB user@new-vps:/home/latest/

# Option B: Create archive first
tar -czf csms-backup.tar.gz -C /home/latest backedDB
scp csms-backup.tar.gz user@new-vps:/home/latest/
# Then on new VPS: tar -xzf csms-backup.tar.gz
```

### 3. Restore

```bash
cd /home/latest/backedDB/scripts
sudo ./restore.sh
```

### 4. Start Application

```bash
cd /home/latest
npm install
npx prisma generate
npm run build
npm run dev  # or npm start for production
```

## 🆘 Troubleshooting

### "Command not found: pg_dump"
```bash
sudo apt install postgresql-client -y
```

### "Permission denied"
```bash
sudo chmod +x /home/latest/backedDB/scripts/*.sh
```

### "Database already exists"
The restore script will ask if you want to drop it. Choose 'y' to recreate.

### "MinIO connection failed"
Edit `/home/latest/.env` and update MinIO settings, then restart restore.

## 📋 Post-Restore Checklist

1. ✅ Verify database: `psql -U postgres -d nody -c "\dt"`
2. ✅ Check app starts: `cd /home/latest && npm run dev`
3. ✅ Test login functionality
4. ✅ Verify file uploads work
5. ✅ Update DNS if needed
6. ✅ Configure SSL certificates
7. ✅ Set up backup schedule

## 🔐 Security Reminders

- `.env.backup` contains sensitive credentials
- Change passwords after migration
- Restrict backup directory: `chmod 700 /home/latest/backedDB`
- Delete old backups after successful migration

## 📞 Need Help?

1. Run verification: `./scripts/verify-backup.sh`
2. Check logs in `/var/log/`
3. See full documentation: [README.md](README.md)

---

**TIP**: Always test the restore process before you actually need it!
