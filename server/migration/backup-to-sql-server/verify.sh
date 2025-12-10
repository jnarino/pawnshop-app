#!/bin/bash

echo "Verifying database restore..."
echo ""

# Test connection and run sample queries
docker exec -it pawnshop_sql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong!Passw0rd' -C \
  -Q "SELECT name, database_id, create_date FROM sys.databases WHERE name = 'PawnMaster_v2'"

echo ""
echo "Testing sample customer query (CUS_PK = 19747)..."
docker exec -it pawnshop_sql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'YourStrong!Passw0rd' -C \
  -d PawnMaster_v2 \
  -Q "SELECT TOP 1 * FROM [dbo].[cust] WHERE CUS_PK = '19747'"

echo ""
echo "Verification complete!"
