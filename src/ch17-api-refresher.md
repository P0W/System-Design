# 17. API Design Refresher

APIs are the contracts between distributed components. An API is a contract written in HTTP. A good one makes the happy path obvious and the failure modes predictable; a bad one makes every client guess. A clean, standard-compliant API reduces friction, eliminates edge-case bugs, and makes integrations predictable.

## HTTP Methods and CRUD
Map operations to standard HTTP semantics. Think in verbs: GET reads, POST creates, PUT replaces the whole resource, PATCH changes only what you mention, and DELETE removes it.

| Operation | HTTP Method | Target URL | Idempotent? |
|---|---|---|---|
| Create | `POST` | `/v1/users` | No |
| Read | `GET` | `/v1/users/{id}` | Yes |
| Update (Full) | `PUT` | `/v1/users/{id}` | Yes |
| Update (Partial) | `PATCH` | `/v1/users/{id}` | No |
| Delete | `DELETE` | `/v1/users/{id}` | Yes |

*Note: Idempotency means making the same request multiple times produces the same server state as making it once. This is crucial for safe network retries.*

## HTTP Status Codes
Don't reinvent error handling. Use standard categories so reverse proxies, load balancers, and clients know exactly what happened.

### 2XX: Success
- **`200 OK`**: Request succeeded (used for GET, PUT, PATCH).
- **`201 Created`**: Resource was created (used for POST).
- **`202 Accepted`**: Request accepted for asynchronous processing (the job is in a queue).
- **`204 No Content`**: Success, but no body to return (often used for DELETE).

### 3XX: Redirection (Go over there)
- **`301 Moved Permanently`**: The resource has a new permanent URI. Browsers will cache this.
- **`302 Found`**: Temporary redirect.
- **`304 Not Modified`**: Used for caching. Tells the client "your cached version is still good, I won't send the body again."
- **`307 Temporary Redirect`**: Same as 302, but guarantees the client won't change the HTTP method (a POST stays a POST).

### 4XX: Client Error (Your fault)
- **`400 Bad Request`**: Malformed request syntax or validation failure.
- **`401 Unauthorized`**: Missing or invalid authentication token. (Who are you?)
- **`403 Forbidden`**: Authenticated, but lacks permission. (You can't do this.)
- **`404 Not Found`**: Resource does not exist.
- **`409 Conflict`**: State conflict (e.g., trying to create a user that already exists, or concurrent edit).
- **`429 Too Many Requests`**: Rate limit exceeded.

### 5XX: Server Error (Our fault)
- **`500 Internal Server Error`**: Generic unhandled exception in application code.
- **`502 Bad Gateway`**: Upstream service failed (common in API gateways and reverse proxies).
- **`503 Service Unavailable`**: Server overloaded or down for maintenance.
- **`504 Gateway Timeout`**: Upstream service took too long to respond.

## API Versioning
APIs evolve. Breaking changes require versioning so existing clients don't break.

1. **URI Versioning** (Most common, easiest to route):
   `GET /v1/products/123`
2. **Header Versioning** (Cleaner URIs, harder to cache/route):
   `GET /products/123` with header `Accept-Version: v1` or `Accept: application/vnd.company.v1+json`

*Recommendation:* Stick to URI versioning for public APIs unless you have a specific, compelling requirement for header versioning.

## Authentication and Authorization
These are distinct concepts that are often conflated:
- **Authentication (AuthN):** Verifying identity.
- **Authorization (AuthZ):** Verifying permissions.

### Authentication Mechanisms
- **Session Cookies:** Stateful, managed by the server, sent automatically by browsers. Best for traditional web apps. Can be revoked immediately by deleting the session on the server.
- **JWT (JSON Web Tokens):** Stateless, signed payloads. Best for microservices and mobile apps where the API gateway can validate the signature without hitting a centralized database. **Crucial caveat:** Because JWTs are stateless, they *cannot be revoked* before they expire unless you build a stateful denylist (which defeats the purpose of being stateless). Keep token lifespans short (e.g., 15 minutes) and use refresh tokens.

### Authorization Models
- **RBAC (Role-Based Access Control):** Users have roles (e.g., `admin`, `editor`). Permissions are attached to roles. Simple and extremely common.
- **ABAC (Attribute-Based Access Control):** Access depends on attributes (e.g., "User can edit document if `user.department == document.department`"). Complex but highly flexible.
