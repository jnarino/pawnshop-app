SELECT COALESCE(MAX(gunlog_number), 0) + 1 as next_num 
FROM gunlog;
