# CCV Privacy Policy

Effective Date: 2025-08-19

Last Updated: 2025-08-19

This Privacy Policy explains how CCV ("we", "us", "the Service") collects, uses, stores, protects, and discloses information when you use the application. CCV is a habit / routine tracking application designed around data minimization, user control, portability, and encryption. By using CCV you agree to this Policy.

If you do not agree, do not use the Service.

## 1. Summary (Plain Language)
- We collect the minimum data needed for accounts, habit configuration, daily entries, and optional notifications.
- Your personal habit data is encrypted at rest with keys derived from environment secrets; we do not sell or share it for advertising.
- You can export or delete your data at any time.
- Anonymous / guest sessions expire automatically if you do not sign in.
- We use Google (OAuth) for authentication and (optionally) OneSignal for notifications; Discord webhooks are optional and user-provided.
- No third‑party analytics, ad networks, or behavioral tracking pixels are embedded.

## 2. Scope & Applicability
This Policy applies to all users of the CCV web application, including anonymous (public / guest) users and authenticated users who sign in via Google OAuth.

## 3. Data Categories We Process
### 3.1 Account & Session Data
- User ID (internal identifier)
- Session token (used to validate your session)
- Authentication status (guest vs authenticated)
- Name & email (only after Google sign‑in; email may be optional if not returned or you revoke it)
- Session expiry timestamps (for guests) 

### 3.2 Habit Configuration ("Content")
- Field definitions you create (label, type, icon, constraints)
- Version history of configuration (older versions retained to maintain historical integrity of daily entries)

### 3.3 Daily Entries
- Date key (ISO date for each day tracked)
- Per-field values (boolean, number, string, textarea content, array of strings) — all encrypted at rest

### 3.4 Settings & Preferences
- Notification window (start / end)
- Notification channels & opt-ins (push, email, Discord webhook URL, OneSignal external ID)

### 3.5 Notifications Metadata
- Template identifiers or static fallback content (server-side)
- Delivery attempts (logged success/failure internally; minimal technical logs)

### 3.6 Recovery / Account Support
- Recovery entries (ID + email) for account access flows you explicitly trigger

### 3.7 Technical & Operational Logs (Minimal)
- Transient HTTP request metadata (IP address, user-agent) kept only in short‑term server/access logs
- Timestamped server errors (stack traces)
- Performance debug flags (only if you enable or we temporarily enable for diagnostics)
We do not log your decrypted habit values.

### 3.8 Optional User-Supplied Integrations
- Discord webhook URL (stored only if you add it; used strictly for sending messages you requested)

## 4. What We Deliberately Do NOT Collect
- No advertising identifiers
- No third‑party analytics trackers (Google Analytics, etc.)
- No behavioral profiling data
- No keystroke logging
- No background location data

## 5. Legal Bases (If Applicable Under Your Jurisdiction)
Where required (e.g., GDPR):
- Contract (to provide the Service features you request)
- Legitimate interests (security, anti-abuse, service reliability)
- Consent (optional notifications, Discord webhook, email delivery)
You may withdraw consent for optional channels at any time by disabling them in settings.

## 6. How We Use Data
- Provide core habit tracking functionality
- Render your historical metrics & statistics
- Deliver reminders or test notifications you explicitly request
- Maintain session continuity and prevent unauthorized access
- Support export/import features for portability
- Diagnose performance or reliability issues (aggregate technical logs)
- Respond to contact form submissions (admin email dispatch)

## 7. Encryption & Security
- Habit configuration and daily entries are encrypted at rest using keys derived from server-side secrets.
- At sign-in you are redirected to `/app/firstconnexion` to save your personal encryption key. The key is displayed once; after completing that step the page cannot be revisited to retrieve it. We never store a copy capable of recovering your data. If you lose it, we cannot recover it.
- Environment secrets are not exposed client-side.
- Transport uses HTTPS (TLS) when deployed.
- Access controls restrict internal operations to the minimal code paths; there is no broad administrative dashboard exposing decrypted content.
No system is perfectly secure; we encourage exporting your data periodically.

