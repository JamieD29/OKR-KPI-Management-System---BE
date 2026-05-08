User **tự khai kết quả** thực hiện OKR (số lượng, minh chứng) và submit. Service sẽ:

1. Verify OKR thuộc về user (`id` + `userId` từ JWT) và đang ở `status = 'ACCEPTED'` (chưa accept thì không cho submit).
2. Lưu `selfReportData` vào DB.
3. Tự **tính `totalScore`** dựa trên cây `keyResults` × `selfReportData` (xem công thức bên dưới).
4. Chuyển `status = 'SUBMITTED'`.

### Công thức tính điểm

Service đệ quy qua cây `keyResults` (3 cấp tối đa: Objective → KR → SubKR):

- Mỗi KR: `score = quantity × unitScore` (nếu `unitScore > 0`) hoặc `= quantity` (nếu `unitScore <= 0`). Cap bởi `kr.maxScore` (nếu có).
- Mỗi SubKR: tương tự, cap bởi `sub.maxScore`.
- Mỗi Objective: tổng điểm các KR/SubKR con, cap bởi `obj.maxScore`.
- `totalScore = Σ điểm các Objective`.

### Cách build key trong `selfReportData`

`selfReportData` là object phẳng key-value:

- KR cấp 2: key = `"<objId>-<krId>"` → `{ quantity: number, evidence?: string }`
- SubKR cấp 3: key = `"<objId>-<krId>-<subId>"` → `{ quantity: number, evidence?: string }`

`evidence` là field tự do (string mô tả minh chứng), được lưu nguyên văn vào DB.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/self-report`

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


| Attribute      | Type   | Required | Description                                                                                                  |
| -------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| selfReportData | Object | √        | Map phẳng key-value. Mỗi entry: key = `"<objId>-<krId>"` hoặc `"<objId>-<krId>-<subId>"`; value = `{ quantity: number, evidence?: string }`. |


### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/self-report HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "selfReportData": {
    "A-1": { "quantity": 18, "evidence": "Bảng tổng hợp giờ giảng do Phòng Đào tạo xác nhận" },
    "A-2": { "quantity": 1, "evidence": "Đường dẫn DOI bài báo" },
    "A-2-2.1": { "quantity": 1, "evidence": "Hợp đồng đề tài cấp trường" }
  }
}
```

## HTTP Response

Trả về `UserOkr` sau khi cập nhật. `totalScore` đã được tính sẵn; `status = 'SUBMITTED'`.


| Attribute      | Type          | Required | Description                                                            |
| -------------- | ------------- | -------- | ---------------------------------------------------------------------- |
| id             | String (UUID) | √        | ID UserOkr                                                             |
| status         | String        | √        | `SUBMITTED`                                                            |
| selfReportData | Object        | √        | Đúng object FE gửi lên                                                  |
| totalScore     | Float         | √        | Điểm tự khai do service tính (xem công thức trên)                       |
| ...            | ...           |          | Các field khác giữ nguyên (xem cấu trúc trong `GET /okrs/my`)           |


### Example Response (200 OK)

```json
{
  "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
  "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "objective": "OKR Giảng viên - Học kỳ 1",
  "keyResults": [
    {
      "id": "A",
      "title": "Nhiệm vụ Giảng dạy",
      "maxScore": 35,
      "items": [
        { "id": "1", "title": "Hoàn thành giờ chuẩn", "maxScore": 20, "unitScore": 1, "unit": "giờ" },
        { "id": "2", "title": "Bài báo Q1", "maxScore": 10, "unitScore": 5, "unit": "bài",
          "items": [
            { "id": "2.1", "title": "Đề tài cấp trường", "maxScore": 5, "unitScore": 5 }
          ]
        }
      ]
    }
  ],
  "totalScore": 28,
  "status": "SUBMITTED",
  "proposedChanges": null,
  "selfReportData": {
    "A-1": { "quantity": 18, "evidence": "Bảng tổng hợp giờ giảng do Phòng Đào tạo xác nhận" },
    "A-2": { "quantity": 1, "evidence": "Đường dẫn DOI bài báo" },
    "A-2-2.1": { "quantity": 1, "evidence": "Hợp đồng đề tài cấp trường" }
  },
  "managerReportData": null,
  "managerScore": null,
  "createdAt": "2025-09-10T03:14:25.000Z",
  "updatedAt": "2026-01-25T17:00:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| 400         | `OKR chưa được chấp nhận, không thể tự khai.` — gọi khi `status != 'ACCEPTED'` (vd vẫn ở `PENDING` / `NEGOTIATING`) |
| 401         | Thiếu / sai JWT                                                                                                      |
| 404         | `OKR not found` — không tìm thấy `UserOkr` có `id` thuộc về `userId` của requester                                 |

---
