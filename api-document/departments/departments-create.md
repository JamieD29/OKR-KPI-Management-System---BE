Tạo mới một bộ môn / khoa. Endpoint chỉ dành cho Admin và sẽ ghi nhận một bản ghi `SystemLog` (action `CREATE`, resource `DEPARTMENT`) cho user thực hiện.

## HTTP Request

**Endpoint:** `POST {baseUrl}/departments`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |


### Body


| Attribute   | Type   | Required | Description                                                                                                                                                                                                       |
| ----------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name        | String | √        | Tên bộ môn / khoa. Chỉ cho phép chữ cái (kể cả tiếng Việt `À-ỹ`), số, khoảng trắng và dấu gạch ngang `-`. Không được để trống và không chứa ký tự đặc biệt (`@`, `#`, `$`...).                                    |
| code        | String | √        | Mã bộ môn (duy nhất trên toàn hệ thống). Chỉ chứa chữ HOA `A-Z`, số `0-9` và dấu gạch dưới `_`. Độ dài từ 2 đến 10 ký tự.                                                                                          |
| description | String |          | Mô tả thêm về bộ môn / khoa.                                                                                                                                                                                      |


### Example Request

```http
POST /departments HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Bộ môn Công nghệ Phần mềm",
  "code": "CNPM",
  "description": "Software Engineering"
}
```

## HTTP Response

Trả về bản ghi `Department` vừa được tạo.


| Attribute   | Type          | Required | Description                                                |
| ----------- | ------------- | -------- | ---------------------------------------------------------- |
| id          | String (UUID) | √        | Mã định danh của bộ môn vừa tạo                            |
| name        | String        | √        | Tên bộ môn                                                 |
| code        | String        | √        | Mã bộ môn (duy nhất)                                       |
| description | String        |          | Mô tả bộ môn (có thể `null` nếu không gửi lên ở body)      |


### Example Response (200 OK)

```json
{
  "id": "d1f0c2e8-1111-2222-3333-444455556666",
  "name": "Bộ môn Công nghệ Phần mềm",
  "code": "CNPM",
  "description": "Software Engineering"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400         | Body sai validate: `Tên bộ môn không được để trống`, `Tên bộ môn không được chứa ký tự đặc biệt (@, #, $...)`, `Mã bộ môn không được để trống`, `Mã bộ môn chỉ được chứa chữ HOA, số và dấu gạch dưới (_)`, `Mã bộ môn phải từ 2 đến 10 ký tự` |
| 401         | Thiếu / sai JWT                                                                                                                                                                          |
| 403         | Requester không có role `ADMIN`                                                                                                                                                          |
| 409         | Trùng tên bộ môn → `Tên bộ môn đã tồn tại`                                                                                                                                                |

---
