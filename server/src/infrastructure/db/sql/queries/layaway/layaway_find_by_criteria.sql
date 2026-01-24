SELECT 
  la.id,
  la.ticketnum,
  la.clerk_user_id,
  la.date_in,
  la.last_updated_at,
  la.amount,
  la.tax_sales,
  la.state_tax,
  la.returned_amt,
  la.customer_id,
  la.note,
  la.status,
  la.default_date,
  la.total_of_payments,
  la.period,
  la.extra_note,
  la.gun_proc_fee,
  la.last_updated_user_id,
  la.inventory_number,
  la.number_sold,
  la.item_amount,
  la.description,
  la.tax_exempt,
  la.return_sold,
  la.item_status,
  la.county_tax_exempt,
  la.item_last_updated_user_id,
  la.items_id,
  la.created_at,
  la.updated_at,
  c.first_name as customer_first_name,
  c.middle_name as customer_middle_name,
  c.last_name as customer_last_name,
  c.date_of_birth as customer_date_of_birth,
  c.phone_number as customer_phone_number,
  c.cell_phone as customer_cell_phone,
  c.email as customer_email
FROM layaway_agreement la
LEFT JOIN customer c ON c.id = la.customer_id
WHERE 
  ($1::text IS NULL OR la.status = $1)
  AND ($2::timestamptz IS NULL OR la.date_in >= $2)
  AND ($3::timestamptz IS NULL OR la.date_in <= $3)
  AND ($4::uuid IS NULL OR la.customer_id = $4)
ORDER BY la.date_in DESC;
