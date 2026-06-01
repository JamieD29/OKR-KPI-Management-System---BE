User **gửi yêu cầu duyệt** OKR của mình lên quản lý. Endpoint chuyển trạng thái OKR sang `NEGOTIATING` và gửi thông báo tới tất cả Admin và người có chức vụ quản lý (Trưởng khoa, Phó trưởng khoa, Trưởng bộ môn, Phó trưởng bộ môn).

**Điều kiện:**
- OKR phải đang ở trạng thái `PENDING` hoặc `NEGOTIATING`.
- Deadline đàm phán chưa hết hạn. Nếu đã hết hạn → `400`.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/send-for-approval`

### Path Params

| Attribute | Type          | Required | Description                 |
| --------- | ------------- | -------- | --------------------------- |
| id        | String (UUID) | √        | ID của `UserOkr` cần gửi duyệt |

### Headers

| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |

### Body

Không có. `userId` lấy từ JWT.

### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/send-for-approval HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về entity `UserOkr` sau khi cập nhật. `status = 'NEGOTIATING'`.

| Attribute | Type          | Description                                              |
| --------- | ------------- | -------------------------------------------------------- |
| id        | String (UUID) | ID UserOkr                                               |
| status    | String        | `NEGOTIATING`                                            |
| ...       | ...           | Các field khác giữ nguyên (xem cấu trúc `GET /okrs/my`) |

### Example Response (200 OK)

```json
{
  "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
  "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "objective": "OKR Giảng viên - Học kỳ 1",
  "status": "NEGOTIATING",
  "deadline": "2026-03-01T00:00:00.000Z",
  "keyResults": [ "..." ],
  "updatedAt": "2026-01-10T08:30:00.000Z"
}
```

### Error Responses

| HTTP Status | Khi nào                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 400         | OKR không ở trạng thái `PENDING` / `NEGOTIATING` → `Chỉ có thể gửi yêu cầu duyệt khi đang đàm phán hoặc chờ phản hồi.`                |
| 400         | Deadline đàm phán đã qua → `Đã hết hạn đàm phán (<ngày>). Không thể gửi yêu cầu duyệt.`                                               |
| 401         | Thiếu / sai JWT                                                                                                                         |
| 404         | Không tìm thấy `UserOkr` có `id` thuộc về `userId` trong JWT                                                                           |

---
