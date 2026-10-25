# SmartShule Security Checklist

## 🔐 Authentication & Authorization
- [ ] JWTs are signed with a strong, unique `JWT_SECRET` (min 32 chars).
- [ ] JWT expiration is set to a short duration (e.g., 15m - 7d max).
- [ ] Passwords are hashed using `bcrypt` with a cost factor of ≥ 10.
- [ ] Multi-tenant isolation is enforced via `school_id` in ALL database queries (Row-Level Security logic).
- [ ] Role-Based Access Control (RBAC) middleware (`authorizeRoles`) protects all sensitive routes.

## 🛡️ Input & Output Validation
- [ ] All user inputs are validated and sanitized on the **server-side** (e.g., using `zod` or `express-validator`).
- [ ] Output is escaped to prevent Cross-Site Scripting (XSS).
- [ ] File uploads are strictly validated by MIME type, extension, and size limit (max 5MB).

## 🌐 Network & Infrastructure
- [ ] Application runs behind a reverse proxy (Nginx) in production.
- [ ] HTTPS/TLS 1.3 is enforced for all traffic.
- [ ] Rate limiting is applied to auth endpoints (`/login`, `/register`) to prevent brute-force attacks.
- [ ] CORS is strictly configured to only allow the production frontend domain.

## 🇰🇪 Compliance (Kenyan Data Protection Act, 2019)
- [ ] Personal Identifiable Information (PII) like phone numbers and names are encrypted at rest where applicable.
- [ ] Audit logs are maintained for all administrative actions (who changed what, and when).
- [ ] Data retention policies are defined for student records.