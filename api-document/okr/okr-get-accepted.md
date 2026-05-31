Lấy danh sách tất cả `UserOkr` có `status = 'ACCEPTED'`. Dùng cho quản lý theo dõi danh sách nhân sự đã được chốt OKR nhưng chưa nộp tự khai.

## HTTP Request

**Endpoint:** `GET {baseUrl}/okrs/accepted`

### Headers

| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |

### Query / Body

Không có.

### Example Request

```http
GET /okrs/accepted HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng `UserOkr` có `status = 'ACCEPTED'`, kèm quan hệ `user`, `user.department`, `user.managementPosition`, `cycle`. Sắp xếp theo `updatedAt DESC`.

| Attribute                  | Type          | Description                                    |
| -------------------------- | ------------- | ---------------------------------------------- |
| id                         | String (UUID) | ID UserOkr                                     |
| userId                     | String (UUID) | ID user sở hữu                                 |
| objective                  | String        | Tên mục tiêu OKR                               |
| status                     | String        | `ACCEPTED`                                     |
| totalScore                 | Float         | Điểm hiện tại (từ lần lưu nháp gần nhất, nếu có) |
| user                       | Object        | Thông tin user, bao gồm `department`, `managementPosition` |
| cycle                      | Object        | Thông tin kỳ đánh giá                          |
| ...                        | ...           | Các field khác của `UserOkr`                   |

### Example Response (200 OK)

```json
[
  {
    "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
    "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "objective": "OKR Giảng viên - Học kỳ 1",
    "status": "ACCEPTED",
    "totalScore": 0,
    "selfReportData": null,
    "deadline": null,
    "user": {
      "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
      "name": "Nguyễn Văn A",
      "email": "nguyen.van.a@itec.hcmus.edu.vn",
      "department": { "id": "dept-uuid", "name": "Bộ môn CNTT", "code": "CNTT" },
      "managementPosition": null
    },
    "cycle": {
      "id": "c1a2b3c4-1111-2222-3333-444455556666",
      "name": "Học kỳ 1 - 2025-2026",
      "status": "OPEN"
    },
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

### Error Responses

| HTTP Status | Khi nào             |
| ----------- | ------------------- |
| 401         | Thiếu / sai JWT     |
| 500         | Lỗi DB / TypeORM    |

---
