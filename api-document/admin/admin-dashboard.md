Trả về thống kê tổng hợp người dùng cho trang **Admin Dashboard**. Bao gồm: tổng số users, số users active trong 30 ngày gần đây, số users chưa hoàn thành profile, và số users đã hoàn thành profile.

> **Phân quyền:** Dành cho Admin. Endpoint hiện gắn `JwtAuthGuard` + `RolesGuard(ADMIN)` qua controller.

## HTTP Request

**Endpoint:** `GET {baseUrl}/admin/dashboard`

### Headers

| Attribute     | Type   | Required | Description                                                      |
| ------------- | ------ | -------- | ---------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**: `Bearer <accessToken>` |

### Query / Body

Không có.

### Example Request

```http
GET /admin/dashboard HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

| Field                    | Type    | Description                                                                                    |
| ------------------------ | ------- | ---------------------------------------------------------------------------------------------- |
| users.total              | Integer | Tổng số user trong hệ thống                                                                    |
| users.active             | Integer | Số user có `updatedAt > 30 ngày trước` (tức là có hoạt động trong vòng 30 ngày)               |
| users.incompleteProfile  | Integer | Số user có `profileCompleted = false`                                                          |
| users.completedProfile   | Integer | Số user có `profileCompleted = true`                                                           |

### Example Response (200 OK)

```json
{
  "users": {
    "total": 92,
    "active": 65,
    "incompleteProfile": 8,
    "completedProfile": 84
  }
}
```

### Error Responses

| HTTP Status | Khi nào                                                 |
| ----------- | ------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                         |
| 403         | Tài khoản không phải `ADMIN`                            |
| 500         | Lỗi DB khi thống kê                                     |

---
