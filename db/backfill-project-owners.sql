UPDATE projects AS p
SET owner_id = u.id
FROM users AS u
WHERE p.owner_id IS NULL
  AND u.github_id = '<YOUR_GITHUB_ID>';
