Lấy danh sách **OKR cấp Bộ môn / Khoa** (entity `Objective` có `type = 'DEPARTMENT'`), kèm các `keyResults` con. Sắp xếp theo `createdAt` giảm dần.

## HTTP Request

**Endpoint:** `GET {baseUrl}/okrs/department`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có. Service hard-code filter `type = 'DEPARTMENT'`.

### Example Request

```http
GET /okrs/department HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng `Objective`, mỗi phần tử kèm relation `keyResults`. Có thể là mảng rỗng `[]`.


| Attribute | Type                | Required | Description                                                                |
| --------- | ------------------- | -------- | -------------------------------------------------------------------------- |
| (root)    | Array\<Objective\>  | √        | Danh sách OKR cấp bộ môn. Sắp xếp theo `createdAt DESC`                    |


Mỗi phần tử `Objective` có cấu trúc:

| Attribute    | Type              | Description                                                  |
| ------------ | ----------------- | ------------------------------------------------------------ |
| id           | String (UUID)     | Mã định danh Objective                                       |
| title        | String            | Tiêu đề                                                      |
| type         | String            | Luôn `DEPARTMENT` cho endpoint này                            |
| cycleId      | String (UUID)     | ID học kỳ                                                    |
| departmentId | String (UUID)     | ID bộ môn                                                    |
| userId       | String (UUID)     | Luôn `null` cho OKR bộ môn                                  |
| progress     | Float             | 0–100                                                        |
| status       | String            | `ON_TRACK` \| `AT_RISK` \| `BEHIND`                          |
| keyResults   | Array\<KeyResult\>| Danh sách KR. Mỗi KR có `id`, `title`, `target`, `current`, `unit` |
| createdAt    | Date (ISO)        | Thời điểm tạo                                                |


### Example Response (200 OK)

```json
[
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
      }
    ],
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
