Tạo mới một **kỳ đánh giá hiệu suất** (`EvaluationCycle`). Đây là endpoint dành cho Admin Portal — về mặt nghiệp vụ chỉ Admin được phép gọi. Khi tạo, kỳ mặc định ở trạng thái `CLOSED` và phải được mở thủ công sau bằng API `PUT /performance/admin/cycles/:id/status`.

## HTTP Request

**Endpoint:** `POST {baseUrl}/performance/admin/cycles`

### Headers

| Attribute     | Type   | Required | Description                                                                                                          |
| ------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| Authorization | String |          | Bearer token JWT, định dạng: `Bearer <accessToken>`. Không bắt buộc ở code hiện tại nhưng nên có khi production.     |
| Content-Type  | String | √        | `application/json`                                                                                                   |


### Path Params

Không có.

### Body


| Attribute | Type       | Required | Description                                                                                                                                                                                                                  |
| --------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name      | String     | √        | Tên kỳ đánh giá. VD: `"Học kỳ 1 - 2025-2026"`, `"Quý 2 - 2025"`                                                                                                                                                              |
| type      | String     | √        | Loại chu kỳ. Giá trị hợp lệ (enum `CycleType`): `SEMESTER`, `QUARTER`, `OTHER`. Nếu truyền giá trị khác / rỗng, service ép về `OTHER` (xem `(type as CycleType) \|\| CycleType.OTHER`).                                      |
| startDate | String (ISO) | √      | Ngày bắt đầu kỳ. Chuỗi parse được bằng `new Date(...)` (vd `YYYY-MM-DD` hoặc ISO datetime). **Bắt buộc `>= ngày hôm nay`** — nếu ở quá khứ sẽ trả 400.                                                                       |
| endDate   | String (ISO) | √      | Ngày kết thúc kỳ. Chuỗi parse được bằng `new Date(...)`. **Bắt buộc `> startDate`** — nếu nhỏ hơn hoặc bằng `startDate` sẽ trả 400.                                                                                          |


> Lưu ý: Validation ở service: `startDate >= today` và `endDate > startDate`. Trường `status` không nhận từ client — luôn được set mặc định `CLOSED` khi tạo.

### Example Request

```http
POST /performance/admin/cycles HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Học kỳ 1 - 2025-2026",
  "type": "SEMESTER",
  "startDate": "2025-09-01",
  "endDate": "2026-01-31"
}
```

## HTTP Response

Trả về bản ghi `EvaluationCycle` vừa tạo. `status` luôn là `CLOSED` ngay sau khi tạo — Admin phải gọi `PUT /performance/admin/cycles/:id/status` để mở.


| Attribute | Type          | Required | Description                                                                                  |
| --------- | ------------- | -------- | -------------------------------------------------------------------------------------------- |
| id        | String (UUID) | √        | Mã định danh kỳ vừa tạo                                                                      |
| name      | String        | √        | Tên kỳ                                                                                       |
| status    | Enum          | √        | Trạng thái kỳ — luôn `CLOSED` ngay sau khi tạo                                              |
| type      | Enum          | √        | Loại chu kỳ. `SEMESTER` / `QUARTER` / `OTHER`                                                |
| startDate | Date (ISO)    | √        | Ngày bắt đầu kỳ                                                                              |
| endDate   | Date (ISO)    | √        | Ngày kết thúc kỳ                                                                             |
| createdAt | Date (ISO)    | √        | Thời điểm tạo                                                                                |
| updatedAt | Date (ISO)    | √        | Thời điểm cập nhật mới nhất                                                                  |


### Example Response (200 OK)

```json
{
  "id": "c1a2b3c4-1111-2222-3333-444455556666",
  "name": "Học kỳ 1 - 2025-2026",
  "status": "CLOSED",
  "type": "SEMESTER",
  "startDate": "2025-09-01",
  "endDate": "2026-01-31",
  "createdAt": "2025-08-20T03:14:25.000Z",
  "updatedAt": "2025-08-20T03:14:25.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 400         | `startDate` ở quá khứ → `Không thể tạo kỳ đánh giá với ngày bắt đầu ở quá khứ. Vui lòng chọn ngày bắt đầu từ hôm nay trở đi.`         |
| 400         | `endDate <= startDate` → `Ngày kết thúc phải sau ngày bắt đầu.`                                                                       |
| 400         | Body sai format (vd `startDate`/`endDate` không parse được thành `Date`) → `new Date(...)` ra `Invalid Date`, có thể gây lỗi DB        |
| 500         | Lỗi DB / TypeORM khi `save()` (vd `name` rỗng, vi phạm constraint cột)                                                                 |

---
