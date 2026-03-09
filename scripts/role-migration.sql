-- ============================================================
-- MIGRATION SCRIPT: Chuyển đổi Role cũ → ADMIN + USER
-- ============================================================
-- Xem MIGRATION_GUIDE.md để biết hướng dẫn chi tiết
-- QUAN TRỌNG: Tắt backend trước khi chạy, chạy TỪNG PHẦN
-- ============================================================

-- ===== PHẦN A: Tạo role ADMIN mới (nếu chưa có) =====
INSERT INTO roles (id, name, slug, description)
VALUES (uuid_generate_v4(), 'Admin', 'ADMIN', 'Quản trị viên hệ thống')
ON CONFLICT (slug) DO NOTHING;

-- Kiểm tra: SELECT * FROM roles WHERE slug = 'ADMIN';


-- ===== PHẦN B: Gán ADMIN cho user đang giữ role quản trị cũ =====
INSERT INTO user_roles (user_id, role_id)
SELECT ur.user_id, (SELECT id FROM roles WHERE slug = 'ADMIN')
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.slug IN (
    'SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEAN', 'HEAD_OF_DEPARTMENT',
    'system-admin', 'dean', 'head-of-department'
)
ON CONFLICT DO NOTHING;

-- Kiểm tra: SELECT u.email FROM user_roles ur JOIN users u ON ur.user_id = u.id JOIN roles r ON ur.role_id = r.id WHERE r.slug = 'ADMIN';


-- ===== PHẦN C: Chuẩn hóa role USER =====
-- Nếu slug 'USER' chưa tồn tại → rename LECTURER/user thành USER
UPDATE roles
SET slug = 'USER', name = 'User'
WHERE slug IN ('LECTURER', 'user')
  AND NOT EXISTS (SELECT 1 FROM roles WHERE slug = 'USER');

-- Nếu slug 'USER' đã tồn tại → chuyển user_roles sang role USER rồi xóa role cũ
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

-- Kiểm tra: SELECT * FROM roles WHERE slug = 'USER';


-- ===== PHẦN D: Dọn sạch role cũ =====
-- Bước 1: Xóa liên kết trong user_roles
DELETE FROM user_roles
WHERE role_id IN (
    SELECT id FROM roles
    WHERE slug IN (
        'SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEAN', 'HEAD_OF_DEPARTMENT',
        'system-admin', 'dean', 'head-of-department'
    )
);

-- Bước 2: Xóa role cũ
DELETE FROM roles
WHERE slug IN (
    'SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEAN', 'HEAD_OF_DEPARTMENT',
    'system-admin', 'dean', 'head-of-department'
);

-- ===== KIỂM TRA CUỐI CÙNG =====
-- Chỉ còn 2 role: ADMIN và USER
-- SELECT * FROM roles;
