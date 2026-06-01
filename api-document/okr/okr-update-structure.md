User **đề xuất thay đổi cấu trúc OKR** (cây `keyResults`) của mình trong quá trình đàm phán. Service sao lưu `originalStructure` vào `proposedChanges` (chỉ lần đầu), ghi đè `keyResults` bằng cấu trúc mới, merge `localComments` vào `proposedChanges`, chuyển `status = 'NEGOTIATING'`, và gửi thông báo tới quản lý.

**Điều kiện:**
- OKR phải đang ở trạng thái `PENDING` hoặc `NEGOTIATING`.
- Deadline đàm phán chưa hết hạn.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/structure`

### Path Params

| Attribute | Type          | Required | Description          |
| --------- | ------------- | -------- | -------------------- |
| id        | String (UUID) | √        | ID của `UserOkr`     |

### Headers

| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |

### Body

| Attribute      | Type   | Required | Description                                                                                           |
| -------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------- |
| keyResults     | Array  | √        | Cây `keyResults` mới do user đề xuất (cùng format JSON như khi khởi tạo OKR).                        |
| localComments  | Object |          | Map `itemId → Array<{sender, message, createdAt}>` — danh sách comment local để gửi kèm đề xuất.    |

### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/structure HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "keyResults": [
    {
      "id": "A",
      "title": "Nhiệm vụ Giảng dạy",
      "maxScore": 40,
      "items": [
        { "id": "1", "title": "Hoàn thành giờ chuẩn", "maxScore": 25, "unitScore": 1, "unit": "giờ" }
      ]
    }
  ],
  "localComments": {
    "A-1": [
      { "sender": "USER", "message": "Đề xuất tăng maxScore từ 20 lên 25", "createdAt": "2026-01-10T09:00:00.000Z" }
    ]
  }
}
```

## HTTP Response

Trả về entity `UserOkr` sau khi cập nhật. `status = 'NEGOTIATING'`, `keyResults` là cấu trúc mới, `proposedChanges.originalStructure` chứa bản cấu trúc gốc trước khi thay đổi.

### Example Response (200 OK)

```json
{
  "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
  "status": "NEGOTIATING",
  "keyResults": [
    {
      "id": "A",
      "title": "Nhiệm vụ Giảng dạy",
      "maxScore": 40,
      "items": [
        { "id": "1", "title": "Hoàn thành giờ chuẩn", "maxScore": 25, "unitScore": 1, "unit": "giờ" }
      ]
    }
  ],
  "proposedChanges": {
    "originalStructure": [ "...cấu trúc trước khi thay đổi..." ],
    "A-1": [
      { "sender": "USER", "message": "Đề xuất tăng maxScore từ 20 lên 25", "createdAt": "2026-01-10T09:00:00.000Z" }
    ]
  },
  "updatedAt": "2026-01-10T09:00:05.000Z"
}
```

### Error Responses

| HTTP Status | Khi nào                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| 400         | Status không phải `PENDING` / `NEGOTIATING` → `Chỉ có thể thay đổi cấu trúc khi đang đàm phán.`            |
| 400         | Deadline đã qua → `Đã hết hạn đàm phán (<ngày>). Không thể thay đổi cấu trúc OKR.`                         |
| 401         | Thiếu / sai JWT                                                                                              |
| 404         | Không tìm thấy `UserOkr` có `id` thuộc về `userId` trong JWT                                               |

---
