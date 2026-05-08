Lấy toàn bộ nhật ký hệ thống (`SystemLog`) phục vụ trang quản trị. **Chỉ Admin** mới được phép gọi (`@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(RoleType.ADMIN)`). Backend trả về mảng log kèm relation `user` (người thực hiện), sắp xếp theo `createdAt` giảm dần (mới nhất lên đầu).

## HTTP Request

**Endpoint:** `GET {baseUrl}/system-logs`

### Headers


| Attribute     | Type   | Required | Description                                                                 |
| ------------- | ------ | -------- | --------------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**, định dạng: `Bearer <accessToken>` |


### Path Params

Không có.

### Query

Không có. Service `findAll()` không nhận tham số filter / phân trang.

### Body

Không có.

### Example Request

```http
GET /system-logs HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng `SystemLog`, sắp xếp theo `createdAt DESC`, kèm relation `user` (người thực hiện hành động). Nếu user thực hiện đã bị xóa khỏi DB, `user` sẽ là `null` (do FK `onDelete: 'SET NULL'`).


| Attribute | Type               | Required | Description                                  |
| --------- | ------------------ | -------- | -------------------------------------------- |
| (root)    | Array\<SystemLog\> | √        | Danh sách nhật ký, có thể là mảng rỗng `[]`  |


Mỗi phần tử `SystemLog` có cấu trúc:


| Attribute | Type          | Required | Description                                                                                                                         |
| --------- | ------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| id        | String (UUID) | √        | Mã định danh log                                                                                                                    |
| user      | Object        |          | Thông tin user đã thực hiện hành động. `null` nếu không xác định / user đã bị xóa. Gồm các field cơ bản: `id`, `email`, `name`, ... |
| action    | String        | √        | Loại hành động. Ví dụ: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`                                                                        |
| resource  | String        | √        | Tài nguyên bị tác động. Ví dụ: `DEPARTMENT`, `USER`, `ROLE`                                                                         |
| message   | String        |          | Mô tả ngắn gọn về hành động (vd: `Minh Ha đã tạo bộ môn Khoa học máy tính`)                                                         |
| details   | Object (JSON) |          | JSON lưu dữ liệu trước/sau hoặc payload phụ trợ để đối chiếu. Có thể `null`                                                         |
| status    | Enum          | √        | Trạng thái thực thi. Giá trị: `SUCCESS`, `FAILED`. Mặc định `SUCCESS`                                                               |
| createdAt | Date (ISO)    | √        | Thời điểm ghi log                                                                                                                   |


### Example Response (200 OK)

```json
[
  {
    "id": "f0e1d2c3-1111-4abc-9def-aabbccddeeff",
    "user": {
      "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
      "email": "admin@example.edu.vn",
      "name": "Nguyễn Văn A"
    },
    "action": "DELETE",
    "resource": "DEPARTMENT",
    "message": "Admin đã xóa bộ môn Khoa học máy tính",
    "details": {
      "before": {
        "id": "d1f0c2e8-1111-2222-3333-444455556666",
        "name": "Bộ môn Khoa học máy tính",
        "code": "KHMT"
      }
    },
    "status": "SUCCESS",
    "createdAt": "2026-05-08T10:42:11.000Z"
  },
  {
    "id": "a9b8c7d6-2222-4abc-9def-bbccddeeff00",
    "user": null,
    "action": "LOGIN",
    "resource": "USER",
    "message": "Đăng nhập thất bại do sai mật khẩu",
    "details": null,
    "status": "FAILED",
    "createdAt": "2026-05-08T09:15:03.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào                                                |
| ----------- | ------------------------------------------------------ |
| 401         | Thiếu / sai JWT (không qua được `JwtAuthGuard`)        |
| 403         | Tài khoản không phải `ADMIN` (bị `RolesGuard` chặn)    |

---
