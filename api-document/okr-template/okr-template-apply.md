Áp dụng (gán) một Template OKR cho **nhiều user** trong cùng một chu kỳ đánh giá (`cycleId`). Với mỗi user trong `userIds`, hệ thống sẽ:

1. Tìm `User` theo `userId`. Nếu user không tồn tại → bỏ qua user đó (log `console.warn`), KHÔNG fail toàn bộ request.
2. Tạo một bản ghi `UserOkr` mới có:
   - `userId` = user đang xét
   - `cycleId` = `applyDto.cycleId`
   - `objective` = `template.title` (snapshot tên template làm tên objective)
   - `keyResults` = `template.structure` (snapshot toàn bộ cây cấu trúc)
   - `templateId` = `:id` của template
   - `status` = `PENDING`
   - `totalScore` = 0
   - `deadline` = `applyDto.deadline` (nếu có)
3. Gửi 1 notification cho user: `📋 Bạn đã được giao OKR mới: "<title>" (Deadline: dd/MM/yyyy). Vào "OKR Của Tôi" để xem chi tiết và phản hồi.` (chuỗi `(Deadline: ...)` chỉ thêm khi có truyền `deadline`).

## HTTP Request

**Endpoint:** `POST {baseUrl}/okr-templates/:id/apply`

### Path Params


| Attribute | Type          | Required | Description                       |
| --------- | ------------- | -------- | --------------------------------- |
| id        | String (UUID) | √        | ID của template muốn áp dụng       |


### Headers


| Attribute     | Type   | Required | Description                                                                  |
| ------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| Authorization | String |          | (Optional) Bearer token JWT, định dạng: `Bearer <accessToken>` |
| Content-Type  | String | √        | `application/json`                                                           |


### Body


| Attribute | Type                  | Required | Description                                                                                          |
| --------- | --------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| userIds   | Array\<String (UUID)\> | √       | Danh sách ID user được giao OKR. Phải có **ít nhất 1 phần tử**, nếu rỗng → 400.                       |
| cycleId   | String (UUID)         | √        | ID chu kỳ đánh giá (`EvaluationCycle`) mà các `UserOkr` sẽ được tạo bên trong.                        |
| deadline  | Date (ISO)            |          | Hạn hoàn thành (timestamp). Nếu có, sẽ ghi vào cột `deadline` của `UserOkr` và thêm vào nội dung notification. |


### Example Request

```http
POST /okr-templates/t1111111-aaaa-bbbb-cccc-dddddddddddd/apply HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "userIds": [
    "8a7b6c5d-1234-4abc-9def-1122334455aa",
    "9b8c7d6e-2345-4abc-9def-2233445566bb"
  ],
  "cycleId": "c0c0c0c0-1111-2222-3333-444455556666",
  "deadline": "2026-12-31T23:59:59.000Z"
}
```

## HTTP Response

Trả về tổng kết kết quả áp dụng + danh sách `UserOkr` đã tạo thành công. `count` có thể nhỏ hơn `userIds.length` nếu có user bị skip do không tồn tại.


| Attribute | Type             | Required | Description                                                                                  |
| --------- | ---------------- | -------- | -------------------------------------------------------------------------------------------- |
| success   | Boolean          | √        | Luôn `true` khi không bị throw exception                                                      |
| count     | Number           | √        | Số lượng `UserOkr` đã được tạo (= số user hợp lệ trong `userIds`)                              |
| data      | Array\<UserOkr\> | √        | Danh sách `UserOkr` vừa tạo, mỗi phần tử có `id`, `userId`, `cycleId`, `objective`, `keyResults`, `templateId`, `status`, `totalScore`, `deadline`, `createdAt`, `updatedAt`. |


Mỗi `UserOkr` gồm:


| Attribute    | Type            | Required | Description                                                                       |
| ------------ | --------------- | -------- | --------------------------------------------------------------------------------- |
| id           | String (UUID)   | √        | ID `UserOkr` mới tạo                                                              |
| userId       | String (UUID)   | √        | ID user được giao                                                                  |
| cycleId      | String (UUID)   | √        | ID chu kỳ đánh giá                                                                 |
| objective    | String          | √        | Tên objective (= `template.title` snapshot)                                       |
| keyResults   | Array\<Object\> | √        | Snapshot `template.structure`                                                      |
| templateId   | String (UUID)   | √        | ID template gốc                                                                    |
| status       | String          | √        | `PENDING` (mặc định khi vừa apply)                                                |
| totalScore   | Number          | √        | `0`                                                                                |
| deadline     | Date (ISO)      |          | Deadline (nếu request có truyền)                                                   |
| createdAt    | Date (ISO)      | √        | Thời điểm tạo                                                                      |
| updatedAt    | Date (ISO)      | √        | Thời điểm cập nhật                                                                  |


### Example Response (201 Created)

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "u0000001-aaaa-bbbb-cccc-dddddddddddd",
      "userId": "8a7b6c5d-1234-4abc-9def-1122334455aa",
      "cycleId": "c0c0c0c0-1111-2222-3333-444455556666",
      "objective": "Template OKR Giảng viên 2026",
      "keyResults": [
        {
          "id": "obj-A",
          "type": "objective",
          "title": "A. Hoạt động giảng dạy",
          "maxScore": 60,
          "items": []
        },
        {
          "id": "obj-B",
          "type": "objective",
          "title": "B. Nghiên cứu khoa học",
          "maxScore": 40,
          "items": []
        }
      ],
      "totalScore": 0,
      "templateId": "t1111111-aaaa-bbbb-cccc-dddddddddddd",
      "status": "PENDING",
      "deadline": "2026-12-31T23:59:59.000Z",
      "createdAt": "2026-05-08T13:45:00.000Z",
      "updatedAt": "2026-05-08T13:45:00.000Z"
    },
    {
      "id": "u0000002-aaaa-bbbb-cccc-dddddddddddd",
      "userId": "9b8c7d6e-2345-4abc-9def-2233445566bb",
      "cycleId": "c0c0c0c0-1111-2222-3333-444455556666",
      "objective": "Template OKR Giảng viên 2026",
      "keyResults": [
        { "id": "obj-A", "type": "objective", "title": "A. Hoạt động giảng dạy", "maxScore": 60, "items": [] },
        { "id": "obj-B", "type": "objective", "title": "B. Nghiên cứu khoa học", "maxScore": 40, "items": [] }
      ],
      "totalScore": 0,
      "templateId": "t1111111-aaaa-bbbb-cccc-dddddddddddd",
      "status": "PENDING",
      "deadline": "2026-12-31T23:59:59.000Z",
      "createdAt": "2026-05-08T13:45:00.000Z",
      "updatedAt": "2026-05-08T13:45:00.000Z"
    }
  ]
}
```

### Side Effects

- Mỗi user trong `userIds` (nếu hợp lệ) sẽ nhận thêm 1 record trong bảng `notifications`, nội dung dạng:
  - Có deadline: `📋 Bạn đã được giao OKR mới: "Template OKR Giảng viên 2026" (Deadline: 31/12/2026). Vào "OKR Của Tôi" để xem chi tiết và phản hồi.`
  - Không deadline: `📋 Bạn đã được giao OKR mới: "Template OKR Giảng viên 2026". Vào "OKR Của Tôi" để xem chi tiết và phản hồi.`
- User không tồn tại trong `userIds` → bị bỏ qua (warn log), không tạo `UserOkr` và không tạo notification cho user đó.

### Error Responses


| HTTP Status | Khi nào                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| 400         | `userIds` rỗng hoặc thiếu → `Phải chọn ít nhất 1 người để giao OKR`                                                     |
| 400         | Template tồn tại nhưng `structure` rỗng → `Template structure is empty`                                                 |
| 404         | Không tìm thấy template (`Template with ID ... not found`)                                                              |
| 500         | `id` / `cycleId` / phần tử trong `userIds` không phải UUID hợp lệ; hoặc thiếu `cycleId` (vi phạm FK ở `user_okrs.cycle_id`) |

---
