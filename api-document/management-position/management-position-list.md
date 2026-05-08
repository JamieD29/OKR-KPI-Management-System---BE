Lấy danh sách tất cả chức vụ quản lý (`ManagementPosition`) trong hệ thống. Bất kỳ người dùng nào đã đăng nhập đều có thể gọi (kể cả `USER` thường), không yêu cầu role `ADMIN`. Kết quả được sắp xếp theo `createdAt ASC` (chức vụ tạo trước nằm trước).

## HTTP Request

**Endpoint:** `GET {baseUrl}/management-positions`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có.

### Example Request

```http
GET /management-positions HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng chức vụ quản lý, sắp xếp theo `createdAt` tăng dần.


| Attribute | Type                        | Required | Description                                          |
| --------- | --------------------------- | -------- | ---------------------------------------------------- |
| (root)    | Array\<ManagementPosition\> | √        | Danh sách chức vụ, có thể là mảng rỗng `[]`         |


Mỗi phần tử `ManagementPosition` có cấu trúc:


| Attribute       | Type          | Required | Description                                                                          |
| --------------- | ------------- | -------- | ------------------------------------------------------------------------------------ |
| id              | String (UUID) | √        | Mã định danh chức vụ                                                                 |
| name            | String        | √        | Tên hiển thị (vd: `Trưởng khoa`, `Phó khoa`, `Trưởng bộ môn`)                       |
| slug            | String        | √        | Slug duy nhất, dạng UPPER_SNAKE_CASE (vd: `TRUONG_KHOA`, `PHO_KHOA`, `TRUONG_BO_MON`) |
| description     | String        |          | Mô tả chi tiết, có thể `null`                                                        |
| permissionLevel | Enum          | √        | Cấp quyền: `SYSTEM`, `KHOA`, `DON_VI`, `NONE`. Mặc định khi tạo là `NONE`           |
| createdAt       | Date (ISO)    | √        | Thời điểm tạo                                                                        |
| updatedAt       | Date (ISO)    | √        | Thời điểm cập nhật gần nhất                                                          |


### Example Response (200 OK)

```json
[
  {
    "id": "p1111111-aaaa-bbbb-cccc-dddddddddddd",
    "name": "Trưởng khoa",
    "slug": "TRUONG_KHOA",
    "description": "Phụ trách toàn khoa",
    "permissionLevel": "KHOA",
    "createdAt": "2024-08-12T03:14:25.000Z",
    "updatedAt": "2024-08-12T03:14:25.000Z"
  },
  {
    "id": "p2222222-aaaa-bbbb-cccc-dddddddddddd",
    "name": "Trưởng bộ môn",
    "slug": "TRUONG_BO_MON",
    "description": "Phụ trách bộ môn",
    "permissionLevel": "DON_VI",
    "createdAt": "2024-09-01T08:00:00.000Z",
    "updatedAt": "2024-09-01T08:00:00.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
