# API Specification

## Auth (`api-document/auth/`)

- `GET /auth/allowed-domains` — [`auth-get-allowed-domains.md`](./auth/auth-get-allowed-domains.md) (public)
- `GET /auth/google` — [`auth-google-login.md`](./auth/auth-google-login.md) (302 → Google consent)
- `GET /auth/google/callback` — [`auth-google-callback.md`](./auth/auth-google-callback.md) (302 → FE với accessToken+user)
- `GET /auth/microsoft` — [`auth-microsoft-login.md`](./auth/auth-microsoft-login.md) (302 → Microsoft consent)
- `GET /auth/microsoft/callback` — [`auth-microsoft-callback.md`](./auth/auth-microsoft-callback.md)
- `POST /auth/logout` — [`auth-logout.md`](./auth/auth-logout.md) (JWT)

## Users (`api-document/users/`)

- `GET /users/profile-options` — [`users-get-profile-options.md`](./users/users-get-profile-options.md) (JWT)
- `GET /users/profile` — [`users-get-profile.md`](./users/users-get-profile.md) (JWT)
- `PATCH /users/profile` — [`users-update-profile.md`](./users/users-update-profile.md) (JWT)
- `GET /users/filter-by-role` — [`users-filter-by-role.md`](./users/users-filter-by-role.md) (JWT)
- `GET /users` — [`users-list.md`](./users/users-list.md) (JWT, phân quyền theo permissionLevel)
- `PUT /users/:id/roles` — [`users-update-roles.md`](./users/users-update-roles.md) (Admin)
- `PUT /users/:id/management-position` — [`users-assign-management-position.md`](./users/users-assign-management-position.md) (Admin)

## Departments (`api-document/departments/`)

- `POST /departments` — [`departments-create.md`](./departments/departments-create.md) (Admin)
- `GET /departments` — [`departments-list.md`](./departments/departments-list.md) (JWT)
- `PATCH /departments/:id` — [`departments-update.md`](./departments/departments-update.md) (Admin)
- `DELETE /departments/:id` — [`departments-delete.md`](./departments/departments-delete.md) (Admin)

## Management Position (`api-document/management-position/`)

- `GET /management-positions` — [`management-position-list.md`](./management-position/management-position-list.md) (JWT)
- `POST /management-positions` — [`management-position-create.md`](./management-position/management-position-create.md) (Admin)
- `PATCH /management-positions/:id` — [`management-position-update.md`](./management-position/management-position-update.md) (Admin)
- `DELETE /management-positions/:id` — [`management-position-delete.md`](./management-position/management-position-delete.md) (Admin)

## Notification (`api-document/notification/`)

- `GET /notifications` — [`notification-get-unread.md`](./notification/notification-get-unread.md) (JWT)
- `GET /notifications/read` — [`notification-get-read.md`](./notification/notification-get-read.md) (JWT)
- `GET /notifications/all` — [`notification-get-all.md`](./notification/notification-get-all.md) (JWT, max 50)
- `PATCH /notifications/:id/read` — [`notification-mark-as-read.md`](./notification/notification-mark-as-read.md) (JWT)
- `PATCH /notifications/read-all` — [`notification-mark-all-as-read.md`](./notification/notification-mark-all-as-read.md) (JWT)

## OKR (`api-document/okr/`)

