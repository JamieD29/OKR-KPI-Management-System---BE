Lấy toàn bộ danh sách giá trị enum dùng cho form thiết lập / cập nhật hồ sơ (Single Source of Truth). FE gọi endpoint này để render dropdown thay vì hardcode danh sách.

## HTTP Request

**Endpoint:** `GET {baseUrl}/users/profile-options`

### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |


### Query / Body

Không có.

### Example Request

```http
GET /users/profile-options HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response

Trả về object gồm 4 nhóm enum: `jobTitles`, `academicRanks`, `degrees`, `genders`. Mỗi phần tử có dạng `{ value, label, key }`.


| Attribute     | Type            | Required | Description                                                                                                                |
| ------------- | --------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| jobTitles     | Array\<Option\> | √        | Danh sách chức danh nghề nghiệp                                                                                            |
| academicRanks | Array\<Option\> | √        | Danh sách học hàm. Riêng `NONE` có `label` là `Không có học hàm`                                                           |
| degrees       | Array\<Option\> | √        | Danh sách học vị                                                                                                           |
| genders       | Array\<Option\> | √        | Danh sách giới tính                                                                                                        |


#### Option

| Attribute | Type   | Required | Description                                                                                                                                              |
| --------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value     | String | √        | Giá trị thực sẽ lưu xuống DB (vd: `Giảng viên`, `Tiến sĩ`)                                                                                               |
| label     | String | √        | Nhãn hiển thị cho người dùng                                                                                                                             |
| key       | String | √        | Khóa enum trong code (vd: `LECTURER`, `TS`, `MALE`, `NONE`)                                                                                              |


### Example Response (200 OK)

```json
{
  "jobTitles": [
    { "value": "Giảng viên", "label": "Giảng viên", "key": "LECTURER" },
    { "value": "Giảng viên chính", "label": "Giảng viên chính", "key": "SENIOR_LECTURER" },
    { "value": "Chuyên viên", "label": "Chuyên viên", "key": "SPECIALIST" },
    { "value": "Nghiên cứu viên", "label": "Nghiên cứu viên", "key": "RESEARCHER" },
    { "value": "Trợ giảng", "label": "Trợ giảng", "key": "ASSISTANT" },
    { "value": "Giáo vụ", "label": "Giáo vụ", "key": "STAFF" },
    { "value": "Kỹ thuật viên", "label": "Kỹ thuật viên", "key": "TECHNICIAN" },
    { "value": "Nhân viên hỗ trợ", "label": "Nhân viên hỗ trợ", "key": "SUPPORT_STAFF" }
  ],
  "academicRanks": [
    { "value": "Giáo sư", "label": "Giáo sư", "key": "GS" },
    { "value": "Phó giáo sư", "label": "Phó giáo sư", "key": "PGS" },
    { "value": "Không", "label": "Không có học hàm", "key": "NONE" }
  ],
  "degrees": [
    { "value": "Cử nhân", "label": "Cử nhân", "key": "CN" },
    { "value": "Thạc sĩ", "label": "Thạc sĩ", "key": "THS" },
    { "value": "Tiến sĩ", "label": "Tiến sĩ", "key": "TS" },
    { "value": "Không", "label": "Không", "key": "None" }
  ],
  "genders": [
    { "value": "Nam", "label": "Nam", "key": "MALE" },
    { "value": "Nữ", "label": "Nữ", "key": "FEMALE" },
    { "value": "Khác", "label": "Khác", "key": "OTHER" }
  ]
}
```

---
