**Trưởng khoa từ chối** đề xuất chỉnh sửa OKR của user — chuyển `status` về `PENDING` và **xóa** toàn bộ `proposedChanges`. Side-effect: tạo notification gửi cho `userId` của OKR với nội dung `❌ Đề xuất OKR "<objective>" bị từ chối: <reason>`.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/dean-reject`

### Path Params


| Attribute | Type          | Required | Description                  |
| --------- | ------------- | -------- | ---------------------------- |
| id        | String (UUID) | √        | ID của `UserOkr` cần từ chối |


### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |


### Body


| Attribute | Type   | Required | Description                                                                                |
| --------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| reason    | String |          | Lý do từ chối (sẽ append vào nội dung notification). Nếu thiếu / rỗng → mặc định `"Không có lý do"`. |


### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/dean-reject HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "reason": "Chỉ tiêu giờ chuẩn 18 thấp hơn quy định khoa, không thể duyệt"
}
```

## HTTP Response

Trả về `UserOkr` sau khi `status = 'PENDING'` và `proposedChanges = null`.


| Attribute       | Type          | Required | Description                                                |
| --------------- | ------------- | -------- | ---------------------------------------------------------- |
| id              | String (UUID) | √        | ID UserOkr                                                 |
| status          | String        | √        | Sẽ là `PENDING`                                             |
| proposedChanges | null          | √        | Bị reset về `null` sau khi từ chối                          |
| ...             | ...           |          | Các field khác giữ nguyên (xem cấu trúc trong `GET /okrs/my`) |


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
  "status": "PENDING",
  "proposedChanges": null,
  "selfReportData": null,
  "managerReportData": null,
  "managerScore": null,
  "createdAt": "2025-09-10T03:14:25.000Z",
  "updatedAt": "2025-09-15T10:30:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                          |
| ----------- | ---------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                  |
| 404         | `OKR not found` — không tìm thấy `UserOkr` với `id` truyền lên   |

---
