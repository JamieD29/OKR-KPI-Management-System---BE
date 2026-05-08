Cập nhật hồ sơ cá nhân của người dùng đang đăng nhập (dựa trên JWT). Hỗ trợ partial update — chỉ những field được gửi lên mới bị thay đổi.

## HTTP Request

**Endpoint:** `PATCH {baseUrl}/users/profile`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |


### Body


| Attribute            | Type          | Required | Description                                                                                                                                                     |
| -------------------- | ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name                 | String        |          | Họ tên hiển thị                                                                                                                                                 |
| avatar               | String        |          | URL ảnh đại diện                                                                                                                                                |
| jobTitle             | Enum          |          | Chức danh nghề nghiệp. Giá trị: `Giảng viên`, `Giảng viên chính`, `Chuyên viên`, `Nghiên cứu viên`, `Trợ giảng`, `Giáo vụ`, `Kỹ thuật viên`, `Nhân viên hỗ trợ` |
| academicRank         | Enum          |          | Học hàm. Giá trị: `Giáo sư`, `Phó giáo sư`, `Không`                                                                                                             |
| degree               | Enum          |          | Học vị. Giá trị: `Cử nhân`, `Thạc sĩ`, `Tiến sĩ`, `Không`                                                                                                       |
| gender               | Enum          |          | Giới tính. Giá trị: `Nam`, `Nữ`, `Khác`                                                                                                                         |
| teachingHours        | Float         |          | Tổng giờ giảng. Phải `>= 0`                                                                                                                                     |
| awards               | String        |          | Khen thưởng (text dài)                                                                                                                                          |
| intellectualProperty | String        |          | Sở hữu trí tuệ (text dài)                                                                                                                                       |
| joinDate             | Date (ISO)    |          | Ngày gia nhập trường, định dạng `YYYY-MM-DD`                                                                                                                    |
| dateOfBirth          | Date (ISO)    |          | Ngày sinh, định dạng `YYYY-MM-DD`                                                                                                                               |
| departmentId         | String (UUID) |          | ID Bộ môn / Khoa muốn gắn user vào (UUID v4)                                                                                                                    |
| staffCode            | String        |          | Mã nhân sự (duy nhất)                                                                                                                                           |
| profileCompleted     | Boolean       |          | Đánh dấu user đã hoàn tất thiết lập hồ sơ lần đầu                                                                                                               |


### Example Request

```http
PATCH /users/profile HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "jobTitle": "Giảng viên",
  "academicRank": "Phó giáo sư",
  "degree": "Tiến sĩ",
  "gender": "Nam",
  "teachingHours": 240.5,
  "joinDate": "2018-09-01",
  "dateOfBirth": "1985-04-12",
  "departmentId": "d1f0c2e8-1111-2222-3333-444455556666",
  "staffCode": "GV001",
  "profileCompleted": true
}
```

## HTTP Response

Trả về user sau khi cập nhật, gồm các relation `roles`, `department`, `managementPosition` (cấu trúc giống response của `GET /users/profile`).


| Attribute            | Type          | Required | Description                                                                |
| -------------------- | ------------- | -------- | -------------------------------------------------------------------------- |
| id                   | String (UUID) | √        | Mã định danh user                                                          |
| email                | String        | √        | Email đăng nhập                                                            |
| name                 | String        |          | Họ tên hiển thị sau cập nhật                                               |
| avatarUrl            | String        |          | Link ảnh đại diện                                                          |
| jobTitle             | Enum          |          | Chức danh nghề nghiệp                                                      |
| academicRank         | Enum          | √        | Học hàm                                                                    |
| degree               | Enum          | √        | Học vị                                                                     |
| gender               | Enum          | √        | Giới tính                                                                  |
| teachingHours        | Float         | √        | Tổng giờ giảng                                                             |
| awards               | String        |          | Khen thưởng                                                                |
| intellectualProperty | String        |          | Sở hữu trí tuệ                                                             |
| joinDate             | Date (ISO)    |          | Ngày gia nhập trường                                                       |
| dateOfBirth          | Date (ISO)    |          | Ngày sinh                                                                  |
| staffCode            | String        |          | Mã nhân sự                                                                 |
| profileCompleted     | Boolean       | √        | Đã hoàn tất thiết lập hồ sơ lần đầu                                        |
| isActive             | Boolean       | √        | Trạng thái kích hoạt                                                       |
| department           | Object        |          | Bộ môn/Khoa: `id`, `name`, `code`, `description`                           |
| managementPosition   | Object        |          | Chức vụ quản lý (nếu có)                                                   |
| roles                | Array         | √        | Danh sách vai trò                                                          |
| createdAt            | Date (ISO)    | √        | Thời điểm tạo                                                              |
| updatedAt            | Date (ISO)    | √        | Thời điểm cập nhật mới nhất                                                |


### Example Response (200 OK)

```json
{
  "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "email": "lecturer@example.edu.vn",
  "name": "Nguyễn Văn A",
  "avatarUrl": "https://lh3.googleusercontent.com/a/abc123",
  "isActive": true,
  "staffCode": "GV001",
  "jobTitle": "Giảng viên",
  "academicRank": "Phó giáo sư",
  "degree": "Tiến sĩ",
  "gender": "Nam",
  "teachingHours": 240.5,
  "awards": null,
  "intellectualProperty": null,
  "joinDate": "2018-09-01",
  "dateOfBirth": "1985-04-12",
  "profileCompleted": true,
  "department": {
    "id": "d1f0c2e8-1111-2222-3333-444455556666",
    "name": "Bộ môn Công nghệ Phần mềm",
    "code": "CNPM",
    "description": "Software Engineering"
  },
  "managementPosition": null,
  "roles": [
    {
      "id": "r1111111-aaaa-bbbb-cccc-dddddddddddd",
      "name": "User",
      "slug": "USER",
      "description": "Người dùng thường"
    }
  ],
  "createdAt": "2024-08-12T03:14:25.000Z",
  "updatedAt": "2026-05-08T08:42:11.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| 400         | Body sai định dạng: enum không hợp lệ, `teachingHours` âm, `departmentId` không phải UUID, ngày sai format... |
| 401         | Thiếu / sai JWT                                                                                       |
| 404         | Không tìm thấy user (`User with ID ... not found`)                                                    |

---
