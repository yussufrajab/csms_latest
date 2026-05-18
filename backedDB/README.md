# CSMS Database Backup

This directory contains a complete backup of the CSMS database and configuration.

## Contents

- `database/` - PostgreSQL database dumps
- `prisma/` - Prisma schema and migrations
- `minio/` - MinIO configuration and bucket inventory
- `env/` - Environment configuration files
- `scripts/` - Backup and restore scripts

## Files

### Database Backups
- `nody_TIMESTAMP.backup` - Binary format (recommended for restore)
- `nody_TIMESTAMP.sql` - SQL format (portable)
- `nody_schema_only.sql` - Database schema only
- `nody_latest.backup` - Symlink to latest backup

### Prisma
- `schema.prisma` - Database schema definition
- `migrations/` - All database migrations

### MinIO
- `minio-config.json` - MinIO server configuration
- `*_inventory.txt` - Bucket contents listing

### Environment
- `.env.template` - Template for new installation
- `.env.backup` - Full backup (SENSITIVE - keep secure!)

## Restore Instructions

See `scripts/restore.sh` for automated restore process.

For manual restore:
1. Set up new VPS with PostgreSQL and MinIO
2. Copy this directory to new server
3. Update `.env.backup` with new server details
4. Run `./scripts/restore.sh`

## Security Notes

- `.env.backup` contains sensitive credentials
- Keep this backup in a secure location
- Restrict file permissions (chmod 600)
- Delete old backups after migration

## Backup Information

See `backup-info.json` for detailed metadata about this backup.
