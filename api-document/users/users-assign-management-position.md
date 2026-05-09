Gán hoặc gỡ chức vụ quản lý (`ManagementPosition`) của một user. **Chỉ Admin** mới được phép gọi. Khi gán/gỡ thành công, hệ thống tự gửi notification cho user đó.

- Truyền `positionId` là UUID hợp lệ → gán chức vụ tương ứng + tạo notification `Bạn đã được gán chức vụ quản lý: <tên chức vụ>`.
- Truyền `positionId = null` → gỡ chức vụ hiện tại + tạo notification `Chức vụ quản lý "<tên cũ>" của bạn đã được gỡ bỏ` (chỉ tạo nếu user vốn đang có chức vụ).

## HTTP Request

**Endpoint:** `PUT {baseUrl}/users/:id/management-position`

### Path Params


| Attribute | Type          | Required | Description                  |
| --------- | ------------- | -------- | ---------------------------- |
| id        | String (UUID) | √        | ID của user cần gán/gỡ chức vụ |


### Headers


| Attribute     | Type   | Required | Description                                                          |
| ------------- | ------ | -------- | -------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                                   |


### Body


| Attribute  | Type                  | Required | Description                                                              |
| ---------- | --------------------- | -------- | ------------------------------------------------------------------------ |
| positionId | String (UUID) \| null | √        | UUID của `ManagementPosition` cần gán. Truyền `null` để gỡ chức vụ hiện tại. |


### Example Request — Gán chức vụ

```http
PUT /users/8a7b6c5d-1234-4abc-9def-1122334455aa/management-position HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "positionId": "p2222222-aaaa-bbbb-cccc-dddddddddddd"
}
```

### Example Request — Gỡ chức vụ

```http
PUT /users/8a7b6c5d-1234-4abc-9def-1122334455aa/management-position HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "positionId": null
}
```

## HTTP Response

Trả về user sau khi cập nhật, kèm relation `roles`, `department`, `managementPosition`. Trường `managementPosition` sẽ là object mới (khi gán) hoặc `null` (khi gỡ).


| Attribute          | Type          | Required | Description                                                                                                |
| ------------------ | ------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| id                 | String (UUID) | √        | Mã định danh user                                                                                          |
| email              | String        | √        | Email                                                                                                      |
| name               | String        |          | Họ tên                                                                                                     |
| managementPosition | Object \| null| √        | Chức vụ mới (`id`, `name`, `slug`, `description`, `permissionLevel`) hoặc `null` nếu vừa được gỡ            |
| department         | Object        |          | Bộ môn / Khoa                                                                                              |
| roles              | Array         | √        | Danh sách vai trò                                                                                          |
| isActive           | Boolean       | √        | Trạng thái kích hoạt                                                                                       |
| profileCompleted   | Boolean       | √        | Đã hoàn tất hồ sơ                                                                                          |
| createdAt          | Date (ISO)    | √        | Thời điểm tạo                                                                                              |
| updatedAt          | Date (ISO)    | √        | Thời điểm cập nhật mới nhất                                                                                |


### Example Response (200 OK) — Sau khi gán

```json
{
  "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "email": "lecturer@example.edu.vn",
  "name": "Nguyễn Văn A",
  "isActive": true,
  "profileCompleted": true,
  "managementPosition": {
    "id": "p2222222-aaaa-bbbb-cccc-dddddddddddd",
    "name": "Trưởng bộ môn",
    "slug": "TRUONG_BO_MON",
    "description": "Phụ trách bộ môn",
    "permissionLevel": "DON_VI"
  },
  "department": {
    "id": "d1f0c2e8-1111-2222-3333-444455556666",
    "name": "Bộ môn Công nghệ Phần mềm",
    "code": "CNPM"
  },
  "roles": [
    { "id": "r1111111-aaaa-bbbb-cccc-dddddddddddd", "name": "User", "slug": "USER" }
  ],
  "createdAt": "2024-08-12T03:14:25.000Z",
  "updatedAt": "2026-05-08T08:42:11.000Z"
}
```

### Example Response (200 OK) — Sau khi gỡ

```json
{
  "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "email": "lecturer@example.edu.vn",
  "name": "Nguyễn Văn A",
  "isActive": true,
  "profileCompleted": true,
  "managementPosition": null,
  "department": {
    "id": "d1f0c2e8-1111-2222-3333-444455556666",
    "name": "Bộ môn Công nghệ Phần mềm",
    "code": "CNPM"
  },
  "roles": [
    { "id": "r1111111-aaaa-bbbb-cccc-dddddddddddd", "name": "User", "slug": "USER" }
  ],
  "createdAt": "2024-08-12T03:14:25.000Z",
  "updatedAt": "2026-05-08T09:00:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                          |
| 403         | Tài khoản không phải `ADMIN` (do `RolesGuard` chặn)                                                      |
| 404         | Không tìm thấy user (`User with ID ... not found`) hoặc không tìm thấy chức vụ (`Chức vụ với ID "..." không tồn tại`) |

---
