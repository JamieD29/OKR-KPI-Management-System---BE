-- 1. Create the ENUM type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_level_enum') THEN
        CREATE TYPE permission_level_enum AS ENUM ('SYSTEM', 'KHOA', 'DON_VI', 'NONE');
    END IF;
END $$;

-- 2. Add the column with default NONE
ALTER TABLE "management_positions" 
ADD COLUMN IF NOT EXISTS "permission_level" permission_level_enum DEFAULT 'NONE';

-- 3. Update existing rows mapping old slugs to Permission Levels
UPDATE "management_positions" SET "permission_level" = 'KHOA' WHERE "slug" IN ('TRUONG_KHOA', 'PHO_TRUONG_KHOA');
UPDATE "management_positions" SET "permission_level" = 'DON_VI' WHERE "slug" IN ('TRUONG_PHONG', 'PHO_TRUONG_PHONG', 'TRUONG_BO_MON', 'PHO_TRUONG_BO_MON');
UPDATE "management_positions" SET "permission_level" = 'SYSTEM' WHERE "slug" IN ('HIEU_TRUONG', 'HIEU_PHO'); -- If any exist
