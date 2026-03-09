# 🔄 Hướng dẫn Migration: Role cũ → ADMIN + USER

> **Mục tiêu:** Chuyển từ hệ thống multi-role cũ (`SUPER_ADMIN`, `SYSTEM_ADMIN`, `DEAN`, `HEAD_OF_DEPARTMENT`, `LECTURER`) sang hệ thống chỉ còn **2 role**: `ADMIN` và `USER`.
>
> Chức vụ (Trưởng khoa, Phó khoa, ...) giờ quản lý qua bảng `management_positions`, không còn dùng role.

---

## 📋 Tổng quan thay đổi

| Hạng mục | Cũ | Mới |
|---|---|---|
| **Roles** | SUPER_ADMIN, SYSTEM_ADMIN, DEAN, HEAD_OF_DEPARTMENT, LECTURER | Chỉ `ADMIN` + `USER` |
| **Phân chức vụ** | Qua role | Qua bảng `management_positions` |
| **Seeder** | INSERT thủ công | Tự động seed roles + domains khi bảng trống |

---

## ⚠️ Lỗi thường gặp (đã từng xảy ra)

| Lỗi | Nguyên nhân |
|---|---|
| `cannot drop table "users" because other objects depend on it` | DROP bảng core mà chưa xử lý bảng phụ thuộc |
| `relation "user_roles" does not exist` | DROP bảng rồi restart, TypeORM tạo lại sai thứ tự |
| `TRUNCATE bị chặn` | Bảng có FK, cần thêm `CASCADE` |

**Bản đồ FK — bảng nào phụ thuộc bảng nào:**
```
management_positions ──┐
                       ├──→ users ──→ departments
roles ──→ user_roles ──┘      │
                               ├──→ system_logs
                               ├──→ user_kpis / user_okrs
                               └──→ notifications
```
→ Luôn xóa bảng **lá** (phụ thuộc) trước, rồi mới xóa bảng **gốc**.

---

## 🚀 Hướng dẫn Migration (3 bước)

### Bước 1: Tắt Backend + Xóa sạch DB

```bash
# Tắt server NestJS (Ctrl+C)
```

Chạy trong **pgAdmin** hoặc **psql**:

```sql
-- ===== XÓA TẤT CẢ BẢNG (thứ tự đúng) =====

-- Bảng lá (phụ thuộc users)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_okrs CASCADE;
DROP TABLE IF EXISTS user_kpis CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS key_results CASCADE;
DROP TABLE IF EXISTS objectives CASCADE;

-- Bảng junction
DROP TABLE IF EXISTS user_roles CASCADE;

-- Bảng core
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS allowed_domains CASCADE;
DROP TABLE IF EXISTS management_positions CASCADE;

-- Bảng performance
DROP TABLE IF EXISTS kpi_templates CASCADE;
DROP TABLE IF EXISTS kpi_categories CASCADE;
DROP TABLE IF EXISTS evaluation_cycles CASCADE;
```

---

### Bước 2: Pull code mới + Khởi động Backend

```bash
git pull origin main
npm install
npm run start:dev
```

**Kết quả mong đợi trong console:**
```
🌱 Seeding default roles...
  ✅ Created role: Admin (ADMIN)
  ✅ Created role: User (USER)
🌱 Seeding default allowed domains...
  ✅ Added domain: gmail.com
  ✅ Added domain: itec.hcmus.edu.vn
```

> TypeORM `synchronize: true` sẽ tự tạo lại tất cả bảng.
> `DatabaseSeederService` sẽ tự seed roles (ADMIN, USER) và domains.

---

### Bước 3: Insert Departments + Gán Admin

```sql
-- Insert 6 bộ môn
INSERT INTO departments (id, name, code) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Công nghệ Phần mềm', 'SE'),
('b5f675b9-7153-401d-84f5-51f674554322', 'Công nghệ Tri thức', 'KT'),
('c9e37862-3081-42d4-a791-240182586633', 'Hệ thống Thông tin', 'IS'),
('d14a5890-2856-4074-a035-779836345d44', 'Khoa học Máy tính', 'CS'),
('e8760235-9034-4560-bf8c-123456789055', 'Mạng máy tính và Viễn thông', 'NT'),
('f9821346-0145-4567-ca9d-098765432166', 'Thị giác máy tính và điều khiển học thông minh', 'CV')
ON CONFLICT (id) DO NOTHING;
```

Sau đó đăng nhập Google trên FE — **tài khoản đầu tiên đăng nhập sẽ tự động được gán role ADMIN**.

---

## ✅ Checklist kiểm tra

| # | Kiểm tra | Kỳ vọng |
|---|---|---|
| 1 | `SELECT * FROM roles;` | Chỉ 2 dòng: ADMIN + USER |
| 2 | Backend khởi động không lỗi | ✅ |
| 3 | Login Google trên FE | Redirect đúng trang |
| 4 | Trang Admin → Departments | Hiện 6 bộ môn |

---

## 📝 TL;DR

```
1. Tắt backend
2. DROP tất cả bảng (copy SQL ở Bước 1)
3. git pull + npm install + npm run start:dev
4. INSERT departments + gán ADMIN
5. Done ✅
```

*Cập nhật: 2026-03-09 | Phiên bản: v2.0 (ADMIN + USER only)*
