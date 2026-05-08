Gửi tin nhắn **thương lượng** trên một item (Objective / Key Result / sub-item) trong cấu trúc OKR. Mỗi tin nhắn được append vào mảng `proposedChanges[itemId]`. Tác dụng phụ về trạng thái:

- Nếu `sender = 'USER'` → `UserOkr.status` chuyển thành `NEGOTIATING` (user đề xuất / phản biện).
- Nếu `sender = 'MANAGER'` → `UserOkr.status` chuyển về `PENDING` (manager đáp lại, chờ user phản hồi).

## HTTP Request

**Endpoint:** `POST {baseUrl}/okrs/:id/chat`

### Path Params


| Attribute | Type          | Required | Description       |
| --------- | ------------- | -------- | ----------------- |
| id        | String (UUID) | √        | ID của `UserOkr`  |


### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |


### Body


| Attribute | Type   | Required | Description                                                                                                                  |
| --------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| itemId    | String | √        | ID của item đang thương lượng. Khớp với field `id` bên trong `UserOkr.keyResults` (vd: `"A"`, `"1"`, `"1.1"`).               |
| message   | String | √        | Nội dung tin nhắn                                                                                                            |
| sender    | Enum   |          | `USER` hoặc `MANAGER`. Mặc định `USER`. Quyết định trạng thái OKR sau lưu (xem mô tả trên cùng).                            |


### Example Request

```http
POST /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/chat HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "itemId": "1",
  "message": "Em xin giảm chỉ tiêu giờ chuẩn còn 18 giờ vì học kỳ này em đi học NCS",
  "sender": "USER"
}
```

## HTTP Response

Trả về `UserOkr` sau khi append message vào `proposedChanges` và cập nhật `status`.


| Attribute       | Type          | Required | Description                                                                                                  |
| --------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| id              | String (UUID) | √        | ID UserOkr                                                                                                   |
| status          | String        | √        | `NEGOTIATING` (sender USER) hoặc `PENDING` (sender MANAGER)                                                  |
| proposedChanges | Object        | √        | Dạng `{ [itemId]: [{ sender, message, createdAt }] }`. Append tin mới vào cuối mảng tương ứng `itemId`.     |
| ...             | ...           |          | Các field khác giữ nguyên (xem cấu trúc trong `GET /okrs/my`)                                                |


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
  "status": "NEGOTIATING",
  "proposedChanges": {
    "1": [
      {
        "sender": "USER",
        "message": "Em xin giảm chỉ tiêu giờ chuẩn còn 18 giờ vì học kỳ này em đi học NCS",
        "createdAt": "2025-09-12T08:00:00.000Z"
      }
    ]
  },
  "selfReportData": null,
  "managerReportData": null,
  "managerScore": null,
  "createdAt": "2025-09-10T03:14:25.000Z",
  "updatedAt": "2025-09-12T08:00:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                          |
| ----------- | ---------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                  |
| 404         | `OKR not found` — không tìm thấy `UserOkr` với `id` truyền lên   |

---
