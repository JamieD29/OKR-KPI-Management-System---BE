Lọc danh sách user theo chức vụ quản lý (`positionId`) và/hoặc chức danh nghề nghiệp (`jobTitle`). Có thể truyền 1 trong 2, cả 2, hoặc không truyền (trả toàn bộ user, sắp xếp tăng dần theo tên).

## HTTP Request

**Endpoint:** `GET {baseUrl}/users/filter-by-role`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query


| Attribute  | Type          | Required | Description                                                                                                                                                                |
| ---------- | ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| positionId | String (UUID) |          | ID của `ManagementPosition` cần lọc (vd: Trưởng khoa, Trưởng bộ môn). Bỏ qua nếu không cần lọc theo chức vụ.                                                               |
| jobTitle   | Enum          |          | Chức danh nghề nghiệp. Giá trị: `Giảng viên`, `Giảng viên chính`, `Chuyên viên`, `Nghiên cứu viên`, `Trợ giảng`, `Giáo vụ`, `Kỹ thuật viên`, `Nhân viên hỗ trợ`            |


### Body

Không có.

### Example Request

```http
GET /users/filter-by-role?positionId=p2222222-aaaa-bbbb-cccc-dddddddddddd&jobTitle=Gi%E1%BA%A3ng%20vi%C3%AAn HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng user phù hợp điều kiện lọc, kèm relation `roles`, `department`, `managementPosition`. Sắp xếp `name ASC`.


| Attribute | Type        | Required | Description                            |
| --------- | ----------- | -------- | -------------------------------------- |
| (root)    | Array\<User\> | √      | Danh sách user, có thể là mảng rỗng `[]` |


Mỗi phần tử `User` có cấu trúc giống response của `GET /users/profile` (gồm `id`, `email`, `name`, `staffCode`, `jobTitle`, `academicRank`, `degree`, `gender`, `teachingHours`, `department`, `managementPosition`, `roles`, ...).

### Example Response (200 OK)

```json
[
  {
    "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "email": "a.nguyen@example.edu.vn",
    "name": "Nguyễn Văn A",
    "staffCode": "GV001",
    "jobTitle": "Giảng viên",
    "academicRank": "Phó giáo sư",
    "degree": "Tiến sĩ",
    "gender": "Nam",
    "teachingHours": 240.5,
    "isActive": true,
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
  },
  {
    "id": "9b8c7d6e-2345-4abc-9def-2233445566bb",
    "email": "b.tran@example.edu.vn",
    "name": "Trần Thị B",
    "staffCode": "GV002",
    "jobTitle": "Giảng viên",
    "academicRank": "Không",
    "degree": "Thạc sĩ",
    "gender": "Nữ",
    "teachingHours": 180,
    "isActive": true,
    "profileCompleted": false,
    "department": null,
    "managementPosition": null,
    "roles": [
      { "id": "r1111111-aaaa-bbbb-cccc-dddddddddddd", "name": "User", "slug": "USER" }
    ],
    "createdAt": "2025-01-10T01:00:00.000Z",
    "updatedAt": "2026-03-15T07:00:00.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào                |
| ----------- | ---------------------- |
| 401         | Thiếu / sai JWT        |

---
