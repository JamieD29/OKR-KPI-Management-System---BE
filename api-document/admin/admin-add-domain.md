Thêm một tên miền mới vào danh sách `AllowedDomain` — chỉ những email thuộc domain trong bảng này mới được phép đăng ký / đăng nhập vào hệ thống. Domain phải là duy nhất.

## HTTP Request

**Endpoint:** `POST {baseUrl}/admin/domains`

### Headers


| Attribute     | Type   | Required | Description                                                          |
| ------------- | ------ | -------- | -------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**: `Bearer <accessToken>`     |
| Content-Type  | String | √        | `application/json`                                                   |


### Body

Controller dùng `@Body('domain') domain: string` — chỉ đọc đúng field `domain` trong JSON body. Các field khác (nếu có) sẽ bị bỏ qua.


| Attribute | Type   | Required | Description                                                                                       |
| --------- | ------ | -------- | ------------------------------------------------------------------------------------------------- |
| domain    | String | √        | Tên miền cần thêm (vd: `example.com`, `company.edu.vn`). Phải là duy nhất, chưa tồn tại trong DB. |


### Example Request

```http
POST /admin/domains HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "domain": "example.com"
}
```

## HTTP Response

Trả về object có field `domain` là bản ghi `AllowedDomain` vừa được tạo (đã có `id` và `addedAt` do DB sinh ra).


| Attribute      | Type          | Required | Description                                              |
| -------------- | ------------- | -------- | -------------------------------------------------------- |
| domain         | Object        | √        | Bản ghi `AllowedDomain` vừa được tạo                     |
| domain.id      | String (UUID) | √        | Mã định danh domain (do TypeORM sinh ra)                 |
| domain.domain  | String        | √        | Tên miền vừa thêm (giống request)                        |
| domain.addedAt | Date (ISO)    | √        | Thời điểm thêm — service set `new Date()` lúc tạo record |


### Example Response (200 OK)

```json
{
  "domain": {
    "id": "9b8c7d6e-5555-4444-3333-222211110000",
    "domain": "example.com",
    "addedAt": "2026-05-08T13:10:00.000Z"
  }
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                                 |
| 403         | Tài khoản không phải `ADMIN`                                                                                    |
| 409         | `Domain already exists` — domain truyền lên đã tồn tại trong bảng `allowed_domains` (vi phạm ràng buộc unique). |
| 500         | Lỗi không mong muốn từ DB (mất kết nối, vi phạm ràng buộc khác…)                                                |

---

