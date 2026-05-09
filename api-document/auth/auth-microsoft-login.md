Khởi động luồng đăng nhập SSO bằng tài khoản Microsoft (Azure AD / Outlook / Microsoft 365). Tương tự Google: handler controller rỗng, `AuthGuard('microsoft')` sẽ redirect 302 sang trang đăng nhập của Microsoft.

## HTTP Request

**Endpoint:** `GET {baseUrl}/auth/microsoft`

### Headers

Không yêu cầu `Authorization`. Endpoint public.


| Attribute | Type   | Required | Description                                                                       |
| --------- | ------ | -------- | --------------------------------------------------------------------------------- |
| Cookie    | String |          | Session cookie (Passport bật `state: true` + `pkce: true` nên cần session lưu).  |


### Query / Body

Không có. Passport `MicrosoftStrategy` tự inject `client_id`, `redirect_uri`, `scope=user.read email profile openid`, `state`, `code_challenge` (PKCE)...

### Example Request

```http
GET /auth/microsoft HTTP/1.1
Host: api.example.com
```

## HTTP Response

Endpoint **không trả JSON**. Server trả về `302 Found` redirect đến Microsoft Identity Platform: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?...`. Tenant lấy từ env `MICROSOFT_TENANT_ID` (mặc định `common`).


| Attribute | Type   | Required | Description                                                                  |
| --------- | ------ | -------- | ---------------------------------------------------------------------------- |
| Location  | Header | √        | URL Microsoft consent screen, kèm `client_id`, `scope`, `state`, PKCE params |


### Example Response (302 Found)

```http
HTTP/1.1 302 Found
Location: https://login.microsoftonline.com/common/oauth2/v2.0/authorize?response_type=code&redirect_uri=...&scope=user.read%20email%20profile%20openid&client_id=...&state=...&code_challenge=...&code_challenge_method=S256
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 500         | `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` chưa cấu hình, hoặc thiếu session middleware (Passport bật `state: true` cần session). |

---
