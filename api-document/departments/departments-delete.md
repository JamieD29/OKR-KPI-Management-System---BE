Xoá một bộ môn / khoa khỏi hệ thống. Endpoint chỉ dành cho Admin. Trước khi xoá, service sẽ **set `department = null`** cho mọi user đang thuộc bộ môn này (user không bị xoá), sau đó mới remove bản ghi `Department`. Một bản ghi `SystemLog` (action `DELETE`, resource `DEPARTMENT`) được tạo, kèm snapshot bộ môn vừa bị xoá.

## HTTP Request

**Endpoint:** `DELETE {baseUrl}/departments/:id`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Path Params


| Attribute | Type          | Required | Description                       |
| --------- | ------------- | -------- | --------------------------------- |
| id        | String (UUID) | √        | ID của bộ môn cần xoá             |


### Body

Không có.

### Example Request

```http
DELETE /departments/d1f0c2e8-1111-2222-3333-444455556666 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về kết quả của `repository.remove(dept)` — là chính bản ghi `Department` vừa bị xoá. Lưu ý: do đặc trưng của TypeORM, sau khi `remove`, field `id` của entity trả về sẽ bị set thành `undefined` (không xuất hiện trong JSON), các field còn lại giữ nguyên giá trị tại thời điểm xoá.


| Attribute   | Type   | Required | Description                                                              |
| ----------- | ------ | -------- | ------------------------------------------------------------------------ |
| name        | String | √        | Tên bộ môn vừa bị xoá                                                    |
| code        | String | √        | Mã bộ môn vừa bị xoá                                                     |
| description | String |          | Mô tả của bộ môn vừa bị xoá (có thể `null`)                              |


### Example Response (200 OK)

```json
{
  "name": "Bộ môn Công nghệ Phần mềm",
  "code": "CNPM",
  "description": "Software Engineering"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| 401         | Thiếu / sai JWT                                                          |
| 403         | Requester không có role `ADMIN`                                          |
| 404         | Không tồn tại bộ môn ứng với `:id` → `Không tìm thấy bộ môn`             |

---
