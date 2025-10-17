-- This script should be run against the 'postgres' system database
-- to create the application database

-- Check if database exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'pawnexpress_dev') THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE pawnexpress_dev');
    END IF;
END
$$;

-- Alternative simpler approach (requires manual check):
-- CREATE DATABASE pawnexpress_dev;
