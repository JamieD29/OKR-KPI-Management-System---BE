Gia hạn **deadline đàm phán** của một OKR. Sau khi cập nhật, hệ thống gửi thông báo cho user sở hữu OKR đó.

Deadline đàm phán là mốc thời gian kiểm soát các hành động sau:
- Nếu deadline đã qua và OKR đang ở `PENDING` / `NEGOTIATING`, hệ thống **tự động chuyển sang `ACCEPTED`** (lazy auto-accept).
- User bị chặn gửi đề xuất mới hoặc thay đổi cấu trúc sau khi deadline hết.

**Điều kiện:** OKR **không được** đang ở trạng thái `ACCEPTED`, `SUBMITTED`, hoặc `COMPLETED`.

> **Phân quyền:** Dành cho Trưởng khoa / Admin. Endpoint hiện tại không có role guard — nên bổ sung guard ở production.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/extend-deadline`

### Path Params

| Attribute | Type          | Required | Description      |
| --------- | ------------- | -------- | ---------------- |
| id        | String (UUID) | √        | ID của `UserOkr` |

### Headers

| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |

### Body

| Attribute   | Type             | Required | Description                                                                              |
| ----------- | ---------------- | -------- | ---------------------------------------------------------------------------------------- |
| newDeadline | String (ISO 8601) | √       | Deadline mới. Chuỗi parse được bằng `new Date(...)`, VD: `"2026-03-15T23:59:59.000Z"`. |

### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/extend-deadline HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "newDeadline": "2026-03-15T23:59:59.000Z"
}
```

## HTTP Response

Trả về entity `UserOkr` sau khi cập nhật. Field `deadline` chứa ngày mới.

### Example Response (200 OK)

```json
{
  "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
  "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "objective": "OKR Giảng viên - Học kỳ 1",
  "status": "PENDING",
  "deadline": "2026-03-15T23:59:59.000Z",
  "keyResults": [ "..." ],
  "updatedAt": "2026-01-12T08:00:00.000Z"
}
```

### Error Responses

| HTTP Status | Khi nào                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 400         | OKR đã ở `ACCEPTED` / `SUBMITTED` / `COMPLETED` → `Không thể gia hạn OKR đã được chốt hoặc đã hoàn thành.`     |
| 401         | Thiếu / sai JWT                                                                                                   |
| 404         | Không tìm thấy `UserOkr` với `id` cung cấp                                                                       |

---
