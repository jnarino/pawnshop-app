-- =============================================
-- 0001_init - Initial schema: roles + customer
-- =============================================
-- Extensions (safe if already installed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Roles table
CREATE TABLE
    IF NOT EXISTS role (
        id SMALLINT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
    );

-- Seed default roles
INSERT INTO
    role (id, name)
VALUES
    (1, 'admin'),
    (2, 'manager'),
    (3, 'cashier') ON CONFLICT DO NOTHING;

-- App users table
CREATE TABLE
    IF NOT EXISTS app_user (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- User roles table (many-to-many)
CREATE TABLE
    IF NOT EXISTS app_user_role (
        user_id UUID REFERENCES app_user (id) ON DELETE CASCADE,
        role_id SMALLINT REFERENCES role (id) ON DELETE RESTRICT,
        PRIMARY KEY (user_id, role_id)
    );

-- Sessions table
CREATE TABLE
    IF NOT EXISTS session (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        expires_at TIMESTAMPTZ NOT NULL,
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE INDEX IF NOT EXISTS session_user_idx ON session (user_id);

-- Customer table
CREATE TABLE
    IF NOT EXISTS customer (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        first_name TEXT NOT NULL,
        middle_name TEXT,
        last_name TEXT NOT NULL,
        suffix TEXT,
        date_of_birth DATE NOT NULL,
        sex TEXT,
        eye_color TEXT,
        height TEXT,
        streetaddress TEXT,
        city TEXT,
        us_state TEXT,
        zipcode TEXT,
        id_number TEXT,
        id_expiration DATE,
        id_issue_date DATE,
        issuing_state TEXT,
        phone_number TEXT,
        email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

-- Helpful indexes for searches
CREATE INDEX IF NOT EXISTS customer_name_idx ON customer (last_name, first_name);

CREATE INDEX IF NOT EXISTS customer_dob_idx ON customer (date_of_birth);