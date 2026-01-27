SELECT *
FROM allowed_domains;
-- Truy vấn để lấy email, tên user, tên chức vụ và mã chức vụ từ các bảng users, roles và user_roles
SELECT u.email,
    u.name AS "Tên User",
    r.name AS "Chức Vụ (Role)",
    r.slug AS "Role Code"
FROM users u
    JOIN user_roles ur ON u.id = ur."user_id" -- Chỗ này có thể là usersId hoặc userId tùy TypeORM đặt
    JOIN roles r ON r.id = ur."role_id" -- Chỗ này có thể là rolesId hoặc roleId
    --Truy vấn các thông tin của email cụ thể
SELECT name,
    job_title,
    academic_rank,
    degree,
    teaching_hours,
    awards,
    intellectual_property,
    gender
FROM users
WHERE email = 'hathuan699@gmail.com';


SELECT * from departments;

SELECT 
    u.name AS "Tên Giảng Viên", 
    u.email AS "Email", 
    u.staff_code AS "Mã Cán Bộ", 
    d.name AS "Thuộc Bộ Môn",
    d.code AS "Mã Bộ Môn"
FROM users u
JOIN departments d ON u."department_id" = d.id -- Lưu ý: Nếu cột trong DB là department_id thì sửa lại nhé
WHERE d.name = 'Hệ thống Thông tin';

--Xóa tất cả dữ liệu trong các bảng users, roles và user_roles
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE roles CASCADE;