Lấy danh sách toàn bộ bộ môn / khoa, sắp xếp tăng dần theo `name`. Mỗi phần tử có thêm field `memberCount` thống kê số user đang gắn với bộ môn đó (relation `users` không được trả về).

## HTTP Request

**Endpoint:** `GET {baseUrl}/departments`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có.

### Example Request

```http
GET /departments HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng `Department`, sắp xếp `name ASC`. Field `users` đã được loại bỏ, thay bằng `memberCount`.


| Attribute | Type                | Required | Description                                          |
| --------- | ------------------- | -------- | ---------------------------------------------------- |
| (root)    | Array\<Department\> | √        | Danh sách bộ môn, có thể là mảng rỗng `[]`           |


Mỗi phần tử `Department` gồm:


| Attribute   | Type          | Required | Description                                                                                  |
| ----------- | ------------- | -------- | -------------------------------------------------------------------------------------------- |
| id          | String (UUID) | √        | Mã định danh bộ môn                                                                          |
| name        | String        | √        | Tên bộ môn                                                                                   |
| code        | String        | √        | Mã bộ môn (duy nhất)                                                                         |
| description | String        |          | Mô tả thêm                                                                                   |
| memberCount | Number        | √        | Số user đang thuộc bộ môn này. Mặc định `0` nếu chưa có ai                                   |
| users       | undefined     |          | Field này luôn là `undefined` (service chủ động bỏ ra khỏi payload sau khi đếm `memberCount`) |


### Example Response (200 OK)

```json
[
  {
    "id": "d1f0c2e8-1111-2222-3333-444455556666",
    "name": "Bộ môn Công nghệ Phần mềm",
    "code": "CNPM",
    "description": "Software Engineering",
    "memberCount": 12
  },
  {
    "id": "e2f0c2e8-2222-3333-4444-555566667777",
    "name": "Bộ môn Hệ thống Thông tin",
    "code": "HTTT",
    "description": null,
    "memberCount": 0
  }
]
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
