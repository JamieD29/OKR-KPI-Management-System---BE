Khởi động luồng đăng nhập SSO bằng tài khoản Google. Đây là entry point — controller handler để rỗng, `AuthGuard('google')` của Passport sẽ tự động chuyển hướng (302) trình duyệt sang trang consent của Google.

## HTTP Request

**Endpoint:** `GET {baseUrl}/auth/google`

### Headers

Không yêu cầu `Authorization`. Đây là endpoint public, dùng để khởi động OAuth flow.


| Attribute | Type   | Required | Description                                              |
| --------- | ------ | -------- | -------------------------------------------------------- |
| Accept    | String |          | Trình duyệt sẽ tự gửi (`text/html`), không bắt buộc set. |


### Query / Body

Không có. Toàn bộ tham số OAuth (`client_id`, `redirect_uri`, `scope=email profile`, `response_type=code`...) do Passport `GoogleStrategy` tự inject.

### Example Request

```http
GET /auth/google HTTP/1.1
Host: api.example.com
```

## HTTP Response

Endpoint **không trả JSON**. Server trả về `302 Found` redirect tới Google OAuth consent screen (`https://accounts.google.com/o/oauth2/v2/auth?...`). Sau khi user đồng ý, Google sẽ gọi lại `GET /auth/google/callback`.


| Attribute | Type   | Required | Description                                                                 |
| --------- | ------ | -------- | --------------------------------------------------------------------------- |
| Location  | Header | √        | URL Google consent screen mà Passport tự build kèm `client_id`, `scope`,... |


### Example Response (302 Found)

```http
HTTP/1.1 302 Found
Location: https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=...&scope=email%20profile&client_id=...
```

### Error Responses


| HTTP Status | Khi nào                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------- |
| 500         | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` chưa cấu hình hoặc lỗi khởi tạo strategy     |

---
