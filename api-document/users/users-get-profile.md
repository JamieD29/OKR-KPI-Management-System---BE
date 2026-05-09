Lấy thông tin hồ sơ của người dùng đang đăng nhập (dựa trên JWT trong header).

## HTTP Request

**Endpoint:** `GET {baseUrl}/users/profile`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có. Endpoint suy ra `userId` từ JWT (`req.user.id`).

### Example Request

```http
GET /users/profile HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về toàn bộ thông tin user kèm các relation `roles`, `department`, `managementPosition`.


| Attribute            | Type          | Required | Description                                                                                                                                                     |
| -------------------- | ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                   | String (UUID) | √        | Mã định danh user                                                                                                                                               |
| email                | String        | √        | Email đăng nhập (duy nhất)                                                                                                                                      |
| name                 | String        |          | Họ tên hiển thị                                                                                                                                                 |
| avatarUrl            | String        |          | Link ảnh đại diện                                                                                                                                               |
| googleId             | String        |          | ID Google nếu đăng nhập bằng Google                                                                                                                             |
| microsoftId          | String        |          | ID Microsoft nếu đăng nhập bằng Microsoft                                                                                                                       |
| isActive             | Boolean       | √        | Trạng thái kích hoạt tài khoản                                                                                                                                  |
| staffCode            | String        |          | Mã nhân sự (duy nhất)                                                                                                                                           |
| jobTitle             | Enum          |          | Chức danh nghề nghiệp. Giá trị: `Giảng viên`, `Giảng viên chính`, `Chuyên viên`, `Nghiên cứu viên`, `Trợ giảng`, `Giáo vụ`, `Kỹ thuật viên`, `Nhân viên hỗ trợ` |
| academicRank         | Enum          | √        | Học hàm. Giá trị: `Giáo sư`, `Phó giáo sư`, `Không`                                                                                                             |
| degree               | Enum          | √        | Học vị. Giá trị: `Cử nhân`, `Thạc sĩ`, `Tiến sĩ`, `Không`                                                                                                       |
| gender               | Enum          | √        | Giới tính. Giá trị: `Nam`, `Nữ`, `Khác`                                                                                                                         |
| teachingHours        | Float         | √        | Tổng giờ giảng (dùng để tính KPI/OKR). Mặc định `0`                                                                                                             |
| awards               | String        |          | Khen thưởng (dạng text dài)                                                                                                                                     |
| intellectualProperty | String        |          | Sở hữu trí tuệ (dạng text dài)                                                                                                                                  |
| joinDate             | Date (ISO)    |          | Ngày gia nhập trường (tính thâm niên)                                                                                                                           |
| dateOfBirth          | Date (ISO)    |          | Ngày tháng năm sinh                                                                                                                                             |
| profileCompleted     | Boolean       | √        | Đã hoàn tất thiết lập hồ sơ lần đầu hay chưa                                                                                                                    |
| department           | Object        |          | Bộ môn/Khoa của user. Gồm: `id`, `name`, `code`, `description`                                                                                                  |
| managementPosition   | Object        |          | Chức vụ quản lý. Gồm: `id`, `name`, `slug`, `description`, `permissionLevel` (`SYSTEM` | `KHOA` | `DON_VI` | `NONE`)                                            |
| roles                | Array         | √        | Danh sách vai trò. Mỗi phần tử gồm: `id`, `name`, `slug` (vd: `ADMIN`, `USER`), `description`                                                                   |
| createdAt            | Date (ISO)    | √        | Thời điểm tạo tài khoản                                                                                                                                         |
| updatedAt            | Date (ISO)    | √        | Thời điểm cập nhật gần nhất                                                                                                                                     |


### Example Response (200 OK)

```json
{
  "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "email": "lecturer@example.edu.vn",
  "name": "Nguyễn Văn A",
  "avatarUrl": "https://lh3.googleusercontent.com/a/abc123",
  "googleId": "1098765432109876543",
  "microsoftId": null,
  "isActive": true,
  "staffCode": "GV001",
  "jobTitle": "Giảng viên",
  "academicRank": "Không",
  "degree": "Tiến sĩ",
  "gender": "Nam",
  "teachingHours": 240.5,
  "awards": "Bằng khen Bộ GD&ĐT 2024",
  "intellectualProperty": "Sách giáo trình XYZ",
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
    "description": "Phụ trách bộ môn",
    "permissionLevel": "DON_VI"
  },
  "roles": [
    {
      "id": "r1111111-aaaa-bbbb-cccc-dddddddddddd",
      "name": "User",
      "slug": "USER",
      "description": "Người dùng thường"
    }
  ],
  "createdAt": "2024-08-12T03:14:25.000Z",
  "updatedAt": "2026-04-30T08:42:11.000Z"
}
```

---

