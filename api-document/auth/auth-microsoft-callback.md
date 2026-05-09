Endpoint callback do **Microsoft gọi lại** sau khi user đăng nhập / cấp quyền. Server đổi `code` lấy access token, gọi `authService.validateOAuthLogin()` để tạo / cập nhật user, rồi `authService.login()` sinh JWT, cuối cùng `res.redirect()` về frontend kèm `accessToken` và `user`.

## HTTP Request

**Endpoint:** `GET {baseUrl}/auth/microsoft/callback`

### Headers

Endpoint do Microsoft gọi tự động — không cần `Authorization`. Cần Cookie session để Passport verify `state` + PKCE.


| Attribute | Type   | Required | Description                                                                          |
| --------- | ------ | -------- | ------------------------------------------------------------------------------------ |
| Cookie    | String | √        | Session cookie để Passport đối chiếu `state` và `code_verifier` đã lưu trước đó.    |


### Query


| Attribute     | Type   | Required | Description                                                                                                                            |
| ------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| code          | String | √        | Authorization code do Microsoft trả về. Passport tự đổi code lấy access token (kèm `code_verifier`).                                   |
| state         | String | √        | CSRF token Passport tạo lúc redirect đi, Microsoft echo lại. Passport tự verify, mismatch sẽ throw 401.                                |
| session_state | String |          | Tham số bổ sung của Microsoft để track session.                                                                                        |
| error         | String |          | Có giá trị (vd: `access_denied`, `consent_required`) nếu user từ chối hoặc Microsoft trả lỗi.                                          |
| error_description | String |      | Mô tả lỗi nếu có. Microsoft echo về cho client debug.                                                                                  |


### Body

Không có (method `GET`).

### Example Request

```http
GET /auth/microsoft/callback?code=M.R3_BAY.abc...&state=xyz&session_state=12345 HTTP/1.1
Host: api.example.com
Cookie: connect.sid=s%3A...
```

## HTTP Response

Endpoint **không trả JSON**. Server trả về `302 Found` redirect tới `${FRONTEND_URL}/login?accessToken=<JWT>&user=<URL-encoded JSON>`. `FRONTEND_URL` lấy từ env, mặc định `http://localhost:5173`.

Cấu trúc giống y hệt callback của Google (xem `auth-google-callback.md`). Khác duy nhất: với user mới đăng ký bằng Microsoft thì DB sẽ có `microsoftId` thay vì `googleId`, và `avatar` thường là `null` (Microsoft strategy đang set `avatar: null`).


| Attribute               | Type   | Required | Description                                                                                                                                 |
| ----------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Location                | Header | √        | URL frontend kèm 2 query `accessToken` và `user`                                                                                            |
| accessToken             | String | √        | JWT do server ký (`HS256`, `expiresIn=1d`). Payload: `{ sub, email, roles[], name, picture }`.                                              |
| user                    | String | √        | Object user dạng JSON, `JSON.stringify` + `encodeURIComponent`.                                                                             |
| user.id                 | String (UUID) | √ | Mã định danh user                                                                                                                          |
| user.name               | String |          | Họ tên (build từ `givenName` + `familyName`, fallback `displayName`)                                                                        |
| user.email              | String | √        | Email user. Microsoft có thể trả ở `emails[0].value`, `_json.mail`, hoặc `_json.userPrincipalName`.                                         |
| user.avatar             | String |          | Thường `null` cho user đăng nhập bằng Microsoft (strategy không lấy ảnh).                                                                   |
| user.roles              | Array\<String\> | √ | Danh sách slug role (vd: `["USER"]`).                                                                                                      |
| user.jobTitle           | Enum   |          | Chức danh nghề nghiệp, `null` nếu chưa set.                                                                                                 |
| user.profileCompleted   | Boolean | √       | Đã hoàn tất hồ sơ hay chưa.                                                                                                                 |
| user.department         | Object |          | `{ id, name }` hoặc `null`.                                                                                                                 |
| user.managementPosition | Object |          | `{ id, name, slug, permissionLevel }` hoặc `null`. `permissionLevel` ∈ `SYSTEM | KHOA | DON_VI | NONE`.                                     |


### Example Response (302 Found)

```http
HTTP/1.1 302 Found
Location: http://localhost:5173/login?accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&user=%7B%22id%22%3A%22a1b2c3d4...%22%2C%22email%22%3A%22user%40example.edu.vn%22%2C%22avatar%22%3Anull%2C...%7D
```

Sau khi frontend `decodeURIComponent` + `JSON.parse(user)`:

```json
{
  "id": "a1b2c3d4-1111-2222-3333-444455556666",
  "name": "Trần Thị B",
  "email": "user@example.edu.vn",
  "avatar": null,
  "roles": ["USER"],
  "jobTitle": null,
  "profileCompleted": false,
  "department": null,
  "managementPosition": null
}
```

### Error Responses

Endpoint dùng `AuthExceptionFilter` (giống Google callback). Lỗi `DOMAIN_NOT_ALLOWED` bị **redirect về frontend** thay vì trả JSON.


| HTTP Status        | Khi nào                                                                                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 302 (redirect lỗi) | Email không thuộc domain trong `allowed_domains` (và không phải user đầu tiên / không phải ADMIN) → redirect `${FRONTEND_URL}/login?error=domain_not_allowed`. Đồng thời ghi `system_logs` với `status=FAILED`. |
| 401                | Passport `AuthGuard('microsoft')` xác thực thất bại: `state` không khớp (CSRF), code sai/hết hạn, PKCE mismatch, hoặc thiếu session.                                                                    |
| 500                | `Cannot retrieve email from Microsoft account` — Microsoft trả profile không có email (`emails`, `mail`, `userPrincipalName` đều rỗng). Hoặc `Email not found from provider` từ service. Hoặc lỗi DB. |

---
