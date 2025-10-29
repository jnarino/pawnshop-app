-- Create settings table for control number sequence
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES app_user(id) ON DELETE SET NULL
);

-- Initialize control number sequence (starting at 100001)
INSERT INTO app_settings (key, value, description)
VALUES ('pawn_ticket_control_number_next', '100001', 'Next control number for pawn tickets')
ON CONFLICT (key) DO NOTHING;

-- Function to get and increment control number atomically
CREATE OR REPLACE FUNCTION get_next_control_number()
RETURNS TEXT AS $$
DECLARE
  next_num TEXT;
BEGIN
  UPDATE app_settings
  SET value = (value::INTEGER + 1)::TEXT,
      updated_at = NOW()
  WHERE key = 'pawn_ticket_control_number_next'
  RETURNING (value::INTEGER - 1)::TEXT INTO next_num;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_control_number() IS 'Atomically get and increment the next pawn ticket control number';
