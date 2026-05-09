Lấy danh sách tất cả **kỳ đánh giá hiệu suất** (`EvaluationCycle`) trong hệ thống. Dữ liệu được sắp xếp theo `createdAt` giảm dần (kỳ tạo gần nhất lên đầu). Endpoint dùng cho cả Admin Portal (quản lý kỳ) lẫn user thường (xem các kỳ đang mở để nhập liệu).

## HTTP Request

**Endpoint:** `GET {baseUrl}/performance/cycles`

### Headers

| Attribute     | Type   | Required | Description                                                                                                |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| Authorization | String |          | Bearer token JWT, định dạng: `Bearer <accessToken>`. Không bắt buộc ở code hiện tại nhưng nên có khi prod. |


### Query / Body

Không có. Service gọi `cycleRepo.find({ order: { createdAt: 'DESC' } })` — không có filter, không có pagination.

### Example Request

```http
GET /performance/cycles HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng `EvaluationCycle`, sắp xếp theo `createdAt DESC`. Có thể là mảng rỗng `[]` nếu chưa có kỳ nào.


| Attribute | Type                     | Required | Description                                          |
| --------- | ------------------------ | -------- | ---------------------------------------------------- |
| (root)    | Array\<EvaluationCycle\> | √        | Danh sách kỳ đánh giá, có thể là mảng rỗng `[]`      |


Mỗi phần tử `EvaluationCycle` có cấu trúc:


| Attribute | Type          | Required | Description                                                                                                          |
| --------- | ------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| id        | String (UUID) | √        | Mã định danh kỳ đánh giá                                                                                             |
| name      | String        | √        | Tên kỳ đánh giá. VD: `"Học kỳ 1 - 2025-2026"`                                                                        |
| status    | Enum          | √        | Trạng thái kỳ. Giá trị: `OPEN` (đang mở nhập liệu), `CLOSED` (đã đóng), `ARCHIVED` (lưu trữ). Mặc định khi tạo: `CLOSED` |
| type      | Enum          | √        | Loại chu kỳ. Giá trị: `SEMESTER` (học kỳ), `QUARTER` (quý), `OTHER` (khác). Mặc định: `OTHER`                        |
| startDate | Date (ISO)    |          | Ngày bắt đầu kỳ, định dạng `YYYY-MM-DD`. Có thể `null`                                                               |
| endDate   | Date (ISO)    |          | Ngày kết thúc kỳ, định dạng `YYYY-MM-DD`. Có thể `null`                                                              |
| createdAt | Date (ISO)    | √        | Thời điểm tạo bản ghi                                                                                                |
| updatedAt | Date (ISO)    | √        | Thời điểm cập nhật gần nhất                                                                                          |


### Example Response (200 OK)

```json
[
  {
    "id": "c1a2b3c4-1111-2222-3333-444455556666",
    "name": "Học kỳ 1 - 2025-2026",
    "status": "OPEN",
    "type": "SEMESTER",
    "startDate": "2025-09-01",
    "endDate": "2026-01-31",
    "createdAt": "2025-08-20T03:14:25.000Z",
    "updatedAt": "2025-09-01T08:00:00.000Z"
  },
  {
    "id": "d2b3c4d5-7777-8888-9999-aaaabbbbcccc",
    "name": "Quý 2 - 2025",
    "status": "CLOSED",
    "type": "QUARTER",
    "startDate": "2025-04-01",
    "endDate": "2025-06-30",
    "createdAt": "2025-03-15T02:00:00.000Z",
    "updatedAt": "2025-07-01T01:00:00.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------- |
| 500         | Lỗi không mong muốn từ DB / TypeORM khi truy vấn bảng `evaluation_cycles`                |

---
