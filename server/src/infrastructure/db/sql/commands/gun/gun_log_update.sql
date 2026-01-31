UPDATE gun_log
SET
    sold_date = $2,
    sold_first_name = $3,
    sold_middle_name = $4,
    sold_last_name = $5,
    sold_street_address = $6,
    sold_city = $7,
    sold_state_us = $8,
    sold_zip_code = $9,
    sold_amount = $10,
    sold_id_type = $11,
    sold_id_number = $12,
    nicstn = $13,
    transaction_num = $14,
    orig_trans_num = $15,
    updated_at = NOW()
WHERE id = $1;
