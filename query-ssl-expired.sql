SELECT x.monitor_id, x.name, x.type, x.valid_to,
       TIMESTAMPDIFF(DAY, UTC_TIMESTAMP(), x.valid_dt) AS days_left
FROM (
    SELECT m.id AS monitor_id, m.name, m.type,
           JSON_UNQUOTE(JSON_EXTRACT(t.info_json, '$.certInfo.validTo')) AS valid_to,
           STR_TO_DATE(
               REPLACE(LEFT(JSON_UNQUOTE(JSON_EXTRACT(t.info_json, '$.certInfo.validTo')), 19), 'T', ' '),
               '%Y-%m-%d %H:%i:%s'
           ) AS valid_dt
    FROM monitor m
    JOIN monitor_tls_info t ON t.monitor_id = m.id
    WHERE m.active = 1
      AND JSON_VALID(t.info_json)
) x
WHERE x.valid_dt <= UTC_TIMESTAMP() + INTERVAL 21 DAY
ORDER BY days_left;