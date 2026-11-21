# Event Management System (MAL3020)

Admins create and manage events; participants browse, register and cancel.
Whenever something changes, every connected browser is updated **live over WebSocket** (Socket.IO) without refreshing.

| Layer | Technology |
|---|---|
| Frontend | Angular 22, TypeScript 6.0, HTML/CSS |
| Backend | Node.js, Express 5 (JavaScript) |
| Database | MongoDB (Mongoose 9) |
| Authentication | JWT (JSON Web Token) + Bcryptjs Password Hashing |
| Real-time | Socket.IO 4.8 (WebSocket Transport) |
| Testing | Jest 30 (Backend: Unit, Integration, System), Angular's built-in test runner Vitest (Frontend), manual UAT |
| CI/CD | GitHub Actions + Docker Compose |

## 1. Run everything with Docker (Easiest)

Requires Docker Desktop (or Docker Engine + Compose).

```bash
docker compose up --build          # First start takes a few minutes
docker compose run --rm backend node src/seed/seed.js   # Optional demo data
```

* Web app: <http://localhost:8080>
* API health check: <http://localhost:3000/api/health>

Demo logins created by the seed script:

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | Admin123! |
| Participant | alice@example.com | Participant123! |
| Participant | bob@example.com | Participant123! |

To create **your own admin account** on the Register page, enter the *Admin signup code* (`ADMIN-2026` by default, set by `ADMIN_SIGNUP_CODE`). Without a code the account is a participant.

## 2. Run on your own machine (For development)

Requires Node.js 24.13.1 or newer (24 LTS or 26) and a MongoDB. The simplest MongoDB is the one from Compose:

```bash
docker compose up -d mongo         # MongoDB on localhost:27017
```

**Back end** (Terminal 1)

```bash
cd backend
npm install
cp .env.example .env               # Then set JWT_SECRET to a long random string
npm run seed                       # Optional demo data
npm run dev                        # API + WebSocket on http://localhost:3000
```

**Front end** (Terminal 2)

```bash
cd frontend
npm install
npm start                          # http://localhost:4200 (proxies /api and /socket.io to port 3000)
```

After the first `npm install` in each folder, **commit the generated `package-lock.json`** files.

### Try the real-time features
*Local (One Device)*
Open two browsers (or one normal + one private window). Log in as the admin in one and as a participant in the other, then create/edit an event or register for one - the other window updates by itself. The navigation bar shows *Live* and how many users are online.

OR *(Multiple Device connect to it)*

`Option 1`
On local device, go to "Windows Defender Firewall" -> "Advanced Security" -> "Select `Inbound Rules`" -> "Select `New Rule`" -> "Choose `Port`" -> "Select `TCP` and enter `4200` (Default) under `Specific` local ports" -> "Choose `Allow the connection`" -> "Enable `Private` only" -> "Name it as `Angular Dev Server - Local Network Only`"

`Option 2 (More Restrictive Rule)`
On local device, run `Windows PowerShell as Administrator`:
New-NetFirewallRule `
  -DisplayName "Angular Dev Server - Local Network Only" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 4200 `
  -Action Allow `
  -Profile Private `
  -RemoteAddress LocalSubnet

This rule means:
- Allow incoming TCP connections on port 4200.
- Only apply the rule when Windows identifies the network as Private.
- Only accept connections originating from the local subnet.

For even tighter security, replace `LocalSubnet` with other device's specific IPv4 address:
Example:
  -RemoteAddress 192.168.1.101

This allows only other device's to access port 4200.

After Option 1 / Option 2, run frontend with 'ng serve --host 0.0.0.0 --port 4200' instead of 'npm start' (To save time, modify frontend/package.json, under "scripts/start:" change 'ng serve' to 'ng serve --host 0.0.0.0 --port 4200')

Make sure only use the `Private` network profile on a trusted network, such as home or office Wi-Fi.

## 3. Tests

```bash
cd backend
npm run test:unit          # no database needed
npm run test:integration   # needs MongoDB on localhost:27017 (uses the separate "event_management_test" database)
npm run test:system        # full HTTP + two real WebSocket clients
npm test                   # everything + coverage report (coverage/lcov-report/index.html)
npm run lint               # ESLint static analysis

cd ../frontend
npm test                   # Angular unit tests
```

The tests delete data, so they refuse to run unless the database name contains `test`.

## 4. REST API summary

All routes except register/login need `Authorization: Bearer <token>`.

| Method & path | Who | Purpose |
|---|---|---|
| POST `/api/auth/register` | public | create account (admin with signup code) |
| POST `/api/auth/login` | public | log in, returns JWT |
| GET `/api/auth/me` | any | current user |
| GET `/api/events`, GET `/api/events/:id` | any | view events / details (with seats left) |
| POST `/api/events` | admin | create event |
| PUT `/api/events/:id` | admin | update event |
| PATCH `/api/events/:id/capacity` | admin | change capacity |
| DELETE `/api/events/:id` | admin | delete event (and its registrations) |
| GET `/api/events/:id/participants` | admin | registered participants |
| POST `/api/events/:id/register` | participant | register |
| DELETE `/api/events/:id/register` | participant | cancel registration |
| GET `/api/registrations/mine` | participant | my registered events |

WebSocket messages (server -> client): `event:created`, `event:updated`, `event:deleted`, `event:seats`, `presence`.

## 5. Project layout

```
backend/src
  config/       environment + database connection
  models/       User, Event, Registration (Mongoose)
  routes/       URL -> controller mapping and who may call it
  controllers/  read the request, call a service, send the response (+ WebSocket broadcast)
  services/     the business rules (capacity, duplicates, login)
  middleware/   JWT check, role check, error handler
  sockets/      Socket.IO set-up and broadcast helper
  utils/        validators, presenters (response shapes), AppError
backend/tests   unit/ integration/ system/
frontend/src/app
  core/         services, live event store, guards, interceptor
  auth/ participant/ admin/   the pages
```

## 6. Dependency versions and why

Checked on 14 Oct 2026. Every package uses the newest major version available, with these exceptions:

| Item | Used | Newest | Reason |
|---|---|---|---|
| MongoDB server | 8.0 (Docker image `mongo:8.0`) | 9.0 announced; 8.3 rapid release | MongoDB 9.0 is not yet downloadable for Community Edition (MongoDB's docs say "coming soon"); 8.x minor releases are for specific use cases, and `8.0` is the long-term release series with a stable official Docker tag. Mongoose 9 supports it. Change the tag in `docker-compose.yml` and `ci.yml` once 9.0 is available. |
| Node.js in Docker/CI | 26 | 26 | Node 26 becomes LTS on 28 Oct 2026. Node 24 LTS is also supported by every dependency (`engines` allows both). |
| TypeScript | ~6.0.3 | 6.0.x | Angular 22 accepts only TypeScript >=6.0 and <6.1, so the `~` range is deliberate. |
| Front-end test runner | Vitest 4 (Angular's built-in) | - | Angular 22's default runner is Vitest; Karma is deprecated and Jest for Angular needs a third-party preset that is not part of Angular. Back end uses Jest 30 as requested. |
| Password hashing | bcryptjs 3 | 3 | Pure JavaScript, so it installs without a C++ compiler on any laptop (the native `bcrypt` package needs one on some systems). |
| `package.json` ranges | `^` | - | `npm install` fetches the newest compatible minor/patch version at install time. |
