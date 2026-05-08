Endpoint callback do **Google gọi lại** sau khi user đồng ý cấp quyền. Server xác thực `code`, gọi `authService.validateOAuthLogin()` để tạo / cập nhật user trong DB, rồi `authService.login()` để sinh JWT, cuối cùng `res.redirect()` về frontend kèm `accessToken` và `user`.

## HTTP Request

**Endpoint:** `GET {baseUrl}/auth/google/callback`

### Headers

Endpoint này được Google gọi tự động — không cần `Authorization`. Tuy nhiên Passport sẽ đọc state / cookie session.


| Attribute | Type   | Required | Description                                                              |
| --------- | ------ | -------- | ------------------------------------------------------------------------ |
| Cookie    | String |          | Session cookie do Express tự đính kèm (Passport dùng để verify `state`). |


### Query


| Attribute | Type   | Required | Description                                                                                            |
| --------- | ------ | -------- | ------------------------------------------------------------------------------------------------------ |
| code      | String | √        | Authorization code do Google trả về sau consent. Passport sẽ trao đổi code này lấy access token.       |
| state     | String |          | Tham số CSRF do Passport gắn vào ban đầu, Google echo lại. Passport tự verify.                         |
| scope     | String |          | Các scope đã được user đồng ý (vd: `email profile openid`). Google echo lại để client biết.            |
| error     | String |          | Có giá trị (vd: `access_denied`) nếu user từ chối hoặc Google trả lỗi. Khi có `error` thì không có `code`. |


### Body

Không có (method `GET`).

### Example Request

```http
GET /auth/google/callback?code=4%2F0AVMBsJh...&scope=email+profile+openid&authuser=0&prompt=none HTTP/1.1
Host: api.example.com
```

## HTTP Response

Endpoint **không trả JSON**. Server trả về `302 Found` redirect tới `${FRONTEND_URL}/login?accessToken=<JWT>&user=<URL-encoded JSON>` để frontend lưu token và thông tin user. `FRONTEND_URL` lấy từ env (`process.env.FRONTEND_URL`), mặc định `http://localhost:5173`.


| Attribute             | Type   | Required | Description                                                                                                                              |
| --------------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Location              | Header | √        | URL frontend kèm 2 query string `accessToken` và `user`                                                                                  |
| accessToken           | String | √        | JWT do server ký (`HS256`, `expiresIn=1d`). Payload: `{ sub, email, roles[], name, picture }`.                                           |
| user                  | String | √        | Object user dạng JSON, đã `JSON.stringify` + `encodeURIComponent`. Sau khi `decodeURIComponent` + `JSON.parse` sẽ ra cấu trúc bên dưới. |
| user.id               | String (UUID) | √ | Mã định danh user                                                                                                                        |
| user.name             | String |          | Họ tên hiển thị                                                                                                                          |
| user.email            | String | √        | Email đăng nhập                                                                                                                          |
| user.avatar           | String |          | URL ảnh đại diện (lấy từ `user.avatarUrl` trong DB; lưu ý FE nhận key tên là `avatar`, không phải `avatarUrl`)                           |
| user.roles            | Array\<String\> | √ | Danh sách slug role của user (vd: `["ADMIN"]`, `["USER"]`)                                                                              |
| user.jobTitle         | Enum   |          | Chức danh nghề nghiệp. Có thể `null` nếu chưa set.                                                                                       |
| user.profileCompleted | Boolean | √       | User đã hoàn tất thiết lập hồ sơ lần đầu hay chưa. FE dùng để quyết định redirect sang màn cập nhật hồ sơ.                               |
| user.department       | Object |          | Bộ môn/Khoa: `{ id, name }`. `null` nếu user chưa thuộc department nào.                                                                  |
| user.managementPosition | Object |        | Chức vụ quản lý: `{ id, name, slug, permissionLevel }`. `null` nếu user không giữ chức vụ. `permissionLevel` ∈ `SYSTEM | KHOA | DON_VI | NONE`. |


### Example Response (302 Found)

```http
HTTP/1.1 302 Found
Location: http://localhost:5173/login?accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&user=%7B%22id%22%3A%228a7b6c5d...%22%2C%22email%22%3A%22lecturer%40example.edu.vn%22%2C...%7D
```

Sau khi frontend `decodeURIComponent` và `JSON.parse` query `user`, nội dung sẽ tương đương:

```json
{
  "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "name": "Nguyễn Văn A",
  "email": "lecturer@example.edu.vn",
  "avatar": "https://lh3.googleusercontent.com/a/abc123",
  "roles": ["USER"],
  "jobTitle": "Giảng viên",
  "profileCompleted": true,
  "department": {
    "id": "d1f0c2e8-1111-2222-3333-444455556666",
    "name": "Bộ môn Công nghệ Phần mềm"
  },
  "managementPosition": {
    "id": "p2222222-aaaa-bbbb-cccc-dddddddddddd",
    "name": "Trưởng bộ môn",
    "slug": "TRUONG_BO_MON",
    "permissionLevel": "DON_VI"
  }
}
```

### Error Responses

Endpoint dùng `AuthExceptionFilter` để bắt `ForbiddenException`. Lỗi `DOMAIN_NOT_ALLOWED` bị **redirect về frontend** thay vì trả JSON.


| HTTP Status   | Khi nào                                                                                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 302 (redirect lỗi) | Email không phải user đầu tiên, không có role `ADMIN`, và `domain` của email không nằm trong bảng `allowed_domains` → redirect `${FRONTEND_URL}/login?error=domain_not_allowed`. Service throw `ForbiddenException('DOMAIN_NOT_ALLOWED')` và đồng thời ghi `system_logs` với `status=FAILED`. |
| 401           | Passport `AuthGuard('google')` không xác thực được `code` (code sai/hết hạn, mismatch state, ...).                                                                                                   |
| 500           | `Email not found from provider` — Google trả profile không có email (hiếm). Hoặc lỗi DB khi lưu user.                                                                                                |

---
