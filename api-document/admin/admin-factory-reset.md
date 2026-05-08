Khôi phục cài đặt gốc toàn hệ thống. Endpoint này gọi `DatabaseSeederService.factoryReset()` — `TRUNCATE` toàn bộ các bảng nghiệp vụ rồi seed lại dữ liệu mặc định (roles, domains, departments).

> 🚨 **CẢNH BÁO TỐI QUAN TRỌNG — HÀNH ĐỘNG PHÁ HỦY DỮ LIỆU KHÔNG THỂ HOÀN TÁC:**
>
> Endpoint này thực thi câu lệnh:
>
> ```sql
> TRUNCATE TABLE
>   key_results,
>   objectives,
>   user_okrs,
>   okr_templates,
>   evaluation_cycles,
>   system_logs,
>   notifications,
>   user_roles,
>   users,
>   roles,
>   departments,
>   management_positions,
>   allowed_domains
> CASCADE;
> ```
>
> → **Toàn bộ user, OKR, KPI, log, notification, lịch sử… sẽ bị xóa sạch.** Sau đó hệ thống chỉ còn:
>
> - 2 role mặc định: `Admin`, `User`.
> - 3 allowed domain mặc định: `gmail.com`, `itec.hcmus.edu.vn`, `student.hcmus.edu.vn`.
> - 6 department mặc định của Khoa CNTT (`CNPM`, `CNTT`, `HTTT`, `KHMT`, `MMT`, `TGMT`).
> - **0 user**, **0 management_position**, **0 OKR/KPI** — tất cả admin cũng bị xóa, cần đăng ký lại từ đầu (hoặc bootstrap thủ công).

## HTTP Request

**Endpoint:** `POST {baseUrl}/admin/system/reset`

### Headers


| Attribute     | Type   | Required | Description                                                          |
| ------------- | ------ | -------- | -------------------------------------------------------------------- |
| Authorization | String | √        | Bearer token JWT của tài khoản **ADMIN**: `Bearer <accessToken>`     |


### Body

Không có. Controller hiện không yêu cầu xác nhận thêm — chỉ cần gọi là chạy.

### Example Request

```http
POST /admin/system/reset HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## HTTP Response


| Attribute | Type   | Required | Description                                                                                              |
| --------- | ------ | -------- | -------------------------------------------------------------------------------------------------------- |
| message   | String | √        | Thông báo cố định: `Hệ thống đã được khôi phục về cài đặt gốc thành công!`                              |


### Example Response (200 OK)

```json
{
  "message": "Hệ thống đã được khôi phục về cài đặt gốc thành công!"
}
```

### Error Responses


| HTTP Status | Khi nào                                                                                                                                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 401         | Thiếu / sai JWT                                                                                                                                                                                                                                      |
| 403         | Tài khoản không phải `ADMIN`                                                                                                                                                                                                                         |
| 500         | Câu `TRUNCATE ... CASCADE` thất bại (vd: schema khác với mặc định, một trong các bảng `key_results / objectives / user_okrs / okr_templates / evaluation_cycles / system_logs / notifications / user_roles / users / roles / departments / management_positions / allowed_domains` không tồn tại; hoặc lỗi DB khác). Khi đó trạng thái DB có thể **không nhất quán** — cần khôi phục thủ công. |

> Ghi chú vận hành:
>
> - Sau khi reset, FE sẽ thấy các allowed domain default → user mới chỉ đăng ký được bằng email thuộc 3 domain mặc định.
> - **Mọi session JWT cũ vẫn còn hợp lệ về mặt chữ ký** cho tới khi hết hạn, dù record user đã bị xóa — backend cần kiểm tra user còn tồn tại trong middleware để tránh lỗ hổng "session zombie".

---
