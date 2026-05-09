Cập nhật **trực tiếp** thuộc tính chấm điểm (`maxScore`, `unitScore`) của một item trong cây cấu trúc `UserOkr.keyResults`. Service tìm đệ quy theo `itemId` (kể cả item con của con — vd: `1.1`, `A.1.1`) và chỉ ghi đè các field có trong `updates`. Endpoint này thường dùng trong giai đoạn thương lượng (manager hạ/nâng `maxScore` cho một KR cụ thể).

## HTTP Request

**Endpoint:** `PUT {baseUrl}/okrs/:id/edit-item`

### Path Params


| Attribute | Type          | Required | Description       |
| --------- | ------------- | -------- | ----------------- |
| id        | String (UUID) | √        | ID của `UserOkr`  |


### Headers


| Attribute     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                  |


### Body


| Attribute       | Type   | Required | Description                                                                                                                |
| --------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| itemId          | String | √        | ID của item cần sửa, khớp với field `id` trong cây `keyResults` (vd `"1"`, `"1.1"`, `"A"`).                                |
| updates         | Object | √        | Object chứa các field muốn ghi đè. Hiện service chỉ áp dụng `maxScore` và `unitScore`, các field khác bị bỏ qua.           |
| updates.maxScore| Number |          | Điểm tối đa mới cho item (cap điểm khi tính tổng). Bỏ qua nếu `undefined`.                                                 |
| updates.unitScore| Number|          | Điểm trên một đơn vị (vd 1 giờ giảng = 0.5 điểm). Bỏ qua nếu `undefined`.                                                  |


### Example Request

```http
PUT /okrs/uo111111-aaaa-bbbb-cccc-dddddddddddd/edit-item HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "itemId": "1",
  "updates": {
    "maxScore": 18,
    "unitScore": 1
  }
}
```

## HTTP Response

Trả về toàn bộ `UserOkr` sau khi mutate `keyResults`. Nếu `itemId` không match item nào, service vẫn lưu (không throw) — chỉ là không có thay đổi nào được áp dụng.


| Attribute  | Type            | Required | Description                                                                                              |
| ---------- | --------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| id         | String (UUID)   | √        | ID UserOkr                                                                                               |
| keyResults | Array\<Object\> | √        | Cây OKR sau khi cập nhật `maxScore`/`unitScore` của item match                                            |
| ...        | ...             |          | Các field khác giữ nguyên (xem cấu trúc trong `GET /okrs/my`). `status` KHÔNG đổi sau endpoint này.      |


### Example Response (200 OK)

```json
{
  "id": "uo111111-aaaa-bbbb-cccc-dddddddddddd",
  "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
  "objective": "OKR Giảng viên - Học kỳ 1",
  "keyResults": [
    {
      "id": "A",
      "title": "Nhiệm vụ Giảng dạy",
      "maxScore": 35,
      "items": [
        {
          "id": "1",
          "title": "Hoàn thành giờ chuẩn",
          "maxScore": 18,
          "unitScore": 1,
          "unit": "giờ",
          "items": []
        }
      ]
    }
  ],
  "status": "NEGOTIATING",
  "proposedChanges": {
    "1": [
      { "sender": "USER", "message": "Em xin giảm còn 18 giờ", "createdAt": "2025-09-12T08:00:00.000Z" }
    ]
  },
  "totalScore": 0,
  "selfReportData": null,
  "managerReportData": null,
  "managerScore": null,
  "createdAt": "2025-09-10T03:14:25.000Z",
  "updatedAt": "2025-09-12T09:30:00.000Z"
}
```

### Error Responses


| HTTP Status | Khi nào                                                          |
| ----------- | ---------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                  |
| 404         | `OKR not found` — không tìm thấy `UserOkr` với `id` truyền lên   |

---
