-- 1. Allowed Domains Table
CREATE TABLE allowed_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL UNIQUE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. OKRs Table
CREATE TABLE okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    progress INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'on-track',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 4. KPIs Table
CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    current_value DECIMAL(10, 2) DEFAULT 0,
    target_value DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
--Invitations Email
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    invited_by UUID REFERENCES users(id) ON DELETE
    SET NULL,
        department_id UUID,
        role VARCHAR(50) DEFAULT 'user',
        token VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP
);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
-- D
-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2. Add department_id column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE
SET NULL;
-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
-- 4. Create invitations table (if not exists)
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE
    SET NULL,
        role VARCHAR(50) DEFAULT 'user',
        token VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accepted_at TIMESTAMP
);
-- 5. Create index for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
-- 6. Insert sample departments (optional)
INSERT INTO departments (name, description)
VALUES (
        'Engineering',
        'Software Development and Engineering team'
    ),
    ('Marketing', 'Marketing and Communications team'),
    ('Sales', 'Sales and Business Development team'),
    (
        'Human Resources',
        'HR and People Operations team'
    ) ON CONFLICT (name) DO NOTHING;
-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify the setup
-- ============================================
-- Check departments table
SELECT *
FROM departments;
-- Check users with departments
SELECT u.id,
    u.name,
    u.email,
    u.role,
    d.name as department_name
FROM users u
    LEFT JOIN departments d ON u.department_id = d.id;
-- Check invitations
SELECT *
FROM invitations;
-- Add default allowed domain
--INSERT INTO allowed_domains (domain) 
--VALUES ('itec.hcmus.edu.vn');
DELETE FROM allowed_domains
WHERE domain NOT LIKE '%.hcmus.edu.vn';
UPDATE allowed_domains
SET domain = 'itec.hcmus.edu.vn'
WHERE domain = 'fit.hcmus.edu.vn' -- Verify it worked 'list all domain'
SELECT *
FROM allowed_domains;
-- Xóa tất cả users
DELETE FROM users;
-- Kiểm tra
SELECT *
FROM users;
-- Phải trả về 0 rows
-- list all user
SELECT *
FROM users
ORDER BY created_at ASC;