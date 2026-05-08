Xóa một chức vụ quản lý (`ManagementPosition`) theo `id`. **Chỉ Admin** mới được phép gọi.

Hệ thống áp dụng các ràng buộc sau trước khi xóa:

- Nếu đang tồn tại bất kỳ kỳ đánh giá (`EvaluationCycle`) nào ở trạng thái `OPEN` → **không cho xóa** (trả `409 Conflict`).
- Nếu không tìm thấy chức vụ với `id` đó → trả `404 Not Found`.
- Khi xóa thành công, các user đang được gán chức vụ này sẽ bị set `managementPosition = NULL` (theo cấu hình `onDelete: 'SET NULL'` trong quan hệ `User → ManagementPosition`). User vẫn còn tồn tại, chỉ là không còn chức vụ.

## HTTP Request

**Endpoint:** `DELETE {baseUrl}/management-positions/:id`

### Path Params


| Attribute | Type          | Required | Description                          |
| --------- | ------------- | -------- | ------------------------------------ |
| id        | String (UUID) | √        | ID của chức vụ quản lý cần xóa       |


### Headers


| Attribute     | Type   | Required | Description                                                                 |
| ------------- | ------ | -------- | --------------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**, định dạng: `Bearer <accessToken>` |


### Body

Không có.

### Example Request

```http
DELETE /management-positions/p2222222-aaaa-bbbb-cccc-dddddddddddd HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về object xác nhận đã xóa, kèm tên chức vụ vừa bị xóa.


| Attribute | Type   | Required | Description                                                |
| --------- | ------ | -------- | ---------------------------------------------------------- |
| message   | String | √        | Thông báo xác nhận, dạng `Đã xóa chức vụ "<tên chức vụ>"` |


### Example Response (200 OK)

```json
{
  "message": "Đã xóa chức vụ \"Trưởng bộ môn\""
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                                                    |
| 403         | Tài khoản không phải `ADMIN` (do `RolesGuard` chặn)                                                                                |
| 404         | Không tìm thấy chức vụ với `id` truyền lên → `Chức vụ với ID "<id>" không tồn tại`                                                 |
| 409         | Có ít nhất một kỳ đánh giá đang `OPEN` → `Không thể xóa chức vụ quản lý trong quá trình đánh giá (có kỳ đánh giá đang mở).`        |

---
