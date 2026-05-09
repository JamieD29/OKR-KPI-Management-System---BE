Cập nhật danh sách vai trò (`roles`) của một user. **Chỉ Admin** mới được phép gọi. Backend sẽ chuẩn hóa slug về chữ HOA trước khi tra DB, nên FE có thể gửi `admin` hoặc `ADMIN` đều được.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/users/:id/roles`

### Path Params


| Attribute | Type          | Required | Description           |
| --------- | ------------- | -------- | --------------------- |
| id        | String (UUID) | √        | ID của user cần đổi quyền |


### Headers


| Attribute     | Type   | Required | Description                                                          |
| ------------- | ------ | -------- | -------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                                   |


### Body


| Attribute | Type             | Required | Description                                                                                                  |
| --------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| roles     | Array\<RoleType\>| √        | Mảng slug role cần gán cho user. Hợp lệ: `ADMIN`, `USER`. Slug được auto chuyển sang chữ HOA trước khi lưu. |


### Example Request

```http
PUT /users/8a7b6c5d-1234-4abc-9def-1122334455aa/roles HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "roles": ["ADMIN", "USER"]
}
```

## HTTP Response

Trả về user sau khi cập nhật vai trò, kèm relation `roles`, `department`, `managementPosition`.


| Attribute            | Type          | Required | Description                                            |
| -------------------- | ------------- | -------- | ------------------------------------------------------ |
| id                   | String (UUID) | √        | Mã định danh user                                      |
| email                | String        | √        | Email                                                  |
| name                 | String        |          | Họ tên                                                 |
| roles                | Array         | √        | Danh sách role mới sau khi gán                         |
| department           | Object        |          | Bộ môn / Khoa                                          |
| managementPosition   | Object        |          | Chức vụ quản lý                                        |
| isActive             | Boolean       | √        | Trạng thái kích hoạt                                   |
| profileCompleted     | Boolean       | √        | Đã hoàn tất hồ sơ                                      |
| createdAt            | Date (ISO)    | √        | Thời điểm tạo                                          |
| updatedAt            | Date (ISO)    | √        | Thời điểm cập nhật mới nhất                            |


### Example Response (200 OK)

```json
{
  "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "email": "admin@example.edu.vn",
  "name": "Nguyễn Văn A",
  "isActive": true,
  "profileCompleted": true,
  "roles": [
    {
      "id": "r0000000-aaaa-bbbb-cccc-000000000000",
      "name": "Admin",
      "slug": "ADMIN",
      "description": "Quản trị viên hệ thống"
    },
    {
      "id": "r1111111-aaaa-bbbb-cccc-dddddddddddd",
      "name": "User",
      "slug": "USER",
      "description": "Người dùng hệ thống"
    }
  ],
  "department": {
    "id": "d1f0c2e8-1111-2222-3333-444455556666",
    "name": "Bộ môn Công nghệ Phần mềm",
    "code": "CNPM"
  },
  "managementPosition": null,
  "createdAt": "2024-08-12T03:14:25.000Z",
  "updatedAt": "2026-05-08T08:42:11.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| 400         | Body sai định dạng (`roles` không phải mảng / chứa giá trị ngoài enum), hoặc không tìm thấy role nào trong DB → `Role không hợp lệ hoặc không tìm thấy trong DB. (Input: ...)` |
| 401         | Thiếu / sai JWT                                                                                                  |
| 403         | Tài khoản không phải `ADMIN` (do `RolesGuard` chặn)                                                              |
| 404         | Không tìm thấy user với `id` truyền lên (`User with ID ... not found`)                                           |

---
