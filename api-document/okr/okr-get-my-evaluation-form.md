Lấy **Phiếu Đánh Giá** (`UserEvaluation`) của người dùng đang đăng nhập (`userId` lấy từ JWT). Endpoint **upsert**:

- Nếu user chưa có phiếu nào → tạo mới với `status = 'PENDING_EVALUATION'` và clone điểm từ OKR phù hợp nhất.
- Nếu đã có phiếu → luôn refresh `evaluationData`, `selfScoreTotal`, `principalScoreTotal` từ OKR mới nhất.

Cách chọn OKR để clone điểm (`findBestUserOkr`): ưu tiên `COMPLETED` > `SUBMITTED` > bất kỳ OKR nào của user, lấy bản `updatedAt` mới nhất.

Payload trả về có thêm 2 field thuần view: `okrObjectiveName`, `okrStatus` (lấy từ OKR vừa clone).

## HTTP Request

**Endpoint:** `GET {baseUrl}/okrs/evaluations/my`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có. Endpoint suy `userId` từ `req.user.id`.

### Example Request

```http
GET /okrs/evaluations/my HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về entity `UserEvaluation` của user (đã upsert) kèm `user`, `user.department`, `user.managementPosition`, cộng thêm 2 field view.


| Attribute            | Type          | Required | Description                                                                                                            |
| -------------------- | ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| id                   | String (UUID) | √        | ID phiếu đánh giá                                                                                                       |
| userId               | String (UUID) | √        | ID user sở hữu phiếu                                                                                                    |
| cycleId              | String (UUID) |          | ID học kỳ (nullable)                                                                                                    |
| completionPercent    | Float         | √        | % hoàn thành OKR (default `0`, chưa được service ghi vào endpoint này)                                                  |
| selfScoreTotal       | Float         | √        | Tổng điểm tự đánh giá — là tổng điểm các Objective do user tự khai, được clone lại từ `UserOkr.selfReportData`         |
| principalScoreTotal  | Float         | √        | Tổng điểm quản lý đánh giá — clone từ `UserOkr.managerReportData`. `0` nếu OKR chưa COMPLETED                          |
| status               | String        | √        | `PENDING_EVALUATION` \| `SUBMITTED` \| `EVALUATED`                                                                     |
| evaluationData       | Array         | √        | Mảng điểm theo từng Objective. Mỗi phần tử: `{ id, name, maxScore, selfScore, principalScore }`                         |
| selfComment          | String        |          | Tự nhận xét (PHẦN III) — null nếu chưa nhập                                                                            |
| selfRating           | String        |          | Tự xếp loại: `EXCELLENT` \| `GOOD` \| `POOR`                                                                            |
| managerComment       | String        |          | Nhận xét cấp quản lý (PHẦN IV)                                                                                          |
| managerRating        | String        |          | Xếp loại cấp quản lý: `EXCELLENT` \| `GOOD` \| `POOR`                                                                  |
| user                 | Object        |          | Thông tin user kèm `department`, `managementPosition`                                                                   |
| createdAt            | Date (ISO)    | √        | Thời điểm tạo phiếu                                                                                                     |
| updatedAt            | Date (ISO)    | √        | Thời điểm cập nhật mới nhất                                                                                             |
| okrObjectiveName     | String        | √        | Tên Objective của OKR vừa clone (vd `"OKR Giảng viên - Học kỳ 1"`). `""` nếu user chưa có OKR nào                       |
| okrStatus            | String \| null| √        | Trạng thái OKR vừa clone (`PENDING` / `ACCEPTED` / `SUBMITTED` / `COMPLETED`). `null` nếu user chưa có OKR              |


### Example Response (200 OK)

```json
{
  "id": "ev111111-aaaa-bbbb-cccc-dddddddddddd",
  "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "cycleId": null,
  "completionPercent": 0,
  "selfScoreTotal": 28,
  "principalScoreTotal": 26,
  "status": "PENDING_EVALUATION",
  "evaluationData": [
    {
      "id": "A",
      "name": "Nhiệm vụ Giảng dạy",
      "maxScore": 35,
      "selfScore": 28,
      "principalScore": 26
    }
  ],
  "selfComment": null,
  "selfRating": null,
  "managerComment": null,
  "managerRating": null,
  "user": {
    "id": "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "email": "lecturer@example.edu.vn",
    "name": "Nguyễn Văn A",
    "staffCode": "GV001",
    "jobTitle": "Giảng viên",
    "department": {
      "id": "d1f0c2e8-1111-2222-3333-444455556666",
      "name": "Bộ môn Công nghệ Phần mềm",
      "code": "CNPM"
    },
    "managementPosition": null
  },
  "createdAt": "2026-02-05T10:30:00.000Z",
  "updatedAt": "2026-02-05T10:30:00.000Z",
  "okrObjectiveName": "OKR Giảng viên - Học kỳ 1",
  "okrStatus": "COMPLETED"
}
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
