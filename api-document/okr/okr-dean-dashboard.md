Trả về **tổng hợp dữ liệu toàn hệ thống** cho trang Dashboard của Trưởng khoa. Một lần gọi cung cấp đầy đủ: thông tin kỳ hiện tại, summary counts, thống kê theo bộ môn, bảng xếp hạng cá nhân, phân bổ xếp loại, timeline theo tuần, và danh sách action items cần xử lý.

## HTTP Request

**Endpoint:** `GET {baseUrl}/okrs/dean-dashboard`

### Headers

| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |

### Query / Body

Không có.

### Example Request

```http
GET /okrs/dean-dashboard HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

### Cấu trúc response

| Field                     | Type              | Description                                                                                      |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| cycle                     | Object \| null    | Kỳ đánh giá đang OPEN, hoặc kỳ mới nhất nếu không có kỳ OPEN. `null` nếu chưa có kỳ nào.       |
| cycle.id                  | String (UUID)     | ID kỳ                                                                                            |
| cycle.name                | String            | Tên kỳ                                                                                           |
| cycle.status              | String            | `OPEN` / `CLOSED`                                                                                |
| cycle.startDate           | Date (ISO)        | Ngày bắt đầu kỳ                                                                                  |
| cycle.endDate             | Date (ISO)        | Ngày kết thúc kỳ                                                                                 |
| cycle.progressPercent     | Integer (0–100)   | Tiến độ kỳ tính theo thời gian thực (`(now - start) / (end - start) * 100`)                     |
| cycle.daysRemaining       | Integer \| null   | Số ngày còn lại tới `endDate`. Âm = đã quá hạn.                                                 |
| summary                   | Object            | Tổng hợp số liệu toàn trường                                                                     |
| summary.totalStaff        | Integer           | Tổng số nhân sự (tổng users trong tất cả bộ môn)                                                |
| summary.totalOkrs         | Integer           | Tổng số bản ghi `UserOkr`                                                                        |
| summary.pendingApproval   | Integer           | Số OKR đang chờ duyệt (`PENDING` + `NEGOTIATING`)                                               |
| summary.awaitingReview    | Integer           | Số bài tự khai chờ chấm điểm (`SUBMITTED`)                                                      |
| summary.completed         | Integer           | Số OKR đã hoàn thành (`COMPLETED`)                                                               |
| summary.accepted          | Integer           | Số OKR đã được chấp nhận nhưng chưa tự khai (`ACCEPTED`)                                        |
| summary.notStarted        | Integer           | Số nhân sự chưa được giao OKR (`totalStaff - totalOkrs`)                                        |
| okrsByStatus              | Object            | Map đếm OKR theo từng status: `{ PENDING, NEGOTIATING, ACCEPTED, SUBMITTED, COMPLETED, REJECTED }` |
| departmentStats           | Array             | Thống kê theo từng bộ môn                                                                        |
| departmentStats[].deptId  | String (UUID)     | ID bộ môn                                                                                        |
| departmentStats[].deptName | String           | Tên bộ môn                                                                                       |
| departmentStats[].deptCode | String           | Mã bộ môn                                                                                        |
| departmentStats[].memberCount | Integer       | Số thành viên                                                                                    |
| departmentStats[].completedCount | Integer   | Số OKR COMPLETED trong bộ môn                                                                    |
| departmentStats[].submittedCount | Integer   | Số OKR SUBMITTED trong bộ môn                                                                    |
| departmentStats[].acceptedCount  | Integer   | Số OKR ACCEPTED trong bộ môn                                                                     |
| departmentStats[].pendingCount   | Integer   | Số OKR PENDING/NEGOTIATING trong bộ môn                                                          |
| departmentStats[].avgScore | Float \| null    | Điểm trung bình manager chấm trong bộ môn (`null` nếu chưa có OKR COMPLETED)                    |
| departmentStats[].completionRate | Integer  | Tỷ lệ hoàn thành (`completedCount / memberCount * 100`)                                          |
| staffRanking              | Array             | Bảng xếp hạng cá nhân, tối đa 50, chỉ gồm OKR đã SUBMITTED hoặc COMPLETED                      |
| staffRanking[].okrId      | String (UUID)     | ID UserOkr                                                                                       |
| staffRanking[].userId     | String (UUID)     | ID user                                                                                          |
| staffRanking[].userName   | String            | Tên user                                                                                         |
| staffRanking[].userAvatar | String \| null    | URL avatar                                                                                       |
| staffRanking[].deptName   | String            | Tên bộ môn                                                                                       |
| staffRanking[].totalScore | Float             | Điểm tự khai                                                                                     |
| staffRanking[].managerScore | Float \| null   | Điểm do manager chấm (`null` nếu chưa COMPLETED)                                                |
| staffRanking[].status     | String            | `SUBMITTED` / `COMPLETED`                                                                        |
| ratingDistribution        | Object            | Phân bổ xếp loại: map `managerRating → count` từ bảng `user_evaluations`                        |
| timelineData              | Array             | OKR completed/submitted theo tuần trong kỳ hiện tại (rỗng nếu không có kỳ)                     |
| timelineData[].week       | String (YYYY-MM-DD) | Ngày đầu tuần                                                                                  |
| timelineData[].weekLabel  | String            | Nhãn tuần: `"Tuần 1"`, `"Tuần 2"`, …                                                           |
| timelineData[].completed  | Integer           | Số OKR COMPLETED trong tuần                                                                      |
| timelineData[].submitted  | Integer           | Số OKR SUBMITTED (hoặc COMPLETED) trong tuần                                                    |
| actionItems               | Array             | Danh sách việc cần làm. Rỗng nếu không có vấn đề.                                               |
| actionItems[].type        | String            | `PENDING_APPROVAL` / `AWAITING_REVIEW` / `PENDING_EVALUATION` / `LATE_SUBMISSION`               |
| actionItems[].count       | Integer           | Số lượng                                                                                         |
| actionItems[].label       | String            | Mô tả ngắn gọn                                                                                   |
| actionItems[].route       | String            | Đường dẫn FE để điều hướng                                                                      |
| actionItems[].severity    | String            | `error` / `warning` / `info`                                                                     |

### Example Response (200 OK)

```json
{
  "cycle": {
    "id": "c1a2b3c4-1111-2222-3333-444455556666",
    "name": "Học kỳ 1 - 2025-2026",
    "status": "OPEN",
    "startDate": "2025-09-01T00:00:00.000Z",
    "endDate": "2026-01-31T00:00:00.000Z",
    "progressPercent": 72,
    "daysRemaining": 45
  },
  "summary": {
    "totalStaff": 85,
    "totalOkrs": 78,
    "pendingApproval": 5,
    "awaitingReview": 12,
    "completed": 30,
    "accepted": 20,
    "notStarted": 7
  },
  "okrsByStatus": {
    "PENDING": 3,
    "NEGOTIATING": 2,
    "ACCEPTED": 20,
    "SUBMITTED": 12,
    "COMPLETED": 30,
    "REJECTED": 0
  },
  "departmentStats": [
    {
      "deptId": "dept-uuid-1",
      "deptName": "Bộ môn CNTT",
      "deptCode": "CNTT",
      "memberCount": 25,
      "completedCount": 15,
      "submittedCount": 5,
      "acceptedCount": 3,
      "pendingCount": 2,
      "totalScore": 1050,
      "scoreCount": 15,
      "avgScore": 70.0,
      "completionRate": 60
    }
  ],
  "staffRanking": [
    {
      "okrId": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
      "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
      "userName": "Nguyễn Văn A",
      "userAvatar": null,
      "deptName": "Bộ môn CNTT",
      "deptCode": "CNTT",
      "jobTitle": "Giảng viên",
      "objective": "OKR Giảng viên - Học kỳ 1",
      "totalScore": 85,
      "managerScore": 88,
      "status": "COMPLETED"
    }
  ],
  "ratingDistribution": {
    "EXCELLENT": 10,
    "GOOD": 18,
    "AVERAGE": 4
  },
  "timelineData": [
    { "week": "2025-09-01", "weekLabel": "Tuần 1", "completed": 0, "submitted": 0 },
    { "week": "2025-09-08", "weekLabel": "Tuần 2", "completed": 2, "submitted": 5 }
  ],
  "actionItems": [
    {
      "type": "PENDING_APPROVAL",
      "count": 5,
      "label": "5 OKR đang chờ duyệt",
      "route": "/departments/okr?tab=2",
      "severity": "error"
    },
    {
      "type": "AWAITING_REVIEW",
      "count": 12,
      "label": "12 bài tự khai chờ chấm điểm",
      "route": "/departments/okr?tab=3",
      "severity": "warning"
    }
  ]
}
```

### Error Responses

| HTTP Status | Khi nào                    |
| ----------- | -------------------------- |
| 401         | Thiếu / sai JWT            |
| 500         | Lỗi DB / TypeORM           |

---
