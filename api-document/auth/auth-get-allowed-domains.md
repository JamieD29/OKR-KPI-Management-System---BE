Lấy danh sách các tên miền email được hệ thống cho phép đăng nhập (public, không cần auth). Frontend dùng API này để hiển thị / kiểm tra trước khi user thử đăng nhập SSO.

## HTTP Request

**Endpoint:** `GET {baseUrl}/auth/allowed-domains`

### Headers

Không yêu cầu `Authorization`. Endpoint này là public.


| Attribute | Type   | Required | Description                            |
| --------- | ------ | -------- | -------------------------------------- |
| Accept    | String |          | Khuyến nghị `application/json`         |


### Query / Body

Không có.

### Example Request

```http
GET /auth/allowed-domains HTTP/1.1
Host: api.example.com
Accept: application/json
```

## HTTP Response

Trả về object chứa mảng các domain. Service gọi `domainRepository.find({ select: ['domain'] })` nên mỗi phần tử chỉ có duy nhất field `domain` (các field khác như `id`, `addedAt` của entity `AllowedDomain` **không** được expose).


| Attribute       | Type   | Required | Description                                                          |
| --------------- | ------ | -------- | -------------------------------------------------------------------- |
| domains         | Array  | √        | Danh sách domain được phép. Có thể là mảng rỗng `[]` nếu DB chưa có. |
| domains[].domain | String | √        | Tên miền email được phép (vd: `example.edu.vn`)                      |


### Example Response (200 OK)

```json
{
  "domains": [
    { "domain": "example.edu.vn" },
    { "domain": "fpt.edu.vn" },
    { "domain": "vnu.edu.vn" }
  ]
}
```

### Error Responses


| HTTP Status | Khi nào                                          |
| ----------- | ------------------------------------------------ |
| 500         | Lỗi truy vấn DB / lỗi server không xác định      |

---
