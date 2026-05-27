UPDATE workouts
SET date_key = strftime('%Y-%m-%d', started_at / 1000, 'unixepoch', 'localtime')
WHERE date_key IS NULL;