-- 2. Thêm Domain được phép đăng nhập (Thay bằng domain trường mày)
-- Ví dụ mail mày là abc@hcmus.edu.vn thì thêm dòng này:
INSERT INTO allowed_domains (domain)
VALUES ('itec.hcmus.edu.vn');
INSERT INTO allowed_domains (domain)
VALUES ('gmail.com');
-- Thêm cái này để test bằng mail cá nhân cho dễ