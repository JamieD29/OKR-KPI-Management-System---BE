**Trưởng khoa duyệt** đề xuất chỉnh sửa OKR của user — chuyển `status` thành `ACCEPTED`. Service KHÔNG ghi đè `proposedChanges` vào `keyResults` (giữ lịch sử chat làm minh chứng). Side-effect: tạo notification gửi cho `userId` của OKR với nội dung `✅ Đề xuất điều chỉnh OKR "<objective>" đã được duyệt!`.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/dean-approve`

### Path Params


| Attribute | Type          | Required | Description                |
| --------- | ------------- | -------- | -------------------------- |
| id        | String (UUID) | √        | ID của `UserOkr` cần duyệt |


### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Body

Không có.

### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/dean-approve HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về `UserOkr` sau khi `status` đã chuyển sang `ACCEPTED`. `proposedChanges` được **giữ nguyên** để lưu lịch sử thương lượng.


| Attribute       | Type          | Required | Description                                                                |
| --------------- | ------------- | -------- | -------------------------------------------------------------------------- |
| id              | String (UUID) | √        | ID UserOkr                                                                 |
| status          | String        | √        | Sẽ là `ACCEPTED`                                                            |
| proposedChanges | Object \| null| √        | Lịch sử chat thương lượng được giữ nguyên (không xóa)                       |
| ...             | ...           |          | Các field khác giữ nguyên (xem cấu trúc trong `GET /okrs/my`)               |


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
      "items": [{ "id": "1", "title": "Hoàn thành giờ chuẩn", "maxScore": 18, "unitScore": 1, "unit": "giờ" }]
    }
  ],
  "totalScore": 0,
  "status": "ACCEPTED",
  "proposedChanges": {
    "1": [
      { "sender": "USER", "message": "Em xin giảm còn 18 giờ", "createdAt": "2025-09-12T08:00:00.000Z" }
    ]
  },
  "selfReportData": null,
  "managerReportData": null,
  "managerScore": null,
  "createdAt": "2025-09-10T03:14:25.000Z",
  "updatedAt": "2025-09-15T10:00:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                          |
| ----------- | ---------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                  |
| 404         | `OKR not found` — không tìm thấy `UserOkr` với `id` truyền lên   |

---
