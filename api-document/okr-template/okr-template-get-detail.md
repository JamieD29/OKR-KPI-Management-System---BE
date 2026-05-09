Lấy chi tiết một Template OKR theo ID, kèm toàn bộ cây cấu trúc (`structure`) phân cấp.

## HTTP Request

**Endpoint:** `GET {baseUrl}/okr-templates/:id`

### Path Params


| Attribute | Type          | Required | Description           |
| --------- | ------------- | -------- | --------------------- |
| id        | String (UUID) | √        | ID của template       |


### Headers


| Attribute     | Type   | Required | Description                                                                  |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| Authorization | String |          | (Optional) Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có.

### Example Request

```http
GET /okr-templates/t1111111-aaaa-bbbb-cccc-dddddddddddd HTTP/1.1
Host: api.example.com
```

## HTTP Response

Trả về object `OkrTemplate` đầy đủ.


| Attribute        | Type            | Required | Description                                                                                                                                                       |
| ---------------- | --------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id               | String (UUID)   | √        | Mã định danh template                                                                                                                                             |
| title            | String          | √        | Tên template                                                                                                                                                       |
| departmentId     | String (UUID)   |          | Department template thuộc về (nullable)                                                                                                                            |
| positionId       | String (UUID)   |          | `ManagementPosition` template áp dụng (nullable)                                                                                                                   |
| jobTitle         | Enum            |          | Chức danh nghề nghiệp template áp dụng. Giá trị: `Giảng viên`, `Giảng viên chính`, `Chuyên viên`, `Nghiên cứu viên`, `Trợ giảng`, `Giáo vụ`, `Kỹ thuật viên`, `Nhân viên hỗ trợ` |
| positionName     | String          |          | Tên chức vụ hiển thị (snapshot)                                                                                                                                    |
| createdByUserId  | String (UUID)   |          | ID người tạo                                                                                                                                                       |
| createdByName    | String          |          | Tên người tạo (snapshot)                                                                                                                                            |
| structure        | Array\<Object\> | √        | Cây cấu trúc phân cấp (Objective → KeyResult → con). Mỗi node: `id`, `type`, `title`, `maxScore`, `unitScore`, `unit`, `items[]`. Tổng `maxScore` ở cấp gốc = 100. |
| createdAt        | Date (ISO)      | √        | Thời điểm tạo                                                                                                                                                      |
| updatedAt        | Date (ISO)      | √        | Thời điểm cập nhật mới nhất                                                                                                                                        |


### Example Response (200 OK)

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
        {
          "id": "kr-A1",
          "type": "key-result",
          "title": "1. Hoàn thành giờ giảng tiêu chuẩn",
          "maxScore": 40,
          "unitScore": 1,
          "unit": "giờ",
          "items": [
            {
              "id": "kr-A1-1",
              "type": "key-result",
              "title": "1.1 Giảng viên cơ hữu",
              "maxScore": 20,
              "unitScore": 1,
              "unit": "giờ",
              "items": []
            }
          ]
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
  ],
  "createdAt": "2026-04-30T08:42:11.000Z",
  "updatedAt": "2026-04-30T08:42:11.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                              |
| ----------- | -------------------------------------------------------------------- |
| 404         | Không tìm thấy template (`Template with ID ... not found`)            |
| 500         | `id` không phải UUID hợp lệ → Postgres parse lỗi                      |

---
