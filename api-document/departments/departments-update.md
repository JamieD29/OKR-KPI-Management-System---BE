Cập nhật thông tin một bộ môn / khoa. Hỗ trợ partial update — chỉ những field gửi lên mới bị thay đổi. Endpoint chỉ dành cho Admin và sẽ ghi nhận một bản ghi `SystemLog` (action `UPDATE`, resource `DEPARTMENT`) lưu cả `old` lẫn `new` để truy vết.

## HTTP Request

**Endpoint:** `PATCH {baseUrl}/departments/:id`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |


### Path Params


| Attribute | Type          | Required | Description                          |
| --------- | ------------- | -------- | ------------------------------------ |
| id        | String (UUID) | √        | ID của bộ môn cần cập nhật           |


### Body

`UpdateDepartmentDto` kế thừa `PartialType(CreateDepartmentDto)` → mọi field đều **optional**, nhưng nếu gửi lên thì phải pass đúng các rule validate gốc.


| Attribute   | Type   | Required | Description                                                                                                                                                                       |
| ----------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name        | String |          | Tên bộ môn mới. Chỉ cho phép chữ cái (kể cả tiếng Việt `À-ỹ`), số, khoảng trắng và dấu gạch ngang `-`. Không được rỗng nếu gửi.                                                  |
| code        | String |          | Mã bộ môn mới. Chỉ chứa chữ HOA `A-Z`, số `0-9`, dấu gạch dưới `_`. Độ dài 2-10 ký tự. Phải duy nhất so với các bộ môn khác.                                                     |
| description | String |          | Mô tả mới của bộ môn.                                                                                                                                                             |


### Example Request

```http
PATCH /departments/d1f0c2e8-1111-2222-3333-444455556666 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Bộ môn Công nghệ Phần mềm",
  "code": "CNPM",
  "description": "Software Engineering - Cập nhật mô tả"
}
```

## HTTP Response

Trả về bản ghi `Department` sau khi đã cập nhật.


| Attribute   | Type          | Required | Description                          |
| ----------- | ------------- | -------- | ------------------------------------ |
| id          | String (UUID) | √        | Mã định danh bộ môn                  |
| name        | String        | √        | Tên bộ môn sau cập nhật              |
| code        | String        | √        | Mã bộ môn sau cập nhật               |
| description | String        |          | Mô tả sau cập nhật (có thể `null`)   |


### Example Response (200 OK)

```json
{
  "id": "d1f0c2e8-1111-2222-3333-444455556666",
  "name": "Bộ môn Công nghệ Phần mềm",
  "code": "CNPM",
  "description": "Software Engineering - Cập nhật mô tả"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400         | Body sai validate: `Tên bộ môn không được chứa ký tự đặc biệt (@, #, $...)`, `Mã bộ môn chỉ được chứa chữ HOA, số và dấu gạch dưới (_)`, `Mã bộ môn phải từ 2 đến 10 ký tự`           |
| 401         | Thiếu / sai JWT                                                                                                                                                                        |
| 403         | Requester không có role `ADMIN`                                                                                                                                                        |
| 404         | Không tồn tại bộ môn ứng với `:id` → `Không tìm thấy bộ môn`                                                                                                                           |
| 409         | `code` mới trùng với một bộ môn khác → `Mã bộ môn này đã được sử dụng`                                                                                                                 |

---
