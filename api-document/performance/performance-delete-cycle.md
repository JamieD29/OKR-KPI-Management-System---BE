**Soft-delete** một kỳ đánh giá — đổi trường `isDel = true` để ẩn khỏi giao diện thay vì xóa hẳn khỏi DB. Không thể xóa kỳ đang ở trạng thái `OPEN`.

## HTTP Request

**Endpoint:** `DELETE {baseUrl}/performance/admin/cycles/:id`

### Path Params

| Attribute | Type          | Required | Description                         |
| --------- | ------------- | -------- | ----------------------------------- |
| id        | String (UUID) | √        | UUID của kỳ đánh giá cần soft-delete |

### Headers

| Attribute     | Type   | Required | Description                                                                                                     |
| ------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------- |
| Authorization | String |          | Bearer token JWT. Không bắt buộc ở code hiện tại nhưng nên có ở production: `Bearer <accessToken>`.            |

### Body

Không có.

### Example Request

```http
DELETE /performance/admin/cycles/c1a2b3c4-1111-2222-3333-444455556666 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

### Example Response (200 OK)

```json
{
  "message": "Đã xóa kỳ đánh giá thành công"
}
```

### Error Responses

| HTTP Status | Khi nào                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| 400         | Kỳ đang ở trạng thái `OPEN` → `Không thể xóa kỳ đang mở`               |
| 404         | Không tìm thấy kỳ đánh giá với `id` cung cấp → `Không tìm thấy kỳ đánh giá` |
| 500         | Lỗi DB khi cập nhật                                                       |

---
