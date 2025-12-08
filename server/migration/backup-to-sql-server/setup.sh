#!/bin/bash

echo "Starting SQL Server container..."
docker-compose up -d

echo "Waiting for SQL Server to be ready (30 seconds)..."
sleep 30

echo ""
echo "Restoring database from backup..."
docker exec -it pawnshop_sql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong!Passw0rd' \
  -C -i /var/opt/mssql/scripts/restore.sql

echo ""
echo "Database restore complete!"
echo ""
echo "Run ./verify.sh to verify the restore"
