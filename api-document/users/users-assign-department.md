Gán hoặc gỡ bộ môn cho một user. Sau khi cập nhật thành công, hệ thống gửi thông báo tới user liên quan.

> **Phân quyền:** Chỉ tài khoản có role **ADMIN** mới được gọi endpoint này.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/users/:id/department`

### Path Params

| Attribute | Type          | Required | Description         |
| --------- | ------------- | -------- | ------------------- |
| id        | String (UUID) | √        | UUID của user cần cập nhật |

### Headers

| Attribute     | Type   | Required | Description                                                      |
| ------------- | ------ | -------- | ---------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                               |

### Body

| Attribute    | Type           | Required | Description                                                          |
| ------------ | -------------- | -------- | -------------------------------------------------------------------- |
| departmentId | String (UUID) \| null | √ | UUID bộ môn muốn gán. Truyền `null` để **gỡ** user khỏi bộ môn hiện tại. |

### Example Request — Gán bộ môn

```http
PUT /users/aabbccdd-1234-5678-abcd-000011112222/department HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "departmentId": "dept-1111-2222-3333-444455556666"
}
```

### Example Request — Gỡ bộ môn

```http
PUT /users/aabbccdd-1234-5678-abcd-000011112222/department HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "departmentId": null
}
```

## HTTP Response

Trả về entity `User` sau khi cập nhật (cùng cấu trúc với `GET /users/profile`).

| Attribute  | Type          | Description                                      |
| ---------- | ------------- | ------------------------------------------------ |
| id         | String (UUID) | UUID user                                        |
| email      | String        | Email user                                       |
| name       | String        | Tên user                                         |
| department | Object \| null | Bộ môn mới (hoặc `null` khi gỡ)                 |
| ...        | ...           | Các field user khác                              |

### Example Response (200 OK)

```json
{
  "id": "aabbccdd-1234-5678-abcd-000011112222",
  "email": "nguyen.van.a@itec.hcmus.edu.vn",
  "name": "Nguyễn Văn A",
  "department": {
    "id": "dept-1111-2222-3333-444455556666",
    "name": "Bộ môn CNTT",
    "code": "CNTT"
  },
  "roles": [{ "slug": "USER", "name": "User" }],
  "profileCompleted": true
}
```

### Error Responses

| HTTP Status | Khi nào                                                                               |
| ----------- | ------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                       |
| 403         | Tài khoản không phải `ADMIN`                                                          |
| 404         | User không tồn tại, hoặc `departmentId` không khớp bảng `departments`                |
| 500         | Lỗi DB hoặc gửi notification thất bại                                                 |

---
