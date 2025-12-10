USE master;
GO

-- Restore Database
RESTORE DATABASE [PawnMaster_v2]
FROM DISK = N'/var/opt/mssql/backup/pmDATAbak.dat'
WITH FILE = 1,
     MOVE N'pawnmaster'      TO N'/var/opt/mssql/data/PawnMaster_Restore.mdf',
     MOVE N'pawnmaster_log'  TO N'/var/opt/mssql/data/PawnMaster_Restore_log.ldf',
     REPLACE,
     RECOVERY,
     STATS = 10;
GO
