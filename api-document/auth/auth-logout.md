Đăng xuất user đang đăng nhập. Endpoint chỉ ghi `system_logs` với `action=LOGOUT, resource=AUTH, status=SUCCESS` và trả về message; **không** thực sự thu hồi (revoke) JWT — frontend tự xoá token khỏi localStorage / cookie. JWT vẫn còn hiệu lực cho tới khi hết `expiresIn` (1 ngày).

## HTTP Request

**Endpoint:** `POST {baseUrl}/auth/logout`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có. Service suy ra user từ JWT (`req.user.id` hoặc `req.user.sub`).

### Example Request

```http
POST /auth/logout HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Length: 0
```

## HTTP Response

Trả về object đơn giản chứa message thông báo. Service đồng thời gọi `systemLogsService.createLog(...)` để ghi nhận event đăng xuất.


| Attribute | Type   | Required | Description                                            |
| --------- | ------ | -------- | ------------------------------------------------------ |
| message   | String | √        | Luôn là chuỗi `"Đăng xuất thành công"` (text tiếng Việt). |


### Example Response (200 OK)

```json
{
  "message": "Đăng xuất thành công"
}
```

### Error Responses


| HTTP Status | Khi nào                                                              |
| ----------- | -------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT (header `Authorization` không có hoặc token hết hạn) |
| 500         | Lỗi khi ghi `system_logs` (rất hiếm)                                 |

---