## 8. Data Portability & Export
You can export your data (e.g., JSON / CSV) through in-app export features. Exports are generated on-demand; we do not pre-build external data sets of your habits.

## 9. Data Retention
| Data Type | Retention Policy |
|-----------|------------------|
| Guest (public) session data | Expires automatically after its defined lifetime or inactivity; may be purged sooner for storage optimization |
| Authenticated user habit data | Retained until you delete your account data |
| Configuration versions | Retained to preserve historical integrity until associated entries are deleted |
| Notifications logs (technical) | Short-term (rolling window, currently ≤30 days) for troubleshooting, then pruned |
| Server/access logs (IP, user-agent) | Short-term (currently ≤30 days) then automatically pruned |
| Recovery entries | Removed after completion or expiration of the recovery window |
| Contact form emails (admin email system) | Stored in the recipient mailbox per their retention policies |

When you delete habit data, associated encrypted records are removed from the primary store. We currently do not maintain long-term cold backups of decrypted content.

## 10. Data Deletion
You may:
- Remove or reconfigure fields (new version created; you may delete old versions if no entries depend on them)
- Delete notification settings / revoke webhooks / disable channels
- Request full account data deletion (removes all user configuration & entries; some logs may persist briefly in aggregated form without personal identifiers)

## 11. Cookies & Local Storage
- Session token / authentication cookie: required for maintaining your signed-in session
- Local storage: may cache icons, UI state, or ephemeral flags to improve performance; does not store decrypted habit history
No cross-site tracking cookies are used.

## 12. Third-Party Services
| Service | Purpose | Data Shared |
|---------|---------|-------------|
| Google OAuth | Authentication | Name, email (as returned), profile ID for sign-in |
| OneSignal (optional) | Push & email notifications | External user ID (mapped to your alias), template IDs, notification metadata |
| Discord Webhook (optional) | User-requested channel for reminders | Webhook URL (user supplied) + message content |
We do not permit these providers to use your data for independent advertising profiling within CCV.

## 13. International Data Transfers
Your data may be processed in regions where our hosting provider (at 2025-08-19 this is [Deno Deploy](https://deno.com/deploy)) and notification/auth providers (Google, OneSignal, Discord) operate (including the EU and United States). By using the Service you consent to such processing. We apply encryption at rest for habit content to reduce risk if storage locality differs from your region. Providers rely on their own safeguards (e.g., standard contractual clauses) for cross-border transfers.

## 14. Automated Decision-Making / Profiling
We do not perform automated decision-making producing legal or similarly significant effects. No ad targeting or behavioral scoring is performed.

## 15. Your Rights (Where Applicable)
Depending on your jurisdiction you may have rights to access, rectify, export, delete, restrict processing, or object to processing. Use in-app export / deletion features or contact us (see Section 20). We will verify your identity using session or email information before acting.

## 16. Breach Notification
If we become aware of a data breach likely to result in a high risk to your rights, we will notify affected users consistent with applicable law and describe mitigation steps.

## 17. Changes to This Policy
We may update this Policy. Material changes will be indicated by updating the "Last Updated" date and, where feasible, providing an in-app notice. Continued use after changes constitutes acceptance.

## 18. Contact
Data Controller: (Individual project owner) – contact: nikita.philippe1@gmail.com

For privacy inquiries or data subject requests, use the above email. EU/UK users may also contact their local data protection authority if concerns remain unresolved.

## 19. Disclaimer
This document is provided for transparency and user trust. It is not certified legal advice. Jurisdiction-specific obligations (e.g., GDPR/CCPA) may impose additional requirements; we intend to honor applicable rights upon verifiable request.

## 20. Version History
- 2025-08-19: Initial comprehensive version committed.

---
If you have suggestions to improve clarity or protection, please reach out using the contact method above.
