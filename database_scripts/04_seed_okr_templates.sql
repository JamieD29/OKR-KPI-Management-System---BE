-- 5 OKR templates mẫu (PostgreSQL).
-- Đảm bảo đã có bảng okr_templates (TypeORM synchronize / migration).
-- Nếu INSERT lỗi cột: chạy \d okr_templates và chỉnh tên cột cho khớp (camelCase thường có dấu ngoặc kép).

INSERT INTO okr_templates (
        id,
        title,
        "departmentId",
        "positionId",
        "jobTitle",
        "positionName",
        "createdByUserId",
        "createdByName",
        structure,
        "createdAt",
        "updatedAt"
    )
VALUES (
        gen_random_uuid(),
        'Mẫu OKR Giảng viên — Đào tạo & Nghiên cứu',
        NULL,
        NULL,
        'Giảng viên',
        NULL,
        NULL,
        NULL,
        '[
    {"id":"gv-kr1","type":"OBJECTIVE_CHILD","title":"Hoàn thành giảng dạy các học phần phụ trách theo đúng tiến độ và chất lượng","maxScore":30,"unitScore":1,"unit":"%","items":[]},
    {"id":"gv-kr2","type":"OBJECTIVE_CHILD","title":"Công bố kết quả nghiên cứu / bài báo / đề tài trong năm","maxScore":25,"unitScore":1,"unit":"%","items":[]},
    {"id":"gv-kr3","type":"OBJECTIVE_CHILD","title":"Hướng dẫn sinh viên / NCS theo phân công","maxScore":20,"unitScore":1,"unit":"%","items":[]},
    {"id":"gv-kr4","type":"OBJECTIVE_CHILD","title":"Tham gia hội đồng, nhiệm vụ khoa / ngành (theo phân công)","maxScore":15,"unitScore":1,"unit":"%","items":[]},
    {"id":"gv-kr5","type":"OBJECTIVE_CHILD","title":"Cập nhật đề cương / tài liệu và cải tiến phương pháp đào tạo","maxScore":10,"unitScore":1,"unit":"%","items":[]}
  ]'::jsonb,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Mẫu OKR Giảng viên chính — Học thuật & Phát triển chương trình',
        NULL,
        NULL,
        'Giảng viên chính',
        NULL,
        NULL,
        NULL,
        '[
    {"id":"gvc-kr1","type":"OBJECTIVE_CHILD","title":"Điều phối / chủ trì xây dựng và rà soát chương trình đào tạo ngành","maxScore":28,"unitScore":1,"unit":"%","items":[]},
    {"id":"gvc-kr2","type":"OBJECTIVE_CHILD","title":"Nâng cao kết quả nghiên cứu và hợp tác học thuật trong nước & quốc tế","maxScore":27,"unitScore":1,"unit":"%","items":[]},
    {"id":"gvc-kr3","type":"OBJECTIVE_CHILD","title":"Hướng dẫn & chấm các luận văn / đồ án / NCS","maxScore":20,"unitScore":1,"unit":"%","items":[]},
    {"id":"gvc-kr4","type":"OBJECTIVE_CHILD","title":"Mở các học phần chuyên sâu / seminar / workshop cho đơn vị","maxScore":15,"unitScore":1,"unit":"%","items":[]},
    {"id":"gvc-kr5","type":"OBJECTIVE_CHILD","title":"Hỗ trợ công tác tuyển sinh và gắn kết cựu sinh viên / doanh nghiệp","maxScore":10,"unitScore":1,"unit":"%","items":[]}
  ]'::jsonb,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Mẫu OKR Chuyên viên — Văn phòng & Đảm bảo tiến độ',
        NULL,
        NULL,
        'Chuyên viên',
        NULL,
        NULL,
        NULL,
        '[
    {"id":"cv-kr1","type":"OBJECTIVE_CHILD","title":"Xử lý hồ sơ, báo cáo định kỳ và thông báo của khoa đúng hạn","maxScore":35,"unitScore":1,"unit":"%","items":[]},
    {"id":"cv-kr2","type":"OBJECTIVE_CHILD","title":"Hỗ trợ điều hành các sự kiện, họp và hội nghị nội bộ","maxScore":22,"unitScore":1,"unit":"%","items":[]},
    {"id":"cv-kr3","type":"OBJECTIVE_CHILD","title":"Cập nhật và lưu trữ dữ liệu minh chứng Kiểm định / AUN-QA","maxScore":18,"unitScore":1,"unit":"%","items":[]},
    {"id":"cv-kr4","type":"OBJECTIVE_CHILD","title":"Phối hợp với các đơn vị liên quan về tài liệu và nhân sự","maxScore":15,"unitScore":1,"unit":"%","items":[]},
    {"id":"cv-kr5","type":"OBJECTIVE_CHILD","title":"Đề xuất cải tiến quy trình hành chính của khoa","maxScore":10,"unitScore":1,"unit":"%","items":[]}
  ]'::jsonb,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Mẫu OKR Phó khoa / Quản lý — Chiến lược & Điều hành',
        NULL,
        NULL,
        NULL,
        'Phó Trưởng khoa',
        NULL,
        NULL,
        '[
    {"id":"ql-kr1","type":"OBJECTIVE_CHILD","title":"Đạt chỉ tiêu về chiến lược và kế hoạch năm của đơn vị","maxScore":30,"unitScore":1,"unit":"%","items":[]},
    {"id":"ql-kr2","type":"OBJECTIVE_CHILD","title":"Phối hợp các bộ phận, giảm tắc nghẽn và nâng chất hoạt động điều hành","maxScore":22,"unitScore":1,"unit":"%","items":[]},
    {"id":"ql-kr3","type":"OBJECTIVE_CHILD","title":"Phát triển đội ngũ (đào tạo ngắn hạn / coaching nội bộ)","maxScore":18,"unitScore":1,"unit":"%","items":[]},
    {"id":"ql-kr4","type":"OBJECTIVE_CHILD","title":"Đẩy mạnh hợp tác và nguồn lực (doanh nghiệp / đối tác)","maxScore":17,"unitScore":1,"unit":"%","items":[]},
    {"id":"ql-kr5","type":"OBJECTIVE_CHILD","title":"Đảm bảo các tiêu chí minh chứng phục vụ Kiểm định và báo cáo cấp trên","maxScore":13,"unitScore":1,"unit":"%","items":[]}
  ]'::jsonb,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'Mẫu OKR Nghiên cứu viên — Dự án & Công trình',
        NULL,
        NULL,
        'Nghiên cứu viên',
        NULL,
        NULL,
        NULL,
        '[
    {"id":"nc-kr1","type":"OBJECTIVE_CHILD","title":"Triển khai các mục tiêu nghiệm vụ của đề tài / nhóm NC được phân công","maxScore":38,"unitScore":1,"unit":"%","items":[]},
    {"id":"nc-kr2","type":"OBJECTIVE_CHILD","title":"Chuẩn bị bài báo / báo cáo kết quả (hội nghị trong nước hoặc quốc tế)","maxScore":27,"unitScore":1,"unit":"%","items":[]},
    {"id":"nc-kr3","type":"OBJECTIVE_CHILD","title":"Thử nghiệm, đo đạc, thu thập dữ liệu và tài liệu khoa học có hệ thống","maxScore":17,"unitScore":1,"unit":"%","items":[]},
    {"id":"nc-kr4","type":"OBJECTIVE_CHILD","title":"Hỗ trợ nhóm giảng dạy thực hành hoặc thí nghiệm (nếu được giao)","maxScore":18,"unitScore":1,"unit":"%","items":[]}
  ]'::jsonb,
        NOW(),
        NOW()
    );
