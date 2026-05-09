Lấy danh sách Template OKR. Hỗ trợ 2 chế độ:

- **Không truyền `departmentId`** → trả về toàn bộ template trong hệ thống (`findAll`), sắp xếp theo `createdAt DESC`.
- **Có truyền `departmentId`** → trả về template thuộc đúng department đó (`findByDepartment`), cũng sắp xếp `createdAt DESC`.

## HTTP Request

**Endpoint:** `GET {baseUrl}/okr-templates`

### Headers


| Attribute     | Type   | Required | Description                                                                  |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| Authorization | String |          | (Optional) Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query


| Attribute    | Type          | Required | Description                                                                                  |
| ------------ | ------------- | -------- | -------------------------------------------------------------------------------------------- |
| departmentId | String (UUID) |          | Lọc template theo department. Bỏ qua nếu muốn lấy toàn bộ template trong hệ thống.            |


### Body

Không có.

### Example Request — Lấy toàn bộ template

```http
GET /okr-templates HTTP/1.1
Host: api.example.com
```

### Example Request — Lọc theo department

```http
GET /okr-templates?departmentId=d1f0c2e8-1111-2222-3333-444455556666 HTTP/1.1
Host: api.example.com
```

## HTTP Response

Trả về mảng `OkrTemplate`, sắp xếp `createdAt DESC`.


| Attribute | Type                | Required | Description                                |
| --------- | ------------------- | -------- | ------------------------------------------ |
| (root)    | Array\<OkrTemplate\> | √        | Danh sách template, có thể là mảng rỗng `[]` |


Mỗi phần tử `OkrTemplate` gồm:


| Attribute        | Type          | Required | Description                                                                                                                                                     |
| ---------------- | ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id               | String (UUID) | √        | Mã định danh template                                                                                                                                           |
| title            | String        | √        | Tên / tiêu đề template (vd: "Template OKR Giảng viên 2026")                                                                                                     |
| departmentId     | String (UUID) |          | ID department mà template thuộc về (nullable). Trưởng khoa thường tạo template gắn với department của mình.                                                    |
| positionId       | String (UUID) |          | ID `ManagementPosition` mà template áp dụng (vd: Phó khoa). Nullable.                                                                                            |
| jobTitle         | Enum          |          | Chức danh nghề nghiệp template áp dụng. Giá trị: `Giảng viên`, `Giảng viên chính`, `Chuyên viên`, `Nghiên cứu viên`, `Trợ giảng`, `Giáo vụ`, `Kỹ thuật viên`, `Nhân viên hỗ trợ` |
| positionName     | String        |          | Tên chức vụ hiển thị (vd: "Phó khoa")                                                                                                                            |
| createdByUserId  | String (UUID) |          | ID người tạo template                                                                                                                                            |
| createdByName    | String        |          | Tên người tạo template (snapshot)                                                                                                                                |
| structure        | Array\<Object\> | √      | Cây cấu trúc OKR phân cấp dạng JSONB. Mỗi item có: `id`, `type`, `title`, `maxScore`, `unitScore`, `unit`, `items` (children). Tổng `maxScore` ở mức gốc phải = 100. |
| createdAt        | Date (ISO)    | √        | Thời điểm tạo                                                                                                                                                    |
| updatedAt        | Date (ISO)    | √        | Thời điểm cập nhật mới nhất                                                                                                                                      |


### Example Response (200 OK)

```json
[
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
            "title": "1. Hoàn thành giờ giảng",
            "maxScore": 40,
            "unitScore": 1,
            "unit": "giờ",
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
]
```

### Error Responses


| HTTP Status | Khi nào                                                            |
| ----------- | ------------------------------------------------------------------ |
| 500         | Lỗi server / DB khi truy vấn (vd: `departmentId` không phải UUID hợp lệ → có thể trả 500 do Postgres parse lỗi) |

---
