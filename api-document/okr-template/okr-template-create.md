Tạo mới một Template OKR. Service sẽ validate `structure`: nếu có truyền, **tổng `maxScore` của các Nhiệm vụ ở cấp gốc bắt buộc bằng 100**, nếu không sẽ trả về 400.

## HTTP Request

**Endpoint:** `POST {baseUrl}/okr-templates`

### Headers


| Attribute     | Type   | Required | Description                                                                  |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| Authorization | String |          | (Optional) Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                                           |


### Body

Body được truyền thẳng vào `okrTemplateRepository.create(...)`, do đó các field hợp lệ chính là các cột của entity `OkrTemplate`. Field bắt buộc về mặt schema chỉ có `title` (NOT NULL), các field còn lại đều nullable. Tuy nhiên tổng `maxScore` ở cấp gốc của `structure` phải = 100 nếu có truyền.


| Attribute        | Type            | Required | Description                                                                                                                                                       |
| ---------------- | --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title            | String          | √        | Tên template (varchar 255)                                                                                                                                         |
| departmentId     | String (UUID)   |          | ID department template áp dụng                                                                                                                                     |
| positionId       | String (UUID)   |          | ID `ManagementPosition` template áp dụng                                                                                                                            |
| positionName     | String          |          | Tên chức vụ hiển thị (snapshot, vd: "Phó khoa")                                                                                                                    |
| jobTitle         | Enum            |          | Chức danh nghề nghiệp. Giá trị: `Giảng viên`, `Giảng viên chính`, `Chuyên viên`, `Nghiên cứu viên`, `Trợ giảng`, `Giáo vụ`, `Kỹ thuật viên`, `Nhân viên hỗ trợ`    |
| createdByUserId  | String (UUID)   |          | ID user tạo template (frontend gửi lên)                                                                                                                              |
| createdByName    | String          |          | Tên user tạo (snapshot)                                                                                                                                             |
| structure        | Array\<Object\> |          | Cây phân cấp Objective / KeyResult dạng JSON. Mỗi node: `id`, `type` (`objective` \| `key-result`), `title`, `maxScore`, `unitScore`, `unit`, `items[]`. **Tổng `maxScore` ở cấp gốc = 100** nếu có truyền. Mặc định `[]`. |


### Example Request

```http
POST /okr-templates HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "title": "Template OKR Giảng viên 2026",
  "departmentId": "d1f0c2e8-1111-2222-3333-444455556666",
  "jobTitle": "Giảng viên",
  "createdByUserId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "createdByName": "Nguyễn Văn A",
  "structure": [
    {
      "id": "obj-A",
      "type": "objective",
      "title": "A. Hoạt động giảng dạy",
      "maxScore": 60,
      "items": [
        {
          "id": "kr-A1",
          "type": "key-result",
          "title": "1. Hoàn thành giờ giảng",
          "maxScore": 40,
          "unitScore": 1,
          "unit": "giờ",
          "items": []
        },
        {
          "id": "kr-A2",
          "type": "key-result",
          "title": "2. Đánh giá sinh viên",
          "maxScore": 20,
          "unitScore": 5,
          "unit": "điểm",
          "items": []
        }
      ]
    },
    {
      "id": "obj-B",
      "type": "objective",
      "title": "B. Nghiên cứu khoa học",
      "maxScore": 40,
      "items": []
    }
  ]
}
```

## HTTP Response

Trả về object `OkrTemplate` vừa tạo, kèm `id`, `createdAt`, `updatedAt` do DB sinh.


| Attribute        | Type            | Required | Description                                       |
| ---------------- | --------------- | -------- | ------------------------------------------------- |
| id               | String (UUID)   | √        | ID template vừa tạo                                |
| title            | String          | √        | Tên template                                       |
| departmentId     | String (UUID)   |          | Department áp dụng                                 |
| positionId       | String (UUID)   |          | ManagementPosition áp dụng                         |
| jobTitle         | Enum            |          | Chức danh nghề nghiệp                              |
| positionName     | String          |          | Tên chức vụ hiển thị                                |
| createdByUserId  | String (UUID)   |          | Người tạo                                          |
| createdByName    | String          |          | Tên người tạo                                       |
| structure        | Array\<Object\> | √        | Cây cấu trúc đã được lưu                           |
| createdAt        | Date (ISO)      | √        | Thời điểm tạo                                      |
| updatedAt        | Date (ISO)      | √        | Thời điểm cập nhật                                 |


### Example Response (201 Created)

```json
{
  "id": "t1111111-aaaa-bbbb-cccc-dddddddddddd",
  "title": "Template OKR Giảng viên 2026",
  "departmentId": "d1f0c2e8-1111-2222-3333-444455556666",
  "positionId": null,
  "jobTitle": "Giảng viên",
  "positionName": null,
  "createdByUserId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "createdByName": "Nguyễn Văn A",
  "structure": [
    {
      "id": "obj-A",
      "type": "objective",
      "title": "A. Hoạt động giảng dạy",
      "maxScore": 60,
      "items": [
        { "id": "kr-A1", "type": "key-result", "title": "1. Hoàn thành giờ giảng", "maxScore": 40, "unitScore": 1, "unit": "giờ", "items": [] },
        { "id": "kr-A2", "type": "key-result", "title": "2. Đánh giá sinh viên", "maxScore": 20, "unitScore": 5, "unit": "điểm", "items": [] }
      ]
    },
    { "id": "obj-B", "type": "objective", "title": "B. Nghiên cứu khoa học", "maxScore": 40, "items": [] }
  ],
  "createdAt": "2026-05-08T13:10:00.000Z",
  "updatedAt": "2026-05-08T13:10:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 400         | `structure` có truyền nhưng tổng `maxScore` ở cấp gốc khác 100 → `Tổng điểm (maxScore) của tất cả các Nhiệm vụ phải chính xác bằng 100. Hiện tại đang là <X>.` |
| 500         | `title` không truyền (vi phạm NOT NULL ở DB) hoặc kiểu dữ liệu trong `structure` không phải JSON hợp lệ                         |

---
