-- 1. Thêm các Role cơ bản (Mày có thể thêm sau, nhưng nên có khung trước)
INSERT INTO roles (name, slug, description)
VALUES (
        'System Admin',
        'SYSTEM_ADMIN',
        'Quản trị viên hệ thống'
    ),
    ('Dean', 'DEAN', 'Trưởng khoa'),
    ('Vice Dean', 'VICE_DEAN', 'Phó khoa'),
    (
        'Head of Department',
        'HEAD_OF_DEPT',
        'Trưởng bộ môn'
    ),
    ('Lecturer', 'LECTURER', 'Giảng viên'),
    ('Staff', 'STAFF', 'Giáo vụ/Chuyên viên');