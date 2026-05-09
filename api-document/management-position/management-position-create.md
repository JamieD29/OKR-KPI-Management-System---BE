Tạo mới một chức vụ quản lý (`ManagementPosition`). **Chỉ Admin** mới được phép gọi.

Hệ thống tự động chuẩn hóa `slug` về dạng UPPER_SNAKE_CASE trước khi lưu:

- Chuyển toàn bộ về chữ HOA.
- Thay mọi khoảng trắng bằng dấu `_`.
- Loại bỏ tất cả ký tự không thuộc `[A-Z0-9_]` (ví dụ dấu tiếng Việt, ký tự đặc biệt).

Ví dụ: `Trưởng Bộ Môn` → `TRNG_B_MN`, `truong-bo-mon` → `TRUONGBOMON`, `truong_bo_mon` → `TRUONG_BO_MON`. Vì vậy FE nên gửi slug đã chuẩn bằng UPPER_SNAKE_CASE thuần ASCII.

Nếu `slug` (sau khi chuẩn hóa) đã tồn tại trong DB → trả về `409 Conflict`.

`permissionLevel` không bắt buộc; nếu không gửi sẽ mặc định là `NONE`.

## HTTP Request

**Endpoint:** `POST {baseUrl}/management-positions`

### Headers


| Attribute     | Type   | Required | Description                                                                 |
| ------------- | ------ | -------- | --------------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                                          |


### Body


| Attribute       | Type   | Required | Description                                                                                                  |
| --------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| name            | String | √        | Tên hiển thị của chức vụ (vd: `Trưởng khoa`, `Phó khoa`, `Trưởng bộ môn`)                                     |
| slug            | String | √        | Slug định danh dùng trong code. Sẽ bị normalize về UPPER_SNAKE_CASE. Phải duy nhất sau normalize.             |
| description     | String |          | Mô tả chi tiết chức vụ                                                                                       |
| permissionLevel | Enum   |          | Cấp quyền của chức vụ. Giá trị: `SYSTEM`, `KHOA`, `DON_VI`, `NONE`. Mặc định: `NONE`                         |


### Example Request

```http
POST /management-positions HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Trưởng bộ môn",
  "slug": "TRUONG_BO_MON",
  "description": "Phụ trách bộ môn",
  "permissionLevel": "DON_VI"
}
```

## HTTP Response

Trả về object `ManagementPosition` vừa tạo.


| Attribute       | Type          | Required | Description                                                                  |
| --------------- | ------------- | -------- | ---------------------------------------------------------------------------- |
| id              | String (UUID) | √        | Mã định danh chức vụ vừa tạo                                                 |
| name            | String        | √        | Tên hiển thị                                                                 |
| slug            | String        | √        | Slug đã được normalize về UPPER_SNAKE_CASE                                   |
| description     | String        |          | Mô tả (có thể `null` nếu không gửi)                                          |
| permissionLevel | Enum          | √        | Cấp quyền (`SYSTEM` \| `KHOA` \| `DON_VI` \| `NONE`)                         |
| createdAt       | Date (ISO)    | √        | Thời điểm tạo                                                                |
| updatedAt       | Date (ISO)    | √        | Thời điểm cập nhật gần nhất                                                  |


### Example Response (200 OK)

```json
{
  "id": "p2222222-aaaa-bbbb-cccc-dddddddddddd",
  "name": "Trưởng bộ môn",
  "slug": "TRUONG_BO_MON",
  "description": "Phụ trách bộ môn",
  "permissionLevel": "DON_VI",
  "createdAt": "2026-05-08T08:42:11.000Z",
  "updatedAt": "2026-05-08T08:42:11.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                          |
| 403         | Tài khoản không phải `ADMIN` (do `RolesGuard` chặn)                                                      |
| 409         | `slug` (sau khi normalize) đã tồn tại → `Chức vụ với slug "<SLUG>" đã tồn tại`                            |

---
