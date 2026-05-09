Xoá vĩnh viễn một Template OKR theo ID. Service tìm template bằng `findOne(id)` (throw 404 nếu không có), sau đó gọi `repository.remove(...)`.

> ⚠️ Service không xoá kèm các bản ghi `UserOkr` đã được apply từ template này (chúng vẫn giữ `templateId` cũ trỏ đến record không còn tồn tại). Cần lưu ý về mặt nghiệp vụ.

## HTTP Request

**Endpoint:** `DELETE {baseUrl}/okr-templates/:id`

### Path Params


| Attribute | Type          | Required | Description           |
| --------- | ------------- | -------- | --------------------- |
| id        | String (UUID) | √        | ID template cần xoá   |


### Headers


| Attribute     | Type   | Required | Description                                                                  |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| Authorization | String |          | (Optional) Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có.

### Example Request

```http
DELETE /okr-templates/t1111111-aaaa-bbbb-cccc-dddddddddddd HTTP/1.1
Host: api.example.com
```

## HTTP Response

Trả về object xác nhận xoá thành công.


| Attribute | Type    | Required | Description                                  |
| --------- | ------- | -------- | -------------------------------------------- |
| success   | Boolean | √        | Luôn là `true` nếu xoá thành công             |


### Example Response (200 OK)

```json
{
  "success": true
}
```

### Error Responses


| HTTP Status | Khi nào                                                              |
| ----------- | -------------------------------------------------------------------- |
| 404         | Không tìm thấy template (`Template with ID ... not found`)            |
| 500         | `id` không phải UUID hợp lệ                                          |

---
