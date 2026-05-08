Đổi trạng thái của một **kỳ đánh giá hiệu suất** (`EvaluationCycle`). Dùng để **mở** một kỳ cho phép user nhập liệu (`OPEN`), **đóng** lại (`CLOSED`), hoặc **lưu trữ** (`ARCHIVED`). Đây là endpoint Admin Portal — về nghiệp vụ chỉ Admin được phép gọi. Response kèm flag `isPast` để frontend hiển thị cảnh báo nếu Admin đang mở lại một kỳ đã quá hạn `endDate`.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/performance/admin/cycles/:id/status`

### Headers

| Attribute     | Type   | Required | Description                                                                                                          |
| ------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| Authorization | String |          | Bearer token JWT, định dạng: `Bearer <accessToken>`. Không bắt buộc ở code hiện tại nhưng nên có khi production.     |
| Content-Type  | String | √        | `application/json`                                                                                                   |


### Path Params


| Attribute | Type          | Required | Description                                |
| --------- | ------------- | -------- | ------------------------------------------ |
| id        | String (UUID) | √        | ID của `EvaluationCycle` cần đổi trạng thái |


### Body


| Attribute | Type   | Required | Description                                                                                                                                                                                                                        |
| --------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| status    | String | √        | Trạng thái mới của kỳ. Giá trị hợp lệ (enum `EvaluationStatus`): `OPEN` (mở cho user nhập liệu), `CLOSED` (đóng, không cho nhập), `ARCHIVED` (lưu trữ). |


### Example Request

```http
PUT /performance/admin/cycles/c1a2b3c4-1111-2222-3333-444455556666/status HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "OPEN"
}
```

## HTTP Response

Trả về object gồm message, bản ghi `EvaluationCycle` sau khi cập nhật, và flag `isPast` cho biết kỳ đã quá hạn `endDate` hay chưa (so với hôm nay, theo mốc `00:00:00`).


| Attribute       | Type             | Required | Description                                                                                                                                                       |
| --------------- | ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| message         | String           | √        | Luôn là `"Cập nhật thành công"` khi 200 OK                                                                                                                        |
| cycle           | EvaluationCycle  | √        | Bản ghi kỳ đánh giá sau khi đổi trạng thái                                                                                                                        |
| cycle.id        | String (UUID)    | √        | ID kỳ                                                                                                                                                             |
| cycle.name      | String           | √        | Tên kỳ                                                                                                                                                            |
| cycle.status    | Enum             | √        | Trạng thái mới: `OPEN` / `CLOSED` / `ARCHIVED`                                                                                                                    |
| cycle.type      | Enum             | √        | `SEMESTER` / `QUARTER` / `OTHER`                                                                                                                                  |
| cycle.startDate | Date (ISO)       |          | Ngày bắt đầu kỳ                                                                                                                                                   |
| cycle.endDate   | Date (ISO)       |          | Ngày kết thúc kỳ                                                                                                                                                  |
| cycle.createdAt | Date (ISO)       | √        | Thời điểm tạo bản ghi                                                                                                                                             |
| cycle.updatedAt | Date (ISO)       | √        | Thời điểm cập nhật mới nhất (sau khi đổi status)                                                                                                                  |
| isPast          | Boolean / null   | √        | `true` nếu `endDate < hôm nay` (kỳ đã quá hạn), `false` nếu chưa quá hạn, `null` khi `endDate` rỗng. Frontend dùng để cảnh báo khi Admin mở lại một kỳ đã quá hạn. |


### Example Response (200 OK)

```json
{
  "message": "Cập nhật thành công",
  "cycle": {
    "id": "c1a2b3c4-1111-2222-3333-444455556666",
    "name": "Học kỳ 1 - 2025-2026",
    "status": "OPEN",
    "type": "SEMESTER",
    "startDate": "2025-09-01",
    "endDate": "2026-01-31",
    "createdAt": "2025-08-20T03:14:25.000Z",
    "updatedAt": "2026-05-08T13:11:00.000Z"
  },
  "isPast": false
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy kỳ đánh giá với `id` truyền vào → `Không tìm thấy kỳ đánh giá`                                                                |
| 400         | Body thiếu hoặc sai định dạng trường `status`                                                                                                 |
| 500         | `status` không thuộc enum `EvaluationStatus` (`OPEN` / `CLOSED` / `ARCHIVED`) → TypeORM/Postgres từ chối khi `save()`                        |

---
