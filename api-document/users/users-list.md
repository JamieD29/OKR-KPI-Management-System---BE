Lấy danh sách user dùng cho **Admin Portal**. Hỗ trợ filter theo `departmentId`. Có cơ chế phân quyền theo `managementPosition.permissionLevel` của requester:

- `ADMIN` hoặc `permissionLevel = SYSTEM | KHOA` → xem được toàn bộ user (hoặc theo `departmentId` nếu có).
- `permissionLevel = DON_VI` → bị ép chỉ xem user trong department của chính requester (dù có truyền `departmentId` khác cũng bị override).
- Các trường hợp còn lại → bị từ chối với lỗi `403 Forbidden`.

## HTTP Request

**Endpoint:** `GET {baseUrl}/users`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query


| Attribute    | Type          | Required | Description                                                                                          |
| ------------ | ------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| departmentId | String (UUID) |          | Lọc theo department. Nếu requester là cấp `DON_VI`, query này sẽ bị thay thế bằng department của họ. |


### Body

Không có.

### Example Request

```http
GET /users?departmentId=d1f0c2e8-1111-2222-3333-444455556666 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng user, sắp xếp theo `createdAt DESC`, kèm relation `roles`, `department`, `managementPosition`.


| Attribute | Type          | Required | Description                              |
| --------- | ------------- | -------- | ---------------------------------------- |
| (root)    | Array\<User\> | √        | Danh sách user, có thể là mảng rỗng `[]` |


Mỗi phần tử `User` có cấu trúc giống response của `GET /users/profile`.

### Example Response (200 OK)

```json
[
  {
    "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "email": "lecturer@example.edu.vn",
    "name": "Nguyễn Văn A",
    "avatarUrl": "https://lh3.googleusercontent.com/a/abc123",
    "isActive": true,
    "staffCode": "GV001",
    "jobTitle": "Giảng viên",
    "academicRank": "Không",
    "degree": "Tiến sĩ",
    "gender": "Nam",
    "teachingHours": 240.5,
    "joinDate": "2018-09-01",
    "dateOfBirth": "1985-04-12",
    "profileCompleted": true,
    "department": {
      "id": "d1f0c2e8-1111-2222-3333-444455556666",
      "name": "Bộ môn Công nghệ Phần mềm",
      "code": "CNPM",
      "description": "Software Engineering"
    },
    "managementPosition": {
      "id": "p2222222-aaaa-bbbb-cccc-dddddddddddd",
      "name": "Trưởng bộ môn",
      "slug": "TRUONG_BO_MON",
      "permissionLevel": "DON_VI"
    },
    "roles": [
      { "id": "r1111111-aaaa-bbbb-cccc-dddddddddddd", "name": "User", "slug": "USER" }
    ],
    "createdAt": "2024-08-12T03:14:25.000Z",
    "updatedAt": "2026-04-30T08:42:11.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                                                  |
| 403         | Requester không phải `ADMIN`, không thuộc cấp `SYSTEM` / `KHOA` / `DON_VI` → `Bạn không có quyền xem danh sách nhân sự`         |

---
