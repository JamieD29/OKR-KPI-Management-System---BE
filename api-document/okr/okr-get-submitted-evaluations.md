Lấy **toàn bộ Phiếu Đánh Giá** trong hệ thống, kèm relation `user`, `user.department`, `user.managementPosition`. Sắp xếp `updatedAt DESC`. Endpoint dùng cho dashboard cấp quản lý xem các phiếu cần review.

## HTTP Request

**Endpoint:** `GET {baseUrl}/okrs/evaluations/submitted`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có.

### Example Request

```http
GET /okrs/evaluations/submitted HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng `UserEvaluation`. Có thể là `[]`.


| Attribute | Type                    | Required | Description                                              |
| --------- | ----------------------- | -------- | -------------------------------------------------------- |
| (root)    | Array\<UserEvaluation\> | √        | Danh sách phiếu, sắp xếp theo `updatedAt DESC`           |


Mỗi phần tử có cấu trúc giống `GET /okrs/evaluations/my` (KHÔNG có 2 field view `okrObjectiveName`/`okrStatus`).

### Example Response (200 OK)

```json
[
  {
    "id": "ev111111-aaaa-bbbb-cccc-dddddddddddd",
    "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "cycleId": null,
    "completionPercent": 0,
    "selfScoreTotal": 28,
    "principalScoreTotal": 26,
    "status": "SUBMITTED",
    "evaluationData": [
      { "id": "A", "name": "Nhiệm vụ Giảng dạy", "maxScore": 35, "selfScore": 28, "principalScore": 26 }
    ],
    "selfComment": "Trong học kỳ này tôi đã hoàn thành...",
    "selfRating": "GOOD",
    "managerComment": null,
    "managerRating": null,
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
    "createdAt": "2026-02-05T10:30:00.000Z",
    "updatedAt": "2026-02-10T09:00:00.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
