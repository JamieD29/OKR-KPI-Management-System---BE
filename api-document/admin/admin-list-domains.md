Lấy danh sách tất cả tên miền (`AllowedDomain`) đang được cho phép đăng ký vào hệ thống. Mỗi domain kèm theo `userCount` — số lượng user đang dùng email thuộc domain đó (matching `email LIKE %@<domain>`). Kết quả được sắp xếp theo `addedAt DESC` (domain thêm gần nhất ở đầu).

## HTTP Request

**Endpoint:** `GET {baseUrl}/admin/domains`

### Headers


| Attribute     | Type   | Required | Description                                                          |
| ------------- | ------ | -------- | -------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**: `Bearer <accessToken>`     |


### Query / Body

Không có.

### Example Request

```http
GET /admin/domains HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về object có field `domains` là một mảng các tên miền đang cho phép, kèm số user dùng domain đó.


| Attribute            | Type                  | Required | Description                                                                                                |
| -------------------- | --------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| domains              | Array\<DomainItem\>   | √        | Danh sách domain, có thể là mảng rỗng `[]` nếu DB chưa có domain nào                                       |
| domains[].id         | String (UUID)         | √        | Mã định danh domain                                                                                        |
| domains[].domain     | String                | √        | Tên miền (vd: `gmail.com`, `itec.hcmus.edu.vn`). Là duy nhất trong toàn hệ thống.                          |
| domains[].addedAt    | Date (ISO)            | √        | Thời điểm domain được thêm vào hệ thống (cột `added_at`)                                                   |
| domains[].userCount  | Integer               | √        | Số lượng user đang có email kết thúc bằng `@<domain>` (đếm bằng `LIKE '%@<domain>'`)                       |


### Example Response (200 OK)

```json
{
  "domains": [
    {
      "id": "f4a1b2c3-1111-2222-3333-444455556666",
      "domain": "itec.hcmus.edu.vn",
      "addedAt": "2026-04-30T08:42:11.000Z",
      "userCount": 27
    },
    {
      "id": "a9d8c7b6-aaaa-bbbb-cccc-dddddddddddd",
      "domain": "gmail.com",
      "addedAt": "2026-04-15T03:10:00.000Z",
      "userCount": 5
    },
    {
      "id": "12345678-1234-5678-1234-1234567890ab",
      "domain": "student.hcmus.edu.vn",
      "addedAt": "2026-04-15T03:10:00.000Z",
      "userCount": 0
    }
  ]
}
```

### Error Responses


| HTTP Status | Khi nào                                                          |
| ----------- | ---------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                  |
| 403         | Tài khoản không phải `ADMIN`                                     |
| 500         | Lỗi không mong muốn từ DB (mất kết nối, query lỗi…)              |

---
