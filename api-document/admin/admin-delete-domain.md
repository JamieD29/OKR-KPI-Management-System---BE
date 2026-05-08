Xóa một tên miền khỏi `AllowedDomain` theo `id`. Service áp dụng các ràng buộc nghiệp vụ:

1. Domain phải tồn tại — nếu không → `404 Not Found`.
2. Hệ thống phải còn ít nhất 1 domain sau khi xóa — nếu đây là domain cuối cùng → `409 Conflict`.
3. Không có user nào đang dùng email thuộc domain này — nếu còn user (`email LIKE '%@<domain>'` ≥ 1) → `409 Conflict`, kèm số lượng user vi phạm.

## HTTP Request

**Endpoint:** `DELETE {baseUrl}/admin/domains/:id`

### Headers


| Attribute     | Type   | Required | Description                                                          |
| ------------- | ------ | -------- | -------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**: `Bearer <accessToken>`     |


### Path Params


| Attribute | Type          | Required | Description                                                       |
| --------- | ------------- | -------- | ----------------------------------------------------------------- |
| id        | String (UUID) | √        | `id` của bản ghi `AllowedDomain` muốn xóa (cột `id` của entity).  |


### Body

Không có.

### Example Request

```http
DELETE /admin/domains/9b8c7d6e-5555-4444-3333-222211110000 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response


| Attribute | Type   | Required | Description                                              |
| --------- | ------ | -------- | -------------------------------------------------------- |
| message   | String | √        | Thông báo thành công, cố định: `Domain removed successfully` |


### Example Response (200 OK)

```json
{
  "message": "Domain removed successfully"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                                                                                             |
| 403         | Tài khoản không phải `ADMIN`                                                                                                                                                |
| 404         | `Domain not found` — không tồn tại bản ghi `AllowedDomain` với `id` được truyền lên.                                                                                        |
| 409         | `Hệ thống phải có ít nhất 1 tên miền hoạt động. Không thể xóa.` — đang cố xóa domain cuối cùng trong DB.                                                                    |
| 409         | `Không thể xóa! Có <N> nhân viên đang sử dụng tên miền này.` — vẫn còn `N > 0` user có email thuộc domain này. Phải reassign / vô hiệu các user đó trước khi xóa domain.    |
| 500         | Lỗi không mong muốn từ DB.                                                                                                                                                  |

---
