Xóa **toàn bộ** nhật ký hệ thống (`SystemLog`) trong DB nhằm giải phóng bộ nhớ. **Chỉ Admin** mới được phép gọi (`@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(RoleType.ADMIN)`).

> ⚠️ **Cảnh báo:** Đây là hành động **phá hủy** và **không thể hoàn tác** — backend gọi `repository.clear()` (truncate bảng `system_logs`), tất cả lịch sử log sẽ bị xóa sạch. FE nên hiển thị popup xác nhận trước khi gọi endpoint này.

## HTTP Request

**Endpoint:** `DELETE {baseUrl}/system-logs`

### Headers


| Attribute     | Type   | Required | Description                                                                 |
| ------------- | ------ | -------- | --------------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**, định dạng: `Bearer <accessToken>` |


### Path Params

Không có.

### Query

Không có.

### Body

Không có.

### Example Request

```http
DELETE /system-logs HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Sau khi xóa thành công, backend trả về một object thông báo cố định.


| Attribute | Type   | Required | Description                                                  |
| --------- | ------ | -------- | ------------------------------------------------------------ |
| message   | String | √        | Thông báo cố định: `Đã xóa toàn bộ nhật ký hệ thống.`        |


### Example Response (200 OK)

```json
{
  "message": "Đã xóa toàn bộ nhật ký hệ thống."
}
```

### Error Responses


| HTTP Status | Khi nào                                                |
| ----------- | ------------------------------------------------------ |
| 401         | Thiếu / sai JWT (không qua được `JwtAuthGuard`)        |
| 403         | Tài khoản không phải `ADMIN` (bị `RolesGuard` chặn)    |
| 500         | Lỗi DB khi thực thi `repository.clear()` (hiếm gặp)    |

---
