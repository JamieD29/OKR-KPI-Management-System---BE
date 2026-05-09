**Trưởng khoa / Quản lý chấm lại** một self-report của user. Service:

1. Lưu `managerReportData` (giữ chung format với `selfReportData`).
2. Tính `managerScore` bằng cùng công thức tính điểm trên cây `keyResults` (xem `PUT /okrs/:id/self-report`).
3. Chuyển `status = 'COMPLETED'`.
4. **Auto-sync** sang `UserEvaluation` của user — clone điểm từng Objective sang `evaluationData` (chỉ ghi đè nếu phiếu chưa `EVALUATED`).
5. Tạo notification cho user: `📊 OKR "<objective>" đã được Trưởng khoa xem xét và duyệt: <managerScore> điểm. Phiếu Đánh Giá đã được cập nhật.`

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/manager-review`

### Path Params


| Attribute | Type          | Required | Description                  |
| --------- | ------------- | -------- | ---------------------------- |
| id        | String (UUID) | √        | ID của `UserOkr` cần chấm lại |


### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |


### Body


| Attribute         | Type   | Required | Description                                                                                                                                        |
| ----------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| managerReportData | Object | √        | Map phẳng key-value, **cùng format với `selfReportData`**. Key: `"<objId>-<krId>"` hoặc `"<objId>-<krId>-<subId>"`; value: `{ quantity, evidence? }`. |


### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/manager-review HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "managerReportData": {
    "A-1": { "quantity": 16, "evidence": "Đã trừ 2 giờ thiếu minh chứng" },
    "A-2": { "quantity": 1, "evidence": "Đã đối chiếu DOI" },
    "A-2-2.1": { "quantity": 1, "evidence": "Hợp đồng đã ký" }
  }
}
```

## HTTP Response

Trả về `UserOkr` sau khi chốt điểm. `status = 'COMPLETED'`, `managerScore` đã được tính.


| Attribute         | Type          | Required | Description                                                            |
| ----------------- | ------------- | -------- | ---------------------------------------------------------------------- |
| id                | String (UUID) | √        | ID UserOkr                                                             |
| status            | String        | √        | `COMPLETED`                                                            |
| managerReportData | Object        | √        | Đúng object FE gửi lên                                                 |
| managerScore      | Float         | √        | Điểm tổng do service tính từ `managerReportData` × cây `keyResults`    |
| selfReportData    | Object        |          | Vẫn giữ nguyên (để hiển thị "User khai vs Manager chốt")               |
| totalScore        | Float         |          | Vẫn giữ nguyên điểm tự khai cũ                                          |
| ...               | ...           |          | Các field khác giữ nguyên (xem cấu trúc trong `GET /okrs/my`)           |


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
      "items": [
        { "id": "1", "title": "Hoàn thành giờ chuẩn", "maxScore": 20, "unitScore": 1, "unit": "giờ" },
        { "id": "2", "title": "Bài báo Q1", "maxScore": 10, "unitScore": 5, "unit": "bài",
          "items": [{ "id": "2.1", "title": "Đề tài cấp trường", "maxScore": 5, "unitScore": 5 }]
        }
      ]
    }
  ],
  "totalScore": 28,
  "managerScore": 26,
  "status": "COMPLETED",
  "selfReportData": {
    "A-1": { "quantity": 18, "evidence": "..." },
    "A-2": { "quantity": 1, "evidence": "..." },
    "A-2-2.1": { "quantity": 1, "evidence": "..." }
  },
  "managerReportData": {
    "A-1": { "quantity": 16, "evidence": "Đã trừ 2 giờ thiếu minh chứng" },
    "A-2": { "quantity": 1, "evidence": "Đã đối chiếu DOI" },
    "A-2-2.1": { "quantity": 1, "evidence": "Hợp đồng đã ký" }
  },
  "createdAt": "2025-09-10T03:14:25.000Z",
  "updatedAt": "2026-02-05T10:30:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                          |
| ----------- | ---------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                  |
| 404         | `OKR not found` — không tìm thấy `UserOkr` với `id` truyền lên   |

---
