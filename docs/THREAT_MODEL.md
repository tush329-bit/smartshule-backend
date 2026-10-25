# SmartShule Threat Model (STRIDE)

## 1. Spoofing (Identity)
- **Threat**: Attacker guesses or steals a teacher's credentials to access the system.
- **Mitigation**: Strong password hashing (bcrypt), JWT-based session management, and account lockout after 5 failed login attempts (Rate Limiting).

## 2. Tampering (Data)
- **Threat**: A malicious teacher alters another teacher's marks or a student's attendance.
- **Mitigation**: Strict Row-Level Security (RLS) logic. Every `UPDATE` query includes `WHERE school_id = $1 AND teacher_id = $2`. Audit logs record all modifications.

## 3. Repudiation (Actions)
- **Threat**: An admin deletes a student record and claims they didn't do it.
- **Mitigation**: Comprehensive Audit Logging (`audit_logs` table) capturing `user_id`, `action`, `target_table`, `old_value`, `new_value`, and `timestamp`.

## 4. Information Disclosure (Data)
- **Threat**: A principal from School A queries the API and sees students from School B.
- **Mitigation**: Multi-tenant middleware extracts `school_id` from the verified JWT and appends it to every database query.

## 5. Denial of Service (DoS)
- **Threat**: Attacker floods the `/login` or `/sms/send` endpoint, exhausting server resources or SMS credits.
- **Mitigation**: Express Rate Limiter (e.g., 5 requests per minute per IP on auth routes). Premium feature gating for SMS.

## 6. Elevation of Privilege
- **Threat**: A regular teacher manipulates their JWT to gain `principal` or `super_admin` access.
- **Mitigation**: JWT payload is signed server-side. The `authorizeRoles` middleware strictly verifies the `role` claim against the requested route.