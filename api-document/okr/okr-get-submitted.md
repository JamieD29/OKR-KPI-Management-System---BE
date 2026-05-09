Lấy danh sách `UserOkr` đã được user **submit self-report** và đang chờ Trưởng khoa / Quản lý xem xét — tức `status = 'SUBMITTED'`. Kèm relation `user`, `user.department`, `user.managementPosition`. Sắp xếp theo `updatedAt DESC`.

## HTTP Request

**Endpoint:** `GET {baseUrl}/okrs/submitted`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có. Service hard-code filter `status = 'SUBMITTED'`.

### Example Request

```http
GET /okrs/submitted HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng `UserOkr` có `status = 'SUBMITTED'`, kèm `user`, `user.department`, `user.managementPosition`. Có thể là `[]`.


| Attribute | Type             | Required | Description                                                  |
| --------- | ---------------- | -------- | ------------------------------------------------------------ |
| (root)    | Array\<UserOkr\> | √        | Danh sách OKR chờ chấm, sắp xếp theo `updatedAt DESC`        |


Mỗi phần tử có cấu trúc giống `GET /okrs/my` + thêm relation `user`. `selfReportData` và `totalScore` đã có giá trị (do user vừa self-report).

### Example Response (200 OK)

```json
[
  {
    "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
    "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "cycleId": "c1111111-aaaa-bbbb-cccc-dddddddddddd",
    "objective": "OKR Giảng viên - Học kỳ 1",
    "keyResults": [
      {
        "id": "A",
        "title": "Nhiệm vụ Giảng dạy",
        "maxScore": 35,
        "items": [{ "id": "1", "title": "Hoàn thành giờ chuẩn", "maxScore": 20, "unitScore": 1, "unit": "giờ" }]
      }
    ],
    "totalScore": 28,
    "status": "SUBMITTED",
    "proposedChanges": null,
    "selfReportData": {
      "A-1": { "quantity": 18, "evidence": "Bảng tổng hợp giờ giảng" }
    },
    "managerReportData": null,
    "managerScore": null,
    "user": {
      "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
      "email": "lecturer@example.edu.vn",
      "name": "Nguyễn Văn A",
      "staffCode": "GV001",
      "jobTitle": "Giảng viên",
      "department": {
        "id": "d1f0c2e8-1111-2222-3333-444455556666",
        "name": "Bộ môn Công nghệ Phần mềm",
        "code": "CNPM"
      },
      "managementPosition": null
    },
    "createdAt": "2025-09-10T03:14:25.000Z",
    "updatedAt": "2026-01-25T17:00:00.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
