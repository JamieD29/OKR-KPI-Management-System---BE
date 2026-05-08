Người dùng tự **chấp nhận** một OKR (`UserOkr`) đã được giao cho mình — chuyển trạng thái `PENDING` (hoặc bất kỳ) sang `ACCEPTED`. Service ràng buộc OKR phải thuộc về user đang đăng nhập (filter bởi `id` + `userId` từ JWT). Bước này là tiền đề để user được phép submit self-report.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/accept`

### Path Params


| Attribute | Type          | Required | Description           |
| --------- | ------------- | -------- | --------------------- |
| id        | String (UUID) | √        | ID của `UserOkr` cần chấp nhận |


### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Body

Không có. Endpoint suy `userId` từ JWT (`req.user.id || req.user.sub`) và dùng nó kết hợp với `:id` để tìm `UserOkr`.

### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/accept HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về entity `UserOkr` sau khi cập nhật `status = 'ACCEPTED'`.


| Attribute | Type          | Required | Description                                                                       |
| --------- | ------------- | -------- | --------------------------------------------------------------------------------- |
| id        | String (UUID) | √        | ID của UserOkr                                                                    |
| userId    | String (UUID) | √        | ID user sở hữu                                                                    |
| status    | String        | √        | Sẽ là `ACCEPTED` sau khi gọi endpoint này                                          |
| ...       | ...           |          | Các field khác giữ nguyên (xem cấu trúc trong `GET /okrs/my`)                      |


### Example Response (200 OK)

```json
{
  "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
  "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "cycleId": "c1111111-aaaa-bbbb-cccc-dddddddddddd",
  "objective": "OKR Giảng viên - Học kỳ 1",
  "keyResults": [
    {
      "id": "A",
      "title": "Nhiệm vụ Giảng dạy",
      "maxScore": 35,
      "items": [{ "id": "1", "title": "Hoàn thành giờ chuẩn", "maxScore": 20, "unitScore": 1, "unit": "giờ" }]
    }
  ],
  "totalScore": 0,
  "templateId": "tp111111-aaaa-bbbb-cccc-dddddddddddd",
  "status": "ACCEPTED",
  "proposedChanges": null,
  "deadline": null,
  "selfReportData": null,
  "managerReportData": null,
  "managerScore": null,
  "createdAt": "2025-09-10T03:14:25.000Z",
  "updatedAt": "2025-09-15T10:00:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                  |
| 404         | `OKR not found` — không tìm thấy `UserOkr` có `id` truyền lên thuộc về `userId` của requester. |

---
