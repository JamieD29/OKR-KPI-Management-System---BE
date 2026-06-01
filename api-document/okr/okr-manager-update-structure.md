Manager **phản hồi đề xuất cấu trúc OKR** của user bằng cách ghi đè `keyResults` với phiên bản của mình. Service lưu `originalStructure` (nếu được truyền vào), merge `localComments`, chuyển `status = 'PENDING'` (chờ user xác nhận), và gửi thông báo cho user.

**Điều kiện:** OKR phải đang ở trạng thái `PENDING` hoặc `NEGOTIATING`.

> **Lưu ý:** Endpoint này không kiểm tra `userId` — bất kỳ người dùng đã xác thực nào đều có thể gọi theo thiết kế hiện tại. Kiểm soát quyền nên được thực hiện ở tầng FE hoặc bổ sung guard sau.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/manager-structure`

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

| Attribute         | Type   | Required | Description                                                                                                         |
| ----------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------- |
| keyResults        | Array  | √        | Cây `keyResults` phiên bản manager muốn áp dụng.                                                                   |
| localComments     | Object |          | Map `itemId → Array<{sender, message, createdAt}>` — comment giải thích thay đổi.                                  |
| originalStructure | Array  |          | Cấu trúc gốc trước khi manager sửa (FE tự lưu và gửi lên). Nếu không truyền, service giữ `originalStructure` hiện tại trong DB. |

### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/manager-structure HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
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
  "localComments": {
    "A-1": [
      { "sender": "MANAGER", "message": "Giữ nguyên maxScore 20 theo quy định", "createdAt": "2026-01-11T10:00:00.000Z" }
    ]
  },
  "originalStructure": [ "...cấu trúc gốc user đề xuất..." ]
}
```

## HTTP Response

Trả về entity `UserOkr` sau khi cập nhật. `status = 'PENDING'` — chờ user xem và xác nhận.

### Example Response (200 OK)

```json
{
  "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
  "status": "PENDING",
  "keyResults": [ "...cấu trúc manager vừa ghi..." ],
  "proposedChanges": {
    "originalStructure": [ "...cấu trúc gốc..." ],
    "A-1": [
      { "sender": "MANAGER", "message": "Giữ nguyên maxScore 20 theo quy định", "createdAt": "2026-01-11T10:00:00.000Z" }
    ]
  },
  "updatedAt": "2026-01-11T10:00:05.000Z"
}
```

### Error Responses

| HTTP Status | Khi nào                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| 400         | Status không phải `PENDING` / `NEGOTIATING` → `Chỉ có thể thay đổi cấu trúc khi đang đàm phán.`    |
| 401         | Thiếu / sai JWT                                                                                      |
| 404         | Không tìm thấy `UserOkr` với `id` cung cấp                                                          |

---