- `POST /okrs/department` — [`okr-create-department-okr.md`](./okr/okr-create-department-okr.md) (JWT)
- `GET /okrs/department` — [`okr-get-department-okrs.md`](./okr/okr-get-department-okrs.md) (JWT)
- `GET /okrs/my` — [`okr-get-my-okrs.md`](./okr/okr-get-my-okrs.md) (JWT)
- `GET /okrs/pending-approval` — [`okr-get-pending-approval.md`](./okr/okr-get-pending-approval.md) (JWT)
- `PUT /okrs/:id/accept` — [`okr-accept.md`](./okr/okr-accept.md) (JWT)
- `POST /okrs/:id/chat` — [`okr-chat-item.md`](./okr/okr-chat-item.md) (JWT)
- `PUT /okrs/:id/edit-item` — [`okr-edit-item-properties.md`](./okr/okr-edit-item-properties.md) (JWT)
- `PUT /okrs/:id/dean-approve` — [`okr-dean-approve.md`](./okr/okr-dean-approve.md) (JWT)
- `PUT /okrs/:id/dean-reject` — [`okr-dean-reject.md`](./okr/okr-dean-reject.md) (JWT)
- `PUT /okrs/:id/self-report` — [`okr-submit-self-report.md`](./okr/okr-submit-self-report.md) (JWT)
- `GET /okrs/submitted` — [`okr-get-submitted.md`](./okr/okr-get-submitted.md) (JWT)
- `GET /okrs/completed` — [`okr-get-completed.md`](./okr/okr-get-completed.md) (JWT)
- `PUT /okrs/:id/manager-review` — [`okr-manager-review.md`](./okr/okr-manager-review.md) (JWT)
- `GET /okrs/evaluations/my` — [`okr-get-my-evaluation-form.md`](./okr/okr-get-my-evaluation-form.md) (JWT)
- `POST /okrs/evaluations/my/submit` — [`okr-submit-my-evaluation-form.md`](./okr/okr-submit-my-evaluation-form.md) (JWT)
- `GET /okrs/evaluations/submitted` — [`okr-get-submitted-evaluations.md`](./okr/okr-get-submitted-evaluations.md) (JWT)
- `PUT /okrs/evaluations/:id/review` — [`okr-manager-review-evaluation.md`](./okr/okr-manager-review-evaluation.md) (JWT)

## OKR Template (`api-document/okr-template/`)

- `GET /okr-templates` — [`okr-template-list.md`](./okr-template/okr-template-list.md)
- `GET /okr-templates/job-titles` — [`okr-template-get-job-titles.md`](./okr-template/okr-template-get-job-titles.md)
- `GET /okr-templates/:id` — [`okr-template-get-detail.md`](./okr-template/okr-template-get-detail.md)
- `POST /okr-templates` — [`okr-template-create.md`](./okr-template/okr-template-create.md)
- `PUT /okr-templates/:id` — [`okr-template-update.md`](./okr-template/okr-template-update.md)
- `DELETE /okr-templates/:id` — [`okr-template-delete.md`](./okr-template/okr-template-delete.md)
- `POST /okr-templates/:id/apply` — [`okr-template-apply.md`](./okr-template/okr-template-apply.md)

## Performance (`api-document/performance/`)

- `GET /performance/cycles` — [`performance-get-cycles.md`](./performance/performance-get-cycles.md)
- `POST /performance/admin/cycles` — [`performance-create-cycle.md`](./performance/performance-create-cycle.md)
- `PUT /performance/admin/cycles/:id/status` — [`performance-toggle-cycle-status.md`](./performance/performance-toggle-cycle-status.md)

## Admin (`api-document/admin/`)

- `GET /admin/domains` — [`admin-list-domains.md`](./admin/admin-list-domains.md)
- `POST /admin/domains` — [`admin-add-domain.md`](./admin/admin-add-domain.md)
- `DELETE /admin/domains/:id` — [`admin-delete-domain.md`](./admin/admin-delete-domain.md)
- `POST /admin/system/reset` — [`admin-factory-reset.md`](./admin/admin-factory-reset.md)

## System Logs (`api-document/system-logs/`)

- `GET /system-logs` — [`system-logs-list.md`](./system-logs/system-logs-list.md) (Admin)
- `DELETE /system-logs` — [`system-logs-clear-all.md`](./system-logs/system-logs-clear-all.md) (Admin)

---

## Tổng quan số liệu

| Module              | Số endpoint |
| ------------------- | ----------- |
| Auth                | 6           |
| Users               | 7           |
| Departments         | 4           |
| Management Position | 4           |
| Notification        | 5           |
| OKR                 | 17          |
| OKR Template        | 7           |
| Performance         | 3           |
| Admin               | 4           |
| System Logs         | 2           |
| **Tổng**            | **59**      |
