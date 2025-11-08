INSERT INTO gunlog (
  id, gunlog_number, inventory_item_id,
  manufacturer, model, serial_number, caliber_gauge, firearm_type, firearm_action,
  acquisition_date, acquisition_customer_id,
  acq_name_full, acq_addr1, acq_suite_number, acq_city, acq_state, acq_zip,
  acq_id_type, acq_id_number,
  acquisition_store_tx_id, status
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
);
