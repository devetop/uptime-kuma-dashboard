SELECT de.domain,
       de.expiry,
       TIMESTAMPDIFF(DAY, NOW(), de.expiry) AS days_left,
       de.last_expiry_notification_sent       AS last_deadline_sent
FROM domain_expiry de
WHERE de.expiry IS NOT NULL
  AND de.expiry <= NOW() + INTERVAL 21 DAY
ORDER BY de.expiry;