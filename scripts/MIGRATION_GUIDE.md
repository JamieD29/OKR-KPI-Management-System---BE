# 🔄 Migration Guide: Old Roles → ADMIN + USER

> **Goal:** Transition from the old multi-role system (`SUPER_ADMIN`, `SYSTEM_ADMIN`, `DEAN`, `HEAD_OF_DEPARTMENT`, `LECTURER`) to a system with only **2 roles**: `ADMIN` and `USER`.
>
> Management positions (Dean, Vice Dean, etc.) are now managed through the `management_positions` table, no longer using roles.

---

## 📋 Changes Overview

| Category | Old | New |
|---|---|---|
| **Roles** | SUPER_ADMIN, SYSTEM_ADMIN, DEAN, HEAD_OF_DEPARTMENT, LECTURER | Only `ADMIN` + `USER` |
| **Management Positions** | Via roles | Via `management_positions` table |
| **Seeder** | Manual INSERT | Automatic seed of roles + domains when tables are empty |

---

## ⚠️ Common Errors (Previously Encountered)

| Error | Root Cause |
|---|---|
| `cannot drop table "users" because other objects depend on it` | Core table dropped before handling dependent tables |
| `relation "user_roles" does not exist` | Table dropped then server restarted, TypeORM recreated in incorrect order |
| `TRUNCATE blocked` | Table has foreign keys (FK), requires `CASCADE` |

**FK Map — table dependency diagram:**
```
management_positions ──┐
                       ├──→ users ──→ departments
roles ──→ user_roles ──┘      │
                               ├──→ system_logs
                               ├──→ user_kpis / user_okrs
                               └──→ notifications
```
→ Always delete **leaf** (dependent) tables first, then delete **root** tables.

---

## 🚀 Migration Guide (3 Steps)

### Step 1: Stop Backend + Clear DB

```bash
# Stop NestJS server (Ctrl+C)
```

Run in **pgAdmin** or **psql**:

```sql
-- ===== DROP ALL TABLES (correct order) =====

-- Leaf tables (dependent on users)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_okrs CASCADE;
DROP TABLE IF EXISTS user_kpis CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS key_results CASCADE;
DROP TABLE IF EXISTS objectives CASCADE;

-- Junction tables
DROP TABLE IF EXISTS user_roles CASCADE;

-- Core tables
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS allowed_domains CASCADE;
DROP TABLE IF EXISTS management_positions CASCADE;

-- Performance tables
DROP TABLE IF EXISTS kpi_templates CASCADE;
DROP TABLE IF EXISTS kpi_categories CASCADE;
DROP TABLE IF EXISTS evaluation_cycles CASCADE;
```

---

### Step 2: Pull New Code + Start Backend

```bash
git pull origin main
npm install
npm run start:dev
```

**Expected console output:**
```
🌱 Seeding default roles...
  ✅ Created role: Admin (ADMIN)
  ✅ Created role: User (USER)
🌱 Seeding default allowed domains...
  ✅ Added domain: gmail.com
  ✅ Added domain: itec.hcmus.edu.vn
```

> TypeORM `synchronize: true` will automatically recreate all tables.
> `DatabaseSeederService` will automatically seed roles (ADMIN, USER) and domains.

---

### Step 3: Insert Departments + Assign Admin

```sql
-- Insert 6 departments
INSERT INTO departments (id, name, code) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Công nghệ Phần mềm', 'SE'),
('b5f675b9-7153-401d-84f5-51f674554322', 'Công nghệ Tri thức', 'KT'),
('c9e37862-3081-42d4-a791-240182586633', 'Hệ thống Thông tin', 'IS'),
('d14a5890-2856-4074-a035-779836345d44', 'Khoa học Máy tính', 'CS'),
('e8760235-9034-4560-bf8c-123456789055', 'Mạng máy tính và Viễn thông', 'NT'),
('f9821346-0145-4567-ca9d-098765432166', 'Thị giác máy tính và điều khiển học thông minh', 'CV')
ON CONFLICT (id) DO NOTHING;
```

Then log in with Google on the FE — **the first account to log in will be automatically assigned the ADMIN role**.

---

## ✅ Verification Checklist

| # | Check Item | Expected Outcome |
|---|---|---|
| 1 | `SELECT * FROM roles;` | Only 2 rows: ADMIN + USER |
| 2 | Backend starts without errors | ✅ |
| 3 | Log in via Google on FE | Correct page redirect |
| 4 | Admin Page → Departments | Displays 6 departments |

---

## 📝 TL;DR

```
1. Stop backend
2. DROP all tables (copy SQL from Step 1)
3. git pull + npm install + npm run start:dev
4. INSERT departments + assign ADMIN
5. Done ✅
```

*Updated: 2026-03-09 | Version: v2.0 (ADMIN + USER only)*
