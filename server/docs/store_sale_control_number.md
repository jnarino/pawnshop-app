# Usage: get_next_store_sale_control_number

- Use the function `get_next_store_sale_control_number()` to get and increment the next control number for store sales (retail, layaway, etc).
- The value is stored in `app_settings` under the key `store_sale_control_number_next`.
- This function is used in the same way as `get_next_pawn_control_number()` and `get_next_purchase_control_number()`.

## Example (SQL):

```sql
SELECT get_next_store_sale_control_number();
```

## Initialization from Legacy Data

1. After importing legacy data, set the initial value using:
   ```sql
   SELECT MAX(acct.TICKETNUM) FROM acct WHERE acct.TYPE IN ('SL','SLD','SLP','SLU','SS','SSV','SLV');
   UPDATE app_settings SET value = '<max+1>' WHERE key = 'store_sale_control_number_next';
   ```

2. The function will then return the next available control number for new store sales.
