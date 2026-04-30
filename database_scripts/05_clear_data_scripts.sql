-- =========================================================================
-- SCRIPT 1: XÓA DỮ LIỆU OKR & KỲ ĐÁNH GIÁ (GIỮ NGUYÊN USERS, PHÒNG BAN...)
-- =========================================================================
-- Lệnh này sẽ xóa sạch dữ liệu liên quan đến Performance/OKR nhưng không đụng tới User
-- Sử dụng CASCADE để xóa tự động các dữ liệu phụ thuộc (như Key Results thuộc về Objective)

TRUNCATE TABLE 
    key_results, 
    objectives, 
    user_okrs, 
    okr_templates, 
    evaluation_cycles 
CASCADE;


-- =========================================================================
-- SCRIPT 2: XÓA TRẮNG TOÀN BỘ HỆ THỐNG (RESET VỀ SỐ 0, KHÔNG CÓ USER NÀO)
-- =========================================================================
-- Lệnh này sẽ Drop toàn bộ schema public và tạo lại.
-- LƯU Ý QUAN TRỌNG: 
-- Sau khi chạy lệnh này, bạn phải khởi động lại server (npm run start:dev).
-- TypeORM sẽ tự động xây lại cấu trúc các bảng.
-- DatabaseSeederService sẽ tự động nạp lại Roles và AllowedDomains.

-- Bỏ comment 2 dòng dưới đây nếu bạn thực sự muốn chạy (CẢNH BÁO: Mất hết dữ liệu)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
