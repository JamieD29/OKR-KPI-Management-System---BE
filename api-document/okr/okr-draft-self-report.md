User **lưu nháp** dữ liệu tự khai mà không nộp chính thức. Service cập nhật `selfReportData` và tính lại `totalScore` để FE hiển thị điểm preview ngay lập tức, nhưng **không thay đổi `status`**.

Khác với `PUT /okrs/:id/self-report` (nộp chính thức chuyển sang `SUBMITTED`), endpoint này giữ nguyên trạng thái `ACCEPTED` và không gửi thông báo cho quản lý.

**Điều kiện:** OKR phải đang ở trạng thái `ACCEPTED`.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/draft-report`

### Path Params

| Attribute | Type          | Required | Description      |
| --------- | ------------- | -------- | ---------------- |
| id        | String (UUID) | √        | ID của `UserOkr` |

### Headers

| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |

### Body

| Attribute      | Type   | Required | Description                                                                                                                    |
| -------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| selfReportData | Object | √        | Map phẳng key-value. Cùng cấu trúc với `PUT /okrs/:id/self-report`. Key: `"<objId>-<krId>"` hoặc `"<objId>-<krId>-<subId>"`. |

### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/draft-report HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "selfReportData": {
    "A-1": { "quantity": 15, "evidence": "Đang tổng hợp" },
    "A-2": { "quantity": 0 }
  }
}
```

## HTTP Response

Trả về entity `UserOkr` sau khi lưu nháp. `status` vẫn là `ACCEPTED`, `totalScore` đã được tính theo dữ liệu nháp.

| Attribute      | Type          | Description                                     |
| -------------- | ------------- | ----------------------------------------------- |
| id             | String (UUID) | ID UserOkr                                      |
| status         | String        | Không đổi — vẫn là `ACCEPTED`                   |
| selfReportData | Object        | Dữ liệu nháp vừa lưu                            |
| totalScore     | Float         | Điểm preview tính từ `selfReportData` hiện tại  |
| ...            | ...           | Các field khác giữ nguyên                       |

### Example Response (200 OK)

```json
{
  "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
  "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "objective": "OKR Giảng viên - Học kỳ 1",
  "status": "ACCEPTED",
  "selfReportData": {
    "A-1": { "quantity": 15, "evidence": "Đang tổng hợp" },
    "A-2": { "quantity": 0 }
  },
  "totalScore": 15,
  "updatedAt": "2026-01-13T14:30:00.000Z"
}
```

### Error Responses

| HTTP Status | Khi nào                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------- |
| 400         | Status không phải `ACCEPTED` → `OKR chưa được chấp nhận, không thể lưu nháp.`                   |
| 401         | Thiếu / sai JWT                                                                                   |
| 404         | Không tìm thấy `UserOkr` có `id` thuộc về `userId` trong JWT                                    |

---
