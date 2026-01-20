UPDATE app_settings
SET value = (value::INTEGER + 1)::TEXT,
    updated_at = NOW()
WHERE key = 'new_inventory_number_next'
RETURNING (value::INTEGER - 1)::TEXT as next_val;
