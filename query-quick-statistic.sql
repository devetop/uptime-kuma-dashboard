WITH RECURSIVE monitor_active (id, is_active) AS (
    SELECT id, CAST(active = 1 AS SIGNED)
    FROM monitor WHERE parent IS NULL
    UNION ALL
    SELECT c.id, CAST(c.active = 1 AND p.is_active = 1 AS SIGNED)
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
    SUM(is_active = 1 AND status = 1)                                   AS up,
    SUM(is_active = 1 AND status = 0)                                   AS down,
    SUM(is_active = 1 AND status = 2)                                   AS pending,
    SUM(is_active = 1 AND status = 3)                                   AS maintenance,
    SUM(is_active = 1 AND (status IS NULL OR status NOT IN (0,1,2,3)))  AS unknown,
    SUM(is_active = 0)                                                  AS pause,
    SUM(is_active = 1)                                                  AS active
FROM latest;