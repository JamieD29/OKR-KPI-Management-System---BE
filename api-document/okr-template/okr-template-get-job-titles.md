Lấy danh sách Chức danh nghề nghiệp (`JobTitle`) sử dụng trong hệ thống. Dữ liệu được sinh ra từ enum `JobTitle` trong `user.entity.ts` (không truy DB), dùng để fill dropdown khi tạo/sửa Template OKR.

## HTTP Request

**Endpoint:** `GET {baseUrl}/okr-templates/job-titles`

### Headers


| Attribute     | Type   | Required | Description                                                                  |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| Authorization | String |          | (Optional) Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có.

### Example Request

```http
GET /okr-templates/job-titles HTTP/1.1
Host: api.example.com
```

## HTTP Response

Trả về mảng object đại diện các giá trị enum `JobTitle`. Mỗi phần tử có 3 field: `value`, `label`, `key` — trong đó `value` và `label` là chuỗi tiếng Việt giống nhau (dùng cho UI), còn `key` là tên hằng trong enum (dùng làm key nội bộ).


| Attribute | Type            | Required | Description                                                                          |
| --------- | --------------- | -------- | ------------------------------------------------------------------------------------ |
| (root)    | Array\<Object\> | √        | Danh sách chức danh, đúng thứ tự khai báo trong enum `JobTitle`                       |
| value     | String          | √        | Giá trị tiếng Việt (vd: `Giảng viên`). Lưu DB và hiển thị UI.                          |
| label     | String          | √        | Trùng với `value`, dùng cho dropdown frontend.                                       |
| key       | String          | √        | Khoá enum (vd: `LECTURER`, `SENIOR_LECTURER`, `SPECIALIST`, `RESEARCHER`, `ASSISTANT`, `STAFF`, `TECHNICIAN`, `SUPPORT_STAFF`) |


### Example Response (200 OK)

```json
[
  { "value": "Giảng viên", "label": "Giảng viên", "key": "LECTURER" },
  { "value": "Giảng viên chính", "label": "Giảng viên chính", "key": "SENIOR_LECTURER" },
  { "value": "Chuyên viên", "label": "Chuyên viên", "key": "SPECIALIST" },
  { "value": "Nghiên cứu viên", "label": "Nghiên cứu viên", "key": "RESEARCHER" },
  { "value": "Trợ giảng", "label": "Trợ giảng", "key": "ASSISTANT" },
  { "value": "Giáo vụ", "label": "Giáo vụ", "key": "STAFF" },
  { "value": "Kỹ thuật viên", "label": "Kỹ thuật viên", "key": "TECHNICIAN" },
  { "value": "Nhân viên hỗ trợ", "label": "Nhân viên hỗ trợ", "key": "SUPPORT_STAFF" }
]
```

### Error Responses

Không có lỗi nghiệp vụ — endpoint chỉ map enum và trả về.

---
