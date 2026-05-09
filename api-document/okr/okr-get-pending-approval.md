Lấy danh sách `UserOkr` đang ở trạng thái **`NEGOTIATING`** — tức là user đã gửi đề xuất chỉnh sửa OKR và đang chờ Trưởng khoa / Quản lý duyệt. Kèm thông tin user, department, managementPosition để cấp quản lý xem context.

## HTTP Request

**Endpoint:** `GET {baseUrl}/okrs/pending-approval`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có.

### Example Request

```http
GET /okrs/pending-approval HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng `UserOkr` có `status = 'NEGOTIATING'`, kèm relation `user`, `user.department`, `user.managementPosition`. Sắp xếp `createdAt DESC`.


| Attribute | Type              | Required | Description                                            |
| --------- | ----------------- | -------- | ------------------------------------------------------ |
| (root)    | Array\<UserOkr\>  | √        | Danh sách OKR đang chờ duyệt (có thể là `[]`)          |


Mỗi phần tử có cấu trúc giống `GET /okrs/my` nhưng thêm:

| Attribute  | Type   | Description                                                                                                       |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| user       | Object | Thông tin user sở hữu OKR: `id`, `email`, `name`, `staffCode`, `jobTitle`, ... + `department`, `managementPosition` |


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
        "items": [
          { "id": "1", "title": "Hoàn thành giờ chuẩn", "maxScore": 20, "unitScore": 1, "unit": "giờ" }
        ]
      }
    ],
    "totalScore": 0,
    "status": "NEGOTIATING",
    "proposedChanges": {
      "1": [
        { "sender": "USER", "message": "Em xin giảm còn 18 giờ chuẩn", "createdAt": "2025-09-12T08:00:00.000Z" }
      ]
    },
    "deadline": null,
    "selfReportData": null,
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
    "updatedAt": "2025-09-12T08:00:00.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
