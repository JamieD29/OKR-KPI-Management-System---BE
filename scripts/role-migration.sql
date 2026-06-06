-- ============================================================
-- MIGRATION SCRIPT: Convert legacy Roles → ADMIN + USER
-- ============================================================
-- Refer to MIGRATION_GUIDE.md for detailed instructions
-- IMPORTANT: Stop backend server before running, execute SECTION BY SECTION
-- ============================================================

-- ===== SECTION A: Create new ADMIN role (if it does not exist) =====
INSERT INTO roles (id, name, slug, description)
VALUES (uuid_generate_v4(), 'Admin', 'ADMIN', 'Quản trị viên hệ thống')
ON CONFLICT (slug) DO NOTHING;

-- Verification: SELECT * FROM roles WHERE slug = 'ADMIN';


-- ===== SECTION B: Assign ADMIN role to users holding legacy administrative roles =====
INSERT INTO user_roles (user_id, role_id)
SELECT ur.user_id, (SELECT id FROM roles WHERE slug = 'ADMIN')
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.slug IN (
    'SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEAN', 'HEAD_OF_DEPARTMENT',
    'system-admin', 'dean', 'head-of-department'
)
ON CONFLICT DO NOTHING;

-- Verification: SELECT u.email FROM user_roles ur JOIN users u ON ur.user_id = u.id JOIN roles r ON ur.role_id = r.id WHERE r.slug = 'ADMIN';



-- If 'USER' slug does not exist -> rename LECTURER/user to USER
UPDATE roles
SET slug = 'USER', name = 'User'
WHERE slug IN ('LECTURER', 'user')
  AND NOT EXISTS (SELECT 1 FROM roles WHERE slug = 'USER');

-- If 'USER' slug already exists -> map user_roles to USER and clean up legacy roles
INSERT INTO user_roles (user_id, role_id)
SELECT ur.user_id, (SELECT id FROM roles WHERE slug = 'USER')
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.slug IN ('LECTURER', 'user')
  AND EXISTS (SELECT 1 FROM roles WHERE slug = 'USER')
ON CONFLICT DO NOTHING;

DELETE FROM user_roles
WHERE role_id IN (SELECT id FROM roles WHERE slug IN ('LECTURER', 'user'))
  AND EXISTS (SELECT 1 FROM roles WHERE slug = 'USER');

DELETE FROM roles
WHERE slug IN ('LECTURER', 'user')
  AND EXISTS (SELECT 1 FROM roles WHERE slug = 'USER');

-- Verification: SELECT * FROM roles WHERE slug = 'USER';



-- Clean up user associations for legacy roles in user_roles
DELETE FROM user_roles
WHERE role_id IN (
    SELECT id FROM roles
    WHERE slug IN (
        'SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEAN', 'HEAD_OF_DEPARTMENT',
        'system-admin', 'dean', 'head-of-department'
    )
);

-- Delete legacy roles
DELETE FROM roles
WHERE slug IN (
    'SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEAN', 'HEAD_OF_DEPARTMENT',
    'system-admin', 'dean', 'head-of-department'
);
