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
