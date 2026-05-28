# Disaster Recovery Backup Manifest

**Created:** 2026-05-28 21:26:14
**Archive:** `csms-disaster-recovery-20260528_212614.tar.gz`
**Size:** 1.9MB

## Backup Contents

### Database Schema
- `schema.prisma` - Prisma ORM schema (current production)
- `schema_20260528_212447.sql` - PostgreSQL schema SQL (124K)

### Database Data (Excluding Employee Personal Data)
- `nody_full_20260528_212447.sql` - Complete database backup (11M)

**Included Tables:**
- ✓ User (all system users)
- ✓ Institution (all government institutions)
- ✓ SystemSettings
- ✓ Session (active sessions)
- ✓ MfaToken (MFA tokens)
- ✓ Notification (user notifications)
- ✓ Complaint (complaint records)
- ✓ AuditLog (audit trail - partitioned)
- ✓ CadreChangeRequest (workflow data)
- ✓ ConfirmationRequest (workflow data)
- ✓ LwopRequest (workflow data)
- ✓ PromotionRequest (workflow data)
- ✓ ResignationRequest (workflow data)
- ✓ RetirementRequest (workflow data)
- ✓ SeparationRequest (workflow data)
- ✓ ServiceExtensionRequest (workflow data)

**Excluded Tables:**
- ✗ Employee (personal information)
- ✗ EmployeeCertificate (documents)

### Migration Files
Complete migration history for schema recreation:
- `20250712105050_init/` - Initial schema
- `20250715102327_add_commission_decision_reason_to_promotion/`
- `20260104120500_add_institution_fields/`
- `20260522000000_add_audit_comprehensive_logging/`
- `20260522010000_migrate_audit_to_partitioned/`
- `20260525000000_add_hrrp_review_fields/`
- `20260525010000_add_hrrp_review_fields_to_lwop/`
- `20260525020000_add_hrrp_review_fields_to_promotion/`

### Recovery Scripts
- `backup-full.sh` - Create new full backup
- `backup.sh` - Create core-only backup
- `restore.sh` - Restore from backup
- `disaster-recovery.sh` - Automated recovery script
- `package-backup.sh` - Create disaster recovery package

### Documentation
- `README.md` - Database documentation overview
- `DISASTER_RECOVERY.md` - Complete recovery guide
- `MIGRATION_CHANGELOG.md` - Migration history
- `UPDATE_SUMMARY.md` - Recent changes summary

## Recovery Instructions

### Quick Recovery (5 minutes)

1. **Transfer archive to new VPS:**
   ```bash
   scp csms-disaster-recovery-20260528_212614.tar.gz user@new-vps:/path/
   ```

2. **Extract and recover:**
   ```bash
   ssh user@new-vps
   tar -xzf csms-disaster-recovery-20260528_212614.tar.gz
   cd csms-disaster-recovery-20260528_212614
   export PGPASSWORD="your_password"
   ./disaster-recovery.sh
   ```

3. **Deploy application:**
   ```bash
   cd /path/to/csms
   npm install
   npx prisma migrate deploy
   npm run build
   npm start
   ```

### What Will Be Restored

- ✓ All system users and authentication
- ✓ All government institutions
- ✓ All request workflows (without employee references)
- ✓ System configuration
- ✓ Audit trail
- ✓ Notifications and complaints

### What Needs Manual Restoration

- ✗ Employee data (re-import from HRIMS)
- ✗ Employee documents (re-upload)
- ✗ File storage configuration (S3/local)

## Backup Schedule

Recommended backup schedule:
- **Daily:** Run `backup-full.sh` via cron
- **Weekly:** Create new disaster recovery package
- **Monthly:** Test recovery procedure

### Cron Example

```bash
# Daily backup at 2 AM
0 2 * * * cd /home/latest/docs/database && PGPASSWORD="Mamlaka2020" ./backup-full.sh

# Weekly package on Sundays at 3 AM
0 3 * * 0 cd /home/latest/docs/database && ./package-backup.sh

# Keep only last 7 days of backups
0 4 * * * find /home/latest/docs/database -name "nody_full_*.sql" -mtime +7 -delete
0 4 * * * find /home/latest/docs/database -name "schema_*.sql" -mtime +7 -delete
```

## Verification

To verify backup integrity:

```bash
# Check archive contents
tar -tzf csms-disaster-recovery-20260528_212614.tar.gz

# Test restoration in isolated database
createdb nody_test
psql -d nody_test -f schema_20260528_212447.sql
psql -d nody_test -f nody_full_20260528_212447.sql
dropdb nody_test
```

## Security Notes

1. **Encryption:** Consider encrypting the archive before storage
2. **Access Control:** Limit access to backup files
3. **Storage:** Store in multiple locations (GitHub + cloud storage)
4. **Testing:** Test recovery quarterly
5. **Documentation:** Keep recovery guide updated

## Contact

For recovery assistance:
- Review `DISASTER_RECOVERY.md`
- Check application logs
- Contact system administrator
