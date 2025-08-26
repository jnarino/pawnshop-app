BEGIN;

-- Add column (idempotent)
ALTER TABLE pawn_ticket
ADD COLUMN IF NOT EXISTS pawn_status TEXT;

-- Backfill existing rows to a safe default
UPDATE pawn_ticket
SET
    pawn_status = 'active'
WHERE
    pawn_status IS NULL;

-- Enforce default and not-null
ALTER TABLE pawn_ticket
ALTER COLUMN pawn_status
SET DEFAULT 'active',
ALTER COLUMN pawn_status
SET
    NOT NULL;

-- Constrain allowed values
ALTER TABLE pawn_ticket
DROP CONSTRAINT IF EXISTS pawn_ticket_pawn_status_check;

ALTER TABLE pawn_ticket ADD CONSTRAINT pawn_ticket_pawn_status_check CHECK (
    pawn_status IN (
        'active',
        'defaulted',
        'police hold',
        'confiscation'
    )
);

-- Useful index for filtering
CREATE INDEX IF NOT EXISTS idx_pawn_ticket_pawn_status ON pawn_ticket (pawn_status);

COMMIT;