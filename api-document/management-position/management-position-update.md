Cập nhật một chức vụ quản lý (`ManagementPosition`) theo `id`. **Chỉ Admin** mới được phép gọi. Hỗ trợ partial update — chỉ những field được gửi lên mới bị thay đổi.

Nếu `slug` được gửi lên, nó sẽ bị normalize về UPPER_SNAKE_CASE giống như khi tạo (uppercase + thay khoảng trắng bằng `_` + loại bỏ ký tự ngoài `[A-Z0-9_]`). Hệ thống cũng sẽ check trùng (loại trừ chính bản thân chức vụ đang update); nếu slug mới đã tồn tại ở chức vụ khác → `409 Conflict`.

## HTTP Request

**Endpoint:** `PATCH {baseUrl}/management-positions/:id`

### Path Params


| Attribute | Type          | Required | Description                                |
| --------- | ------------- | -------- | ------------------------------------------ |
| id        | String (UUID) | √        | ID của chức vụ quản lý cần cập nhật        |


### Headers


| Attribute     | Type   | Required | Description                                                                 |
| ------------- | ------ | -------- | --------------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                                          |


### Body


| Attribute       | Type   | Required | Description                                                                                                       |
| --------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------- |
| name            | String |          | Tên mới của chức vụ                                                                                               |
| slug            | String |          | Slug mới. Sẽ bị normalize về UPPER_SNAKE_CASE; phải duy nhất so với các chức vụ khác.                             |
| description     | String |          | Mô tả mới. Gửi `""` để xóa nội dung mô tả (lưu ý: `null` rõ ràng KHÔNG được kiểm tra riêng, nên chỉ check `undefined`). |
| permissionLevel | Enum   |          | Cấp quyền mới. Giá trị: `SYSTEM`, `KHOA`, `DON_VI`, `NONE`                                                        |


### Example Request

```http
PATCH /management-positions/p2222222-aaaa-bbbb-cccc-dddddddddddd HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Trưởng bộ môn CNPM",
  "description": "Phụ trách bộ môn Công nghệ Phần mềm",
  "permissionLevel": "DON_VI"
}
```

## HTTP Response

Trả về object `ManagementPosition` sau khi cập nhật.


| Attribute       | Type          | Required | Description                                            |
| --------------- | ------------- | -------- | ------------------------------------------------------ |
| id              | String (UUID) | √        | Mã định danh chức vụ                                   |
| name            | String        | √        | Tên hiển thị (sau cập nhật)                            |
| slug            | String        | √        | Slug đã normalize (sau cập nhật)                       |
| description     | String        |          | Mô tả                                                  |
| permissionLevel | Enum          | √        | Cấp quyền (`SYSTEM` \| `KHOA` \| `DON_VI` \| `NONE`)   |
| createdAt       | Date (ISO)    | √        | Thời điểm tạo                                          |
| updatedAt       | Date (ISO)    | √        | Thời điểm cập nhật mới nhất                            |


### Example Response (200 OK)

```json
{
  "id": "p2222222-aaaa-bbbb-cccc-dddddddddddd",
  "name": "Trưởng bộ môn CNPM",
  "slug": "TRUONG_BO_MON",
  "description": "Phụ trách bộ môn Công nghệ Phần mềm",
  "permissionLevel": "DON_VI",
  "createdAt": "2024-09-01T08:00:00.000Z",
  "updatedAt": "2026-05-08T08:42:11.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| 401         | Thiếu / sai JWT                                                                                  |
| 403         | Tài khoản không phải `ADMIN` (do `RolesGuard` chặn)                                              |
| 404         | Không tìm thấy chức vụ với `id` truyền lên → `Chức vụ với ID "<id>" không tồn tại`               |
| 409         | `slug` mới (sau khi normalize) trùng với chức vụ khác → `Chức vụ với slug "<SLUG>" đã tồn tại`   |

---
