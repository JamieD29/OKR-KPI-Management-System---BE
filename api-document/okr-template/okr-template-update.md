Cập nhật một Template OKR. Hỗ trợ partial update — chỉ field được gửi lên mới bị thay đổi (service dùng `Object.assign(existing, updateDto)` rồi `save`). Nếu body có truyền `structure`, hệ thống vẫn validate tổng `maxScore` ở cấp gốc phải bằng 100.

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okr-templates/:id`

### Path Params


| Attribute | Type          | Required | Description           |
| --------- | ------------- | -------- | --------------------- |
| id        | String (UUID) | √        | ID template cần update |


### Headers


| Attribute     | Type   | Required | Description                                                                  |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| Authorization | String |          | (Optional) Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                                           |


### Body

Tất cả field đều optional (partial update). Các field hợp lệ chính là cột của entity `OkrTemplate`:


| Attribute        | Type            | Required | Description                                                                                                                                                           |
| ---------------- | --------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title            | String          |          | Tên template (varchar 255)                                                                                                                                             |
| departmentId     | String (UUID)   |          | ID department template áp dụng                                                                                                                                         |
| positionId       | String (UUID)   |          | ID `ManagementPosition`                                                                                                                                                 |
| positionName     | String          |          | Tên chức vụ hiển thị (snapshot)                                                                                                                                         |
| jobTitle         | Enum            |          | Chức danh nghề nghiệp. Giá trị: `Giảng viên`, `Giảng viên chính`, `Chuyên viên`, `Nghiên cứu viên`, `Trợ giảng`, `Giáo vụ`, `Kỹ thuật viên`, `Nhân viên hỗ trợ`         |
| createdByUserId  | String (UUID)   |          | ID người tạo (thường không nên đổi sau khi tạo)                                                                                                                          |
| createdByName    | String          |          | Tên người tạo (snapshot)                                                                                                                                                |
| structure        | Array\<Object\> |          | Cây phân cấp mới. Nếu truyền, **tổng `maxScore` ở cấp gốc phải = 100**, nếu không sẽ trả 400.                                                                              |


### Example Request

```http
PUT /okr-templates/t1111111-aaaa-bbbb-cccc-dddddddddddd HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "title": "Template OKR Giảng viên 2026 (v2)",
  "structure": [
    {
      "id": "obj-A",
      "type": "objective",
      "title": "A. Giảng dạy",
      "maxScore": 50,
      "items": []
    },
    {
      "id": "obj-B",
      "type": "objective",
      "title": "B. Nghiên cứu",
      "maxScore": 30,
      "items": []
    },
    {
      "id": "obj-C",
      "type": "objective",
      "title": "C. Phục vụ cộng đồng",
      "maxScore": 20,
      "items": []
    }
  ]
}
```

## HTTP Response

Trả về object `OkrTemplate` sau khi cập nhật (đầy đủ field giống response của `GET /okr-templates/:id`).


| Attribute        | Type            | Required | Description                          |
| ---------------- | --------------- | -------- | ------------------------------------ |
| id               | String (UUID)   | √        | ID template                          |
| title            | String          | √        | Tên template (sau khi update)         |
| departmentId     | String (UUID)   |          | Department áp dụng                    |
| positionId       | String (UUID)   |          | ManagementPosition áp dụng            |
| jobTitle         | Enum            |          | Chức danh nghề nghiệp                 |
| positionName     | String          |          | Tên chức vụ hiển thị                   |
| createdByUserId  | String (UUID)   |          | Người tạo                             |
| createdByName    | String          |          | Tên người tạo                          |
| structure        | Array\<Object\> | √        | Cây cấu trúc mới                       |
| createdAt        | Date (ISO)      | √        | Thời điểm tạo (giữ nguyên)            |
| updatedAt        | Date (ISO)      | √        | Thời điểm cập nhật mới nhất            |


### Example Response (200 OK)

```json
{
  "id": "t1111111-aaaa-bbbb-cccc-dddddddddddd",
  "title": "Template OKR Giảng viên 2026 (v2)",
  "departmentId": "d1f0c2e8-1111-2222-3333-444455556666",
  "positionId": null,
  "jobTitle": "Giảng viên",
  "positionName": null,
  "createdByUserId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "createdByName": "Nguyễn Văn A",
  "structure": [
    { "id": "obj-A", "type": "objective", "title": "A. Giảng dạy", "maxScore": 50, "items": [] },
    { "id": "obj-B", "type": "objective", "title": "B. Nghiên cứu", "maxScore": 30, "items": [] },
    { "id": "obj-C", "type": "objective", "title": "C. Phục vụ cộng đồng", "maxScore": 20, "items": [] }
  ],
  "createdAt": "2026-04-30T08:42:11.000Z",
  "updatedAt": "2026-05-08T13:30:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 400         | `structure` có truyền nhưng tổng `maxScore` ở cấp gốc khác 100 → `Tổng điểm (maxScore) của tất cả các Nhiệm vụ phải chính xác bằng 100. Hiện tại đang là <X>.` |
| 404         | Không tìm thấy template (`Template with ID ... not found`)                                                                     |
| 500         | `id` không phải UUID hợp lệ                                                                                                    |

---
