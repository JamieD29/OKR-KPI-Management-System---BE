**Cấp quản lý xếp loại** một Phiếu Đánh Giá (PHẦN IV — nhận xét + xếp loại của quản lý). Service ghi `managerComment`, `managerRating` và chuyển `status = 'EVALUATED'`. Đây là bước cuối trong workflow đánh giá của một học kỳ.

> ℹ️ **Liên kết với auto-sync:** Sau khi `status = 'EVALUATED'`, hàm `syncEvaluationFromOkr` sẽ KHÔNG ghi đè điểm `evaluationData`/`selfScoreTotal`/`principalScoreTotal` nữa (chỉ sync khi phiếu chưa `EVALUATED`).

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/evaluations/:id/review`

### Path Params


| Attribute | Type          | Required | Description                       |
| --------- | ------------- | -------- | --------------------------------- |
| id        | String (UUID) | √        | ID của `UserEvaluation` cần review |


### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |


### Body


| Attribute      | Type   | Required | Description                                                                                                                |
| -------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| managerComment | String | √        | Nhận xét của quản lý (text dài).                                                                                           |
| managerRating  | String | √        | Xếp loại của quản lý. Giá trị: `EXCELLENT` \| `GOOD` \| `POOR`. Lưu trữ tối đa 50 ký tự.                                   |


### Example Request

```http
PUT /okrs/evaluations/ev111111-aaaa-bbbb-cccc-dddddddddddd/review HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "managerComment": "Hoàn thành tốt nhiệm vụ giảng dạy. Cần đẩy mạnh nghiên cứu khoa học trong học kỳ tới.",
  "managerRating": "GOOD"
}
```

## HTTP Response

Trả về entity `UserEvaluation` sau khi cập nhật (KHÔNG load relation `user`).


| Attribute      | Type          | Required | Description                                              |
| -------------- | ------------- | -------- | -------------------------------------------------------- |
| id             | String (UUID) | √        | ID phiếu                                                 |
| status         | String        | √        | Sẽ là `EVALUATED`                                         |
| managerComment | String        | √        | Đúng giá trị FE gửi lên                                   |
| managerRating  | String        | √        | Đúng giá trị FE gửi lên                                   |
| ...            | ...           |          | Các field khác giữ nguyên (xem `GET /okrs/evaluations/my`) |


### Example Response (200 OK)

```json
{
  "id": "ev111111-aaaa-bbbb-cccc-dddddddddddd",
  "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "cycleId": null,
  "completionPercent": 0,
  "selfScoreTotal": 28,
  "principalScoreTotal": 26,
  "status": "EVALUATED",
  "evaluationData": [
    { "id": "A", "name": "Nhiệm vụ Giảng dạy", "maxScore": 35, "selfScore": 28, "principalScore": 26 }
  ],
  "selfComment": "Trong học kỳ này tôi đã hoàn thành...",
  "selfRating": "GOOD",
  "managerComment": "Hoàn thành tốt nhiệm vụ giảng dạy. Cần đẩy mạnh nghiên cứu khoa học trong học kỳ tới.",
  "managerRating": "GOOD",
  "createdAt": "2026-02-05T10:30:00.000Z",
  "updatedAt": "2026-02-15T14:00:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                       |
| ----------- | ----------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                |
| 404         | `Evaluation form not found` — không tìm thấy `UserEvaluation` với `id` truyền lên |

---
