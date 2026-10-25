# SmartShule Data Security & Privacy Policy

## Data Classification
- **Public**: School name, logo, general contact info.
- **Internal**: Class schedules, subject allocations.
- **Confidential (PII)**: Student names, admission numbers, parent phone numbers, teacher salaries/IDs.

## Protection Measures
1. **Encryption in Transit**: All API communication is enforced over HTTPS (TLS 1.2+).
2. **Encryption at Rest**: Passwords are hashed via `bcrypt`. Sensitive PII fields are candidates for application-level encryption in future iterations.
3. **Principle of Least Privilege**: Database users and API tokens are granted only the permissions necessary for their role.
4. **Multi-Tenant Isolation**: Logical separation of data using `school_id`. No school can query another school's data.

## Kenyan Data Protection Act (KDPA) 2019 Alignment
- **Consent**: Parents implicitly consent to data processing for educational administration upon enrollment.
- **Data Minimization**: We only collect data strictly necessary for academic management (Name, ADM, Class, Parent Contact).
- **Right to Access**: Parents/Students can view their own data via the Parent/Student portal.