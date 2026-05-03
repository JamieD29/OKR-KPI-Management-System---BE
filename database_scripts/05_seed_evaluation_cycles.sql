-- 3 kỳ đánh giá mẫu (PostgreSQL).
-- Bảng: evaluation_cycles — khớp entity EvaluationCycle / TypeORM synchronize.
--
-- Status: OPEN | CLOSED | ARCHIVED
-- Type:   SEMESTER | QUARTER | OTHER
--
-- Nếu lỗi enum: \d evaluation_cycles và thêm CAST (vd. 'OPEN'::"tên_type_status")

INSERT INTO evaluation_cycles (
        id,
        name,
        status,
        type,
        "startDate",
        "endDate",
        "createdAt",
        "updatedAt"
    )
VALUES (
        gen_random_uuid(),
        'Học kỳ 1 - 2025-2026',
        'OPEN',
        'SEMESTER',
        DATE '2025-08-01',
        DATE '2025-12-31',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Học kỳ 2 - 2025-2026',
        'OPEN',
        'SEMESTER',
        DATE '2026-01-15',
        DATE '2026-06-30',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Quý 2 - Năm 2026',
        'OPEN',
        'QUARTER',
        DATE '2026-04-01',
        DATE '2026-06-30',
        NOW(),
        NOW()
    );
