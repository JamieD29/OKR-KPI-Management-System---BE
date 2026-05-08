Lấy danh sách thông báo **chưa đọc** (`isRead = false`) của người dùng đang đăng nhập (dựa trên JWT trong header). Thông báo được trả về theo thứ tự `createdAt DESC` (mới nhất lên đầu).

> Ghi chú: Notification được tạo tự động bởi các service khác (vd: `users.service.ts` khi gán/gỡ chức vụ quản lý, `okr.service.ts` khi giao OKR, `okr-template.service.ts` khi cập nhật template…) thông qua `NotificationService.create()`. Người dùng cuối **không trực tiếp tạo** thông báo qua API.

## HTTP Request

**Endpoint:** `GET {baseUrl}/notifications`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có. Endpoint suy ra `userId` từ JWT (`req.user.id`).

### Example Request

```http
GET /notifications HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng các thông báo chưa đọc của user. Mỗi phần tử có cấu trúc như sau:


| Attribute | Type                    | Required | Description                                                              |
| --------- | ----------------------- | -------- | ------------------------------------------------------------------------ |
| (root)    | Array\<Notification\>   | √        | Danh sách thông báo chưa đọc, có thể là mảng rỗng `[]`                   |
| id        | String (UUID)           | √        | Mã định danh thông báo                                                   |
| userId    | String (UUID)           | √        | ID của user nhận thông báo (luôn trùng với user hiện tại trong JWT)      |
| message   | String (text)           | √        | Nội dung thông báo. VD: `"Bạn đã được gán chức vụ Trưởng khoa"`          |
| isRead    | Boolean                 | √        | Trạng thái đã đọc. Endpoint này luôn trả về `false`                      |
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
    "id": "n2222222-aaaa-bbbb-cccc-dddddddddddd",
    "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "message": "OKR Q2/2026 đã được giao cho bạn",
    "isRead": false,
    "createdAt": "2026-05-07T03:14:25.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
