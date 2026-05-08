Đánh dấu **tất cả thông báo chưa đọc** của người dùng đang đăng nhập là đã đọc. Service thực hiện một câu lệnh `UPDATE` trên các bản ghi có `userId = req.user.id` và `isRead = false`.

## HTTP Request

**Endpoint:** `PATCH {baseUrl}/notifications/read-all`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có. Endpoint suy ra `userId` từ JWT (`req.user.id`).

### Example Request

```http
PATCH /notifications/read-all HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về một object xác nhận đã đánh dấu thành công. Endpoint **không** trả về danh sách thông báo. Nếu user không có thông báo chưa đọc nào, response vẫn là cùng một object (idempotent).


| Attribute | Type   | Required | Description                                            |
| --------- | ------ | -------- | ------------------------------------------------------ |
| message   | String | √        | Thông điệp xác nhận. Luôn là `"Đã đánh dấu tất cả đã đọc"` |


### Example Response (200 OK)

```json
{
  "message": "Đã đánh dấu tất cả đã đọc"
}
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
