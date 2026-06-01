Trả về thông tin **sức khỏe hệ thống theo thời gian thực** cho Admin Dashboard: CPU load, RAM usage, uptime server, và thông tin Node.js process. Dữ liệu lấy từ Node.js `os` module — tính CPU delta trong cửa sổ **150ms** để đảm bảo hoạt động chính xác trên cả Windows và Linux/macOS.

> **Phân quyền:** Dành cho Admin.

## HTTP Request

**Endpoint:** `GET {baseUrl}/admin/system-health`

### Headers

| Attribute     | Type   | Required | Description                                                      |
| ------------- | ------ | -------- | ---------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**: `Bearer <accessToken>` |

### Query / Body

Không có.

### Example Request

```http
GET /admin/system-health HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

> **Lưu ý về độ trễ:** Request mất tối thiểu **~150ms** vì service cần đo delta CPU trong cửa sổ thời gian đó.

| Field                            | Type    | Description                                                                                              |
| -------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| cpu.loadPercent                  | Integer | Phần trăm CPU đang sử dụng (0–100), tính từ delta `os.cpus()` trong 150ms                               |
| cpu.coreCount                    | Integer | Số lõi CPU                                                                                               |
| cpu.model                        | String  | Model CPU (từ `os.cpus()[0].model`)                                                                      |
| cpu.measurementWindowMs          | Integer | Cửa sổ đo (luôn `150`)                                                                                  |
| memory.totalBytes                | Integer | Tổng RAM hệ thống (bytes)                                                                                |
| memory.usedBytes                 | Integer | RAM đang dùng (bytes)                                                                                    |
| memory.freeBytes                 | Integer | RAM còn trống (bytes)                                                                                    |
| memory.usagePercent              | Integer | Phần trăm RAM đang dùng (0–100)                                                                         |
| memory.totalGB                   | Float   | Tổng RAM (GB, làm tròn 1 chữ số)                                                                        |
| memory.usedGB                    | Float   | RAM đang dùng (GB)                                                                                       |
| memory.freeGB                    | Float   | RAM còn trống (GB)                                                                                       |
| nodeProcess.heapUsedMB           | Integer | Heap đang dùng của Node.js process (MB)                                                                  |
| nodeProcess.heapTotalMB          | Integer | Tổng heap Node.js đã cấp phát (MB)                                                                       |
| nodeProcess.rssMB                | Integer | RSS (Resident Set Size) của Node.js process (MB)                                                        |
| nodeProcess.heapUsagePercent     | Integer | Phần trăm heap đang dùng                                                                                 |
| nodeProcess.pid                  | Integer | Process ID của server Node.js                                                                            |
| nodeProcess.nodeVersion          | String  | Phiên bản Node.js (VD: `"v20.11.0"`)                                                                    |
| uptime.totalSeconds              | Integer | Uptime server tính bằng giây (`os.uptime()`)                                                             |
| uptime.days                      | Integer | Số ngày                                                                                                  |
| uptime.hours                     | Integer | Số giờ còn lại (sau khi trừ ngày)                                                                       |
| uptime.minutes                   | Integer | Số phút còn lại (sau khi trừ giờ)                                                                       |
| uptime.label                     | String  | Chuỗi mô tả. VD: `"3 ngày 5 giờ 12 phút"` hoặc `"2 giờ 45 phút"` khi dưới 1 ngày                     |
| system.platform                  | String  | Platform (`linux`, `darwin`, `win32`, …)                                                                 |
| system.arch                      | String  | Kiến trúc CPU (`x64`, `arm64`, …)                                                                       |
| system.hostname                  | String  | Tên máy chủ                                                                                              |
| timestamp                        | String (ISO) | Thời điểm lấy dữ liệu                                                                             |

### Example Response (200 OK)

```json
{
  "cpu": {
    "loadPercent": 12,
    "coreCount": 8,
    "model": "Apple M2",
    "measurementWindowMs": 150
  },
  "memory": {
    "totalBytes": 17179869184,
    "usedBytes": 10737418240,
    "freeBytes": 6442450944,
    "usagePercent": 62,
    "totalGB": 16,
    "usedGB": 10,
    "freeGB": 6
  },
  "nodeProcess": {
    "heapUsedMB": 85,
    "heapTotalMB": 120,
    "rssMB": 145,
    "heapUsagePercent": 70,
    "pid": 12345,
    "nodeVersion": "v20.11.0"
  },
  "uptime": {
    "totalSeconds": 283212,
    "days": 3,
    "hours": 5,
    "minutes": 0,
    "label": "3 ngày 5 giờ 0 phút"
  },
  "system": {
    "platform": "linux",
    "arch": "x64",
    "hostname": "prod-server-01"
  },
  "timestamp": "2026-05-31T08:45:00.000Z"
}
```

### Error Responses

| HTTP Status | Khi nào                      |
| ----------- | ---------------------------- |
| 401         | Thiếu / sai JWT              |
| 403         | Tài khoản không phải `ADMIN` |

---
