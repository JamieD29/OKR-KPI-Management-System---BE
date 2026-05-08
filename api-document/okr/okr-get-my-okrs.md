Lấy danh sách **OKR cá nhân** (`UserOkr`) của người dùng đang đăng nhập, kèm relation `cycle` (học kỳ). Sắp xếp `createdAt` giảm dần. Endpoint suy `userId` từ JWT (`req.user.id || req.user.sub`).

## HTTP Request

**Endpoint:** `GET {baseUrl}/okrs/my`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có. Endpoint suy `userId` từ JWT.

### Example Request

```http
GET /okrs/my HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về mảng `UserOkr` của user (chỉ những OKR mà `userId` trùng với JWT subject), kèm relation `cycle`.


| Attribute | Type              | Required | Description                                                |
| --------- | ----------------- | -------- | ---------------------------------------------------------- |
| (root)    | Array\<UserOkr\>  | √        | Danh sách OKR cá nhân, sắp xếp theo `createdAt DESC`       |


Mỗi phần tử `UserOkr` gồm:

| Attribute         | Type             | Description                                                                                                                                                  |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id                | String (UUID)    | Mã định danh UserOkr                                                                                                                                         |
| userId            | String (UUID)    | ID user sở hữu (trùng với JWT subject)                                                                                                                       |
| cycleId           | String (UUID)    | ID học kỳ gắn vào                                                                                                                                            |
| cycle             | Object           | Thông tin học kỳ: `id`, `name`, `status`, `type`, `startDate`, `endDate`, ...                                                                               |
| objective         | String           | Tên Objective. VD: `"OKR Giảng viên - Học kỳ 1"`                                                                                                            |
| keyResults        | Array\<Object\>  | Cấu trúc OKR phân cấp (clone từ `OkrTemplate.structure`). Mỗi item có: `id`, `type`, `title`, `maxScore`, `unitScore`, `unit`, `items[]` (đệ quy con A→1→1.1) |
| totalScore        | Float            | Điểm tổng tự khai (0 mặc định, được tính khi user submit self-report)                                                                                        |
| templateId        | String (UUID)    | ID `OkrTemplate` đã giao cho user (nếu có)                                                                                                                  |
| status            | String           | `PENDING` \| `NEGOTIATING` \| `ACCEPTED` \| `REJECTED` \| `SUBMITTED` \| `COMPLETED`. Mặc định `PENDING`                                                    |
| proposedChanges   | Object \| null   | Lịch sử chat thương lượng từng item. Format: `{ [itemId]: [{ sender, message, createdAt }] }`                                                                |
| deadline          | Date (ISO)       | Hạn chót OKR (nullable)                                                                                                                                      |
| selfReportData    | Object \| null   | Dữ liệu user tự khai. Format: `{ [`${objId}-${krId}`]: { quantity, evidence }, [`${objId}-${krId}-${subId}`]: {...} }`                                       |
| managerReportData | Object \| null   | Dữ liệu manager chấm lại (cùng format `selfReportData`)                                                                                                      |
| managerScore      | Float \| null    | Điểm tổng do manager chốt                                                                                                                                    |
| createdAt         | Date (ISO)       | Thời điểm tạo                                                                                                                                                |
| updatedAt         | Date (ISO)       | Thời điểm cập nhật mới nhất                                                                                                                                  |


### Example Response (200 OK)

```json
[
  {
    "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
    "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "cycleId": "c1111111-aaaa-bbbb-cccc-dddddddddddd",
    "cycle": {
      "id": "c1111111-aaaa-bbbb-cccc-dddddddddddd",
      "name": "Học kỳ 1 - 2025-2026",
      "status": "OPEN",
      "type": "SEMESTER",
      "startDate": "2025-09-01",
      "endDate": "2026-01-31"
    },
    "objective": "OKR Giảng viên - Học kỳ 1",
    "keyResults": [
      {
        "id": "A",
        "type": "objective",
        "title": "Nhiệm vụ Giảng dạy",
        "maxScore": 35,
        "items": [
          {
            "id": "1",
            "type": "kr",
            "title": "Hoàn thành giờ chuẩn",
            "maxScore": 20,
            "unitScore": 1,
            "unit": "giờ",
            "items": []
          }
        ]
      }
    ],
    "totalScore": 0,
    "templateId": "tp111111-aaaa-bbbb-cccc-dddddddddddd",
    "status": "PENDING",
    "proposedChanges": null,
    "deadline": null,
    "selfReportData": null,
    "managerReportData": null,
    "managerScore": null,
    "createdAt": "2025-09-10T03:14:25.000Z",
    "updatedAt": "2025-09-10T03:14:25.000Z"
  }
]
```

### Error Responses


| HTTP Status | Khi nào         |
| ----------- | --------------- |
| 401         | Thiếu / sai JWT |

---
