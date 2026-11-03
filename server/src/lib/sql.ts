/**
 * Shared SQL query used by all DB bridges.
 * Logic mirrors the reference query from the project brief exactly.
 */
export const DOWN_MONITORS_SQL = `
SELECT
    s.monitor_id,
    m.name AS monitor_name,
    s.timestamp,
    s.ping,
    s.up,
    s.down,
    (
        SELECT h.msg
        FROM heartbeat h
        WHERE h.monitor_id = s.monitor_id
        ORDER BY h.time DESC, h.id DESC
        LIMIT 1
    ) AS msg
FROM stat_minutely s
INNER JOIN (
    SELECT monitor_id, MAX(timestamp) AS latest_timestamp
    FROM   stat_minutely
    GROUP  BY monitor_id
) latest
    ON  s.monitor_id = latest.monitor_id
    AND s.timestamp  = latest.latest_timestamp
INNER JOIN monitor m
    ON  s.monitor_id = m.id
WHERE s.down = 1
ORDER BY s.timestamp DESC
`;

export const QUICK_STATS_SQL = `
WITH RECURSIVE monitor_active (id, is_active) AS (
    SELECT id, CASE WHEN active = 1 THEN 1 ELSE 0 END
    FROM monitor WHERE parent IS NULL
    UNION ALL
    SELECT c.id, CASE WHEN c.active = 1 AND p.is_active = 1 THEN 1 ELSE 0 END
    FROM monitor c
    JOIN monitor_active p ON c.parent = p.id
),
latest AS (
    SELECT ma.id, ma.is_active,
           (SELECT h.status
            FROM heartbeat h
            WHERE h.monitor_id = ma.id
            ORDER BY h.id DESC
            LIMIT 1) AS status
    FROM monitor_active ma
)
SELECT
    COALESCE(SUM(CASE WHEN is_active = 1 AND status = 1 THEN 1 ELSE 0 END), 0)                                   AS up,
    COALESCE(SUM(CASE WHEN is_active = 1 AND status = 0 THEN 1 ELSE 0 END), 0)                                   AS down,
    COALESCE(SUM(CASE WHEN is_active = 1 AND status = 2 THEN 1 ELSE 0 END), 0)                                   AS pending,
    COALESCE(SUM(CASE WHEN is_active = 1 AND status = 3 THEN 1 ELSE 0 END), 0)                                   AS maintenance,
    COALESCE(SUM(CASE WHEN is_active = 1 AND (status IS NULL OR status NOT IN (0,1,2,3)) THEN 1 ELSE 0 END), 0)  AS unknown,
    COALESCE(SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END), 0)                                                  AS pause,
    COALESCE(SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END), 0)                                                  AS active
FROM latest;
`;

/**
 * SSL Expired queries:
 * MySQL uses JSON_UNQUOTE, JSON_EXTRACT, TIMESTAMPDIFF, and INTERVAL 21 DAY.
 * SQLite uses json_extract, substr/replace, julianday date arithmetic, and datetime('now', '+21 days').
 */
export const SSL_EXPIRED_MYSQL_SQL = `
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
ORDER BY days_left ASC;
`;

export const SSL_EXPIRED_SQLITE_SQL = `
SELECT x.monitor_id, x.name, x.type, x.valid_to,
       CAST(julianday(x.valid_dt) - julianday('now') AS INTEGER) AS days_left
FROM (
    SELECT m.id AS monitor_id, m.name, m.type,
           json_extract(t.info_json, '$.certInfo.validTo') AS valid_to,
           replace(substr(json_extract(t.info_json, '$.certInfo.validTo'), 1, 19), 'T', ' ') AS valid_dt
    FROM monitor m
    JOIN monitor_tls_info t ON t.monitor_id = m.id
    WHERE m.active = 1
      AND json_valid(t.info_json)
) x
WHERE x.valid_dt <= datetime('now', '+21 days')
ORDER BY days_left ASC;
`;