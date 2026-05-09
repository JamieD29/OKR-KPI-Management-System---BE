Tạo mới một **OKR cấp Bộ môn / Khoa** (legacy `Objective` + `KeyResult[]`). Endpoint nhận trực tiếp shape của entity `Objective`, lưu kèm danh sách `keyResults` (cascade). Side-effect: chỉ insert DB, không gửi notification.

## HTTP Request

**Endpoint:** `POST {baseUrl}/okrs/department`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |


### Body


| Attribute    | Type             | Required | Description                                                                                                                            |
| ------------ | ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| title        | String           | √        | Tiêu đề Objective. VD: `"OKR Bộ môn CNPM Học kỳ 1 - 2025-2026"`                                                                        |
| type         | String           | √        | Phân loại OKR. Giá trị thực tế dùng cho endpoint này: `DEPARTMENT`. (Entity còn hỗ trợ `PERSONAL` nhưng `GET /okrs/department` chỉ lọc `DEPARTMENT`.) |
| cycleId      | String (UUID)    | √        | ID của `EvaluationCycle` (học kỳ) gắn vào OKR này                                                                                     |
| departmentId | String (UUID)    | √        | ID của Bộ môn / Khoa                                                                                                                   |
| keyResults   | Array\<KeyResult\>|         | Mảng KeyResult con. Mỗi phần tử: `{ title: string, target: number, current?: number, unit: string }`. Cascade insert tự động.        |


Service tự gán: `status = 'ON_TRACK'`, `progress = 0`. Field `userId` không dùng cho luồng `DEPARTMENT`.

### Example Request

```http
POST /okrs/department HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "OKR Bộ môn CNPM Học kỳ 1 - 2025-2026",
  "type": "DEPARTMENT",
  "cycleId": "c1111111-aaaa-bbbb-cccc-dddddddddddd",
  "departmentId": "d1f0c2e8-1111-2222-3333-444455556666",
  "keyResults": [
    { "title": "Hoàn thành 10 bài báo Q1", "target": 10, "current": 0, "unit": "bài" },
    { "title": "Đạt 95% tỷ lệ giảng dạy đúng tiến độ", "target": 95, "current": 0, "unit": "%" }
  ]
}
```

## HTTP Response

Trả về entity `Objective` vừa được lưu, kèm các `keyResults` đã được cascade insert (mỗi KR sẽ có `id` UUID do TypeORM sinh).


| Attribute    | Type             | Required | Description                                                          |
| ------------ | ---------------- | -------- | -------------------------------------------------------------------- |
| id           | String (UUID)    | √        | Mã định danh Objective                                               |
| title        | String           | √        | Tiêu đề                                                              |
| type         | String           | √        | `DEPARTMENT` hoặc `PERSONAL`                                         |
| cycleId      | String (UUID)    | √        | ID học kỳ                                                            |
| departmentId | String (UUID)    |          | ID bộ môn (null nếu OKR cá nhân)                                    |
| userId       | String (UUID)    |          | ID user (null nếu OKR bộ môn)                                       |
| progress     | Float            | √        | Tiến độ (0-100). Mặc định `0`                                       |
| status       | String           | √        | `ON_TRACK` \| `AT_RISK` \| `BEHIND`. Mặc định `ON_TRACK`             |
| keyResults   | Array\<KeyResult\>| √        | Danh sách KR đã insert. Mỗi phần tử có `id`, `title`, `target`, `current`, `unit` |
| createdAt    | Date (ISO)       | √        | Thời điểm tạo                                                        |


### Example Response (200 OK)

```json
{
  "id": "ob111111-aaaa-bbbb-cccc-dddddddddddd",
  "title": "OKR Bộ môn CNPM Học kỳ 1 - 2025-2026",
  "type": "DEPARTMENT",
  "cycleId": "c1111111-aaaa-bbbb-cccc-dddddddddddd",
  "departmentId": "d1f0c2e8-1111-2222-3333-444455556666",
  "userId": null,
  "progress": 0,
  "status": "ON_TRACK",
  "keyResults": [
    {
      "id": "kr111111-aaaa-bbbb-cccc-dddddddddddd",
      "title": "Hoàn thành 10 bài báo Q1",
      "target": 10,
      "current": 0,
      "unit": "bài"
    },
    {
      "id": "kr222222-aaaa-bbbb-cccc-dddddddddddd",
      "title": "Đạt 95% tỷ lệ giảng dạy đúng tiến độ",
      "target": 95,
      "current": 0,
      "unit": "%"
    }
  ],
  "createdAt": "2026-05-08T12:00:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                                                        |
| 500         | `Lỗi khi lưu OKR: <message>` — bất kỳ lỗi DB nào (FK `cycleId`/`departmentId` không tồn tại, vi phạm constraint, KR thiếu trường...). Service catch tất cả lỗi và bọc thành `InternalServerErrorException`. |

---
