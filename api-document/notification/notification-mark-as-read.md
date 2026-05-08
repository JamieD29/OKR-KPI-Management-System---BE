Đánh dấu **một thông báo** là đã đọc (`isRead = true`). Service kiểm tra ownership: chỉ thông báo thuộc về user hiện tại (lấy từ JWT) mới được cập nhật. Nếu `id` không tồn tại hoặc thuộc về user khác, service trả về `null` (HTTP 200 với body `null`) — endpoint **không** ném exception 404.

## HTTP Request

**Endpoint:** `PATCH {baseUrl}/notifications/:id/read`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Path Params


| Attribute | Type          | Required | Description                                         |
| --------- | ------------- | -------- | --------------------------------------------------- |
| id        | String (UUID) | √        | Mã định danh thông báo cần đánh dấu là đã đọc       |


### Query / Body

Không có. Endpoint suy ra `userId` từ JWT (`req.user.id`).

### Example Request

```http
PATCH /notifications/n1111111-aaaa-bbbb-cccc-dddddddddddd/read HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về thông báo sau khi đã được đánh dấu là đã đọc. Nếu `id` không thuộc về user hiện tại hoặc không tồn tại, body trả về sẽ là `null` (status vẫn 200).


| Attribute | Type          | Required | Description                                                              |
| --------- | ------------- | -------- | ------------------------------------------------------------------------ |
| id        | String (UUID) | √        | Mã định danh thông báo                                                   |
| userId    | String (UUID) | √        | ID của user nhận thông báo                                               |
| message   | String (text) | √        | Nội dung thông báo                                                       |
| isRead    | Boolean       | √        | Sau khi update luôn là `true`                                            |
| createdAt | Date (ISO)    | √        | Thời điểm tạo thông báo                                                  |


### Example Response (200 OK)

```json
{
  "id": "n1111111-aaaa-bbbb-cccc-dddddddddddd",
  "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "message": "Bạn đã được gán chức vụ Trưởng bộ môn",
  "isRead": true,
  "createdAt": "2026-05-08T08:42:11.000Z"
}
```

Trường hợp `id` không tồn tại hoặc thuộc về user khác:

```json
null
```

### Error Responses


| HTTP Status | Khi nào                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                       |
| 200 (null)  | `id` không tồn tại hoặc không thuộc về user hiện tại — body trả về `null`, không phải lỗi HTTP        |

---
