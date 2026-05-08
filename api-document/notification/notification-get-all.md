Lấy **tất cả** thông báo của người dùng đang đăng nhập (cả đã đọc và chưa đọc), sắp xếp theo `createdAt DESC`. Service giới hạn tối đa **50 bản ghi** gần nhất.

> Ghi chú: Notification được tạo tự động bởi các service khác (vd: `users.service.ts` khi gán/gỡ chức vụ quản lý, `okr.service.ts`, `okr-template.service.ts`…) thông qua `NotificationService.create()`. Người dùng cuối **không trực tiếp tạo** thông báo qua API.

## HTTP Request

**Endpoint:** `GET {baseUrl}/notifications/all`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có. Endpoint suy ra `userId` từ JWT (`req.user.id`).

### Example Request

```http
GET /notifications/all HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng tối đa 50 thông báo của user (gồm cả đã đọc và chưa đọc), sắp xếp theo `createdAt DESC`.


| Attribute | Type                    | Required | Description                                                              |
| --------- | ----------------------- | -------- | ------------------------------------------------------------------------ |
| (root)    | Array\<Notification\>   | √        | Danh sách thông báo, có thể là mảng rỗng `[]`. Tối đa 50 phần tử.        |
| id        | String (UUID)           | √        | Mã định danh thông báo                                                   |
| userId    | String (UUID)           | √        | ID của user nhận thông báo (luôn trùng với user hiện tại trong JWT)      |
| message   | String (text)           | √        | Nội dung thông báo. VD: `"Bạn đã được gán chức vụ Trưởng khoa"`          |
| isRead    | Boolean                 | √        | Trạng thái đã đọc. `true` = đã đọc, `false` = chưa đọc                   |
| createdAt | Date (ISO)              | √        | Thời điểm tạo thông báo                                                  |


### Example Response (200 OK)

```json
[
  {
    "id": "n1111111-aaaa-bbbb-cccc-dddddddddddd",
    "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "message": "Bạn đã được gán chức vụ Trưởng bộ môn",
    "isRead": false,
    "createdAt": "2026-05-08T08:42:11.000Z"
  },
  {
    "id": "n3333333-aaaa-bbbb-cccc-dddddddddddd",
    "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "message": "OKR Q1/2026 đã hoàn tất đánh giá",
    "isRead": true,
    "createdAt": "2026-04-15T03:14:25.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
