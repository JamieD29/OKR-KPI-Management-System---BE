User **submit Phiếu Đánh Giá** sau khi điền tự nhận xét và tự xếp loại (PHẦN III). Service:

1. Đảm bảo phiếu của user đã tồn tại — nếu chưa, gọi `getMyEvaluationForm(userId)` để upsert (tự tạo phiếu mới với điểm clone từ OKR).
2. Ghi `selfComment`, `selfRating` từ body vào entity.
3. Chuyển `status = 'SUBMITTED'`.

Endpoint chỉ cập nhật phần "Tự nhận xét" — điểm `evaluationData`, `selfScoreTotal`, `principalScoreTotal` được sync tự động từ OKR (ở `getMyEvaluationForm` và trigger `syncEvaluationFromOkr` khi manager review OKR). FE **không** cần gửi điểm lên endpoint này.

## HTTP Request

**Endpoint:** `POST {baseUrl}/okrs/evaluations/my/submit`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |


### Body


| Attribute   | Type   | Required | Description                                                                                                              |
| ----------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| selfComment | String | √        | Tự nhận xét quá trình thực hiện OKR (text dài).                                                                          |
| selfRating  | String | √        | Tự xếp loại. Giá trị: `EXCELLENT` \| `GOOD` \| `POOR`. Lưu trữ tối đa 50 ký tự.                                          |


### Example Request

```http
POST /okrs/evaluations/my/submit HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "selfComment": "Trong học kỳ này tôi đã hoàn thành đủ giờ chuẩn, tham gia 2 đề tài cấp trường và xuất bản 1 bài báo Q1...",
  "selfRating": "GOOD"
}
```

## HTTP Response

Trả về entity `UserEvaluation` (KHÔNG bao gồm các field view `okrObjectiveName`, `okrStatus`, KHÔNG load relation `user`) — đây là object trả về từ `userEvaluationRepo.save(entity)`.


| Attribute            | Type          | Required | Description                                                            |
| -------------------- | ------------- | -------- | ---------------------------------------------------------------------- |
| id                   | String (UUID) | √        | ID phiếu                                                               |
| userId               | String (UUID) | √        | ID user                                                                |
| cycleId              | String (UUID) |          | ID học kỳ (nullable)                                                   |
| status               | String        | √        | Sẽ là `SUBMITTED`                                                       |
| selfComment          | String        | √        | Đúng giá trị FE gửi lên                                                 |
| selfRating           | String        | √        | Đúng giá trị FE gửi lên                                                 |
| evaluationData       | Array         | √        | Cấu trúc giống `GET /okrs/evaluations/my`                               |
| selfScoreTotal       | Float         | √        | Tổng điểm tự khai (clone từ OKR)                                       |
| principalScoreTotal  | Float         | √        | Tổng điểm manager (clone từ OKR; `0` nếu OKR chưa COMPLETED)            |
| managerComment       | String        |          | Vẫn null cho tới khi quản lý review                                     |
| managerRating        | String        |          | Vẫn null cho tới khi quản lý review                                     |
| createdAt            | Date (ISO)    | √        | Thời điểm tạo                                                           |
| updatedAt            | Date (ISO)    | √        | Thời điểm cập nhật mới nhất                                             |


### Example Response (200 OK)

```json
{
  "id": "ev111111-aaaa-bbbb-cccc-dddddddddddd",
  "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "cycleId": null,
  "completionPercent": 0,
  "selfScoreTotal": 28,
  "principalScoreTotal": 26,
  "status": "SUBMITTED",
  "evaluationData": [
    {
      "id": "A",
      "name": "Nhiệm vụ Giảng dạy",
      "maxScore": 35,
      "selfScore": 28,
      "principalScore": 26
    }
  ],
  "selfComment": "Trong học kỳ này tôi đã hoàn thành đủ giờ chuẩn, tham gia 2 đề tài cấp trường và xuất bản 1 bài báo Q1...",
  "selfRating": "GOOD",
  "managerComment": null,
  "managerRating": null,
  "createdAt": "2026-02-05T10:30:00.000Z",
  "updatedAt": "2026-02-10T09:00:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                                |
| 404         | `Evaluation Form not found` — về lý thuyết không xảy ra (vì service tự upsert), nhưng có thể bắn nếu race condition giữa hai hàm `getMyEvaluationForm` & `userEvaluationRepo.findOne` (entity bị xóa giữa chừng). |

---
