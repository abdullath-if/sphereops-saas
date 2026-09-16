# SphereOps — Enterprise Employee & Project Management SaaS

[![Node Version](https://img.shields.io/badge/Node-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React 18](https://img.shields.io/badge/Frontend-React_18_%7C_Vite_6-61DAFB?logo=react&logoColor=black)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Backend-Express.js_4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_8_%7C_Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Socket.IO](https://img.shields.io/badge/RealTime-Socket.IO_4-010101?logo=socket.io&logoColor=white)](https://socket.io)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?logo=github&logoColor=white)](https://github.com/abdullath-if/sphereops-saas)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> 🔗 **Public GitHub Repository:** [https://github.com/abdullath-if/sphereops-saas](https://github.com/abdullath-if/sphereops-saas)  
> 🌐 **Live Demo:** [https://sphereops.vercel.app](https://sphereops.vercel.app) *(or run locally in 2 minutes)*  
> 👤 **Author:** [Abdul Lathif](https://github.com/abdullath-if) • [Email](mailto:abdullathif6382@gmail.com)

---

## 💡 Why I Built SphereOps

Most growing engineering and product teams run into the same frustration: **tool sprawl**.
- Task tracking happens in Jira or Linear (expensive, heavy, often over-engineered for mid-sized teams).
- Daily communication happens in Slack or Discord (completely detached from task context).
- Employee directories, department rosters, and role assignments live in disparate Google Sheets or HR portals.

I built **SphereOps** as an all-in-one, high-performance workspace that unifies **project portfolio tracking, interactive Kanban execution, real-time team messaging, and employee directory management** under a single responsive dashboard.

Instead of just building another CRUD app, I wanted to tackle real-world engineering challenges: **fine-grained 3-tier Role-Based Access Control (RBAC)**, **bidirectional WebSocket synchronization with room multiplexing**, **optimistic UI updates with rollback handling**, and a **zero-configuration developer onboarding experience** with embedded database fallback.

---

## 🎯 Recruiter & Hiring Manager Highlights

If you're evaluating this project for a full-stack or backend engineering role, here is a quick snapshot of what I built and the engineering decisions behind it:

### 📌 Resume-Ready Bullet Points
- **Full-Stack Architecture & Security:** Designed and shipped a production-ready MERN SaaS platform implementing 3-tier RBAC (`Admin`, `Manager`, `Employee`) across 25+ REST endpoints, secured with JWT Bearer authentication, bcrypt password hashing, input sanitization, and CORS origin whitelisting.
- **Real-Time Collaboration (<50ms sync):** Engineered bidirectional event-driven communication using Socket.IO with room multiplexing (`project:*`, `user:*`), enabling instant Kanban task movements, live direct/group chat, and notification badges without polling overhead.
- **Optimistic UI & State Reconciliation:** Implemented an HTML5 drag-and-drop Kanban board in React 18 featuring optimistic state updates for instantaneous 0ms perceived latency, paired with server error catchers for automated state rollback.
- **Zero-Friction Developer Experience (DX):** Engineered an automated database fallback mechanism (`mongodb-memory-server` with persistent local disk storage) that allows new developers or reviewers to clone and run the application with zero MongoDB setup or external cloud dependencies.
- **Audit Logging & Compliance:** Built an automated activity-tracking engine that logs lifecycle events (creates, reassignments, status transitions, comments) across 9 data entities with indexed actor references and timestamped audit streams.
- **Automated Test Suite:** Authored native Node.js test runner suites (`node:test`, `node:assert`) covering end-to-end user registration, authentication guards, role permission validation, and task status transitions.

---

## 🏛️ System Architecture

SphereOps is structured as a decoupled client-server architecture with real-time pub/sub capabilities:

```
                                  +---------------------------------------+
                                  |         SphereOps Web Client          |
                                  |     React 18 + Vite 6 + Tailwind      |
                                  |   Recharts + Lucide + Context API     |
                                  +-------------------+-------------------+
                                                      |
                                     HTTPS REST /     |   WebSockets WSS
                                     Multipart Upload |   (Socket.IO Client)
                                                      |
                                  +-------------------v-------------------+
                                  |          SphereOps API Server         |
                                  |          Express.js (Node v20+)       |
                                  |---------------------------------------|
                                  | • JWT Auth & RBAC Security Guards     |
                                  | • Multer File Upload & MIME Validator |
                                  | • Activity & Audit Logger Middleware  |
                                  | • Socket.IO Room Multiplexing Engine  |
                                  +---------+-------------------+---------+
                                            |                   |
                         +------------------v---+           +---v------------------+
                         |   MongoDB Cluster    |           |   Persistent Storage |
                         |   Atlas / Local DB   |           |    /uploads static   |
                         |   (Auto-fallback to  |           |   File Attachment    |
                         |  Embedded In-Memory) |           |      Repository      |
                         +----------------------+           +----------------------+
```

### Request & Event Lifecycle
1. **HTTP Requests**: Authenticated via `Authorization: Bearer <token>`. The `protect` middleware decodes the JWT, hydrates `req.user`, and verifies active status.
2. **RBAC Guard (`authorize(...roles)`)**: Checks if `req.user.role` matches permitted tiers (e.g., only `admin` can provision employees; only `manager` and `admin` can create projects).
3. **Audit Dispatcher**: Successful mutations asynchronously invoke `logActivity()`, recording actor ID, action verb, target entity, and human-readable changelog.
4. **WebSocket Sync**: Connected clients join authenticated rooms. When a task changes state, the server broadcasts an event only to subscribers of `project:${projectId}`, avoiding global socket noise.

---

## 🔑 Role-Based Access Control (RBAC) Matrix

SphereOps enforces strict resource boundaries at both the API layer and the UI rendering level:

| Feature & Permissions | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| **Executive Analytics & KPIs** | Company-wide metrics & financial budget stats | Department & assigned project stats | Personal task completion & velocity |
| **Employee Directory** | Create, edit, deactivate, assign departments | View team directory & contact info | View team directory & contact info |
| **Department Administration** | Create departments & appoint team leads | View department rosters | View department rosters |
| **Project Management** | Full CRUD + budget & technology stack | Create, edit, and assign team members | View assigned projects & deliverables |
| **Task Allocation & Assignment** | Full CRUD across all projects | Full CRUD across owned projects | Update assigned task status & progress |
| **Interactive Kanban Board** | Drag-and-drop any task across stages | Drag-and-drop any task across stages | Drag-and-drop assigned tasks |
| **Real-Time Team Chat** | All channels & 1-on-1 direct messages | All channels & 1-on-1 direct messages | Project channels & 1-on-1 direct messages |
| **Company Calendar** | Enterprise milestones, sprints, deadlines | Team milestones & sprint deadlines | Personal task due dates |
| **System Audit Logs** | Full organization-wide compliance stream | Project-level activity feed | Personal activity history |

---

## 🛠️ Technical Deep Dives & Engineering Decisions

Here are concrete technical challenges I encountered while engineering SphereOps and how I resolved them:

### 1. Optimistic UI Updates vs. Distributed Kanban Race Conditions
* **The Challenge:** Dragging a Kanban card across columns (e.g., from `In Progress` to `Review`) should feel instantaneous. Waiting 200–400ms for an HTTP roundtrip causes sluggish, jarring UI stutter. However, updating the UI before the server confirms introduces the risk of state desynchronization if the request fails or if another teammate moves the same card.
* **My Solution:**
  1. **Optimistic Local Mutation:** The client updates local React state immediately on `onDragEnd` for 0ms perceived lag.
  2. **Atomic Status Patch:** An asynchronous `PATCH /api/tasks/:id/status` request sends `{ status: newStatus }` with the card's target sequence index.
  3. **Rollback on Rejection:** If the network request fails (e.g., 403 Forbidden or server timeout), the catch handler reverts the card back to its previous column and triggers an error toast.
  4. **Socket Broadcast:** On successful commit, the server broadcasts `task:updated` to the project room, syncing all other active viewers without triggering duplicate re-renders on the initiator's client.

### 2. WebSocket Room Multiplexing vs. Global Broadcasting
* **The Challenge:** A naive WebSocket implementation broadcasts all task updates, comments, and messages to every connected socket (`io.emit(...)`). In a multi-team SaaS, this creates massive bandwidth waste and exposes sensitive company project data to unauthorized users.
* **My Solution:**
  - Implemented channel multiplexing in `socketService.js`:
    ```javascript
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });
    ```
  - When a task is updated or a channel message is sent, the event is emitted strictly to `io.to('project:' + projectId).emit(...)`.
  - Direct 1-on-1 messages are routed strictly to the recipient's private room: `io.to('user:' + recipientId).emit(...)`.

### 3. Zero-Config Developer Experience (Embedded MongoDB Fallback)
* **The Challenge:** Many full-stack portfolio projects fail during recruiter review because setting up a local MongoDB service or configuring an Atlas connection string takes time and creates friction.
* **My Solution:**
  - In `server/src/config/db.js`, the connection initiates a 2.5-second connection timeout against the configured `MONGO_URI`.
  - If no external database is detected, the server automatically catches the error and spawns an embedded `MongoMemoryServer` with local disk persistence in `data/db/`:
    ```javascript
    // Automatically spins up embedded MongoDB instance if no local/Atlas DB is running
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: { dbPath: path.join(__dirname, '../../../data/db'), storageEngine: 'wiredTiger' }
    });
    ```
  - If the database is empty, `server.js` automatically runs the seed script on boot. Anyone can clone the repository and run `npm run dev` with **zero prerequisite configuration**.

### 4. Database Aggregations for Scope-Based Analytics
* **The Challenge:** Computing dashboard analytics (completion rates, task velocity, priority breakdown, department headcount) across hundreds of records through repeated Mongoose queries causes server bottlenecks.
* **My Solution:**
  - Used Mongoose aggregation pipelines (`$facet`, `$group`, `$match`) in `analyticsController.js` to calculate total projects, active tasks, completion percentages, and department distribution in a single database roundtrip.
  - Dynamically injected `$match` filters based on `req.user.role` so Admins see global company KPIs, Managers see their department's data, and Employees see their personal productivity metrics.

---

## ⚡ Quickstart — Run Locally in 2 Minutes

SphereOps requires only **Node.js (v20 or higher)**. A local MongoDB installation is optional thanks to the automated embedded database fallback.

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/abdullath-if/sphereops-saas.git
cd sphereops-saas

# Install dependencies across root, server, and client with one command
npm run install:all
```

### 2. Configure Environment Variables (Optional)
The server works out-of-the-box with default development settings. If you want to customize:
```bash
cp server/.env.example server/.env
```

### 3. Seed Demo Data & Start Development
```bash
# Seed the database with sample departments, users, projects, tasks, and chats
npm run seed

# Run both the Express API (port 5000) and Vite React app (port 5173) concurrently
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🧪 Demo Credentials (One-Click Login Ready)

The login screen includes **Quick Demo Login buttons** to test any role instantly:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@company.com` *(or `abdul@company.com`)* | `Password123!` | Full enterprise administration, employee management, audit logs |
| **Manager** | `manager.sarah@company.com` | `Password123!` | Project creation, task assignment, team oversight |
| **Manager** | `manager.david@company.com` | `Password123!` | Design department leadership, sprint planning |
| **Employee** | `marcus.v@company.com` | `Password123!` | Senior developer view, Kanban drag-and-drop, chat |
| **Employee** | `elena.r@company.com` | `Password123!` | UI/UX designer view, assigned tasks, file attachments |

---

## 🧪 Automated Testing

SphereOps uses Node.js's native test runner (`node:test`) for fast, lightweight testing without Jest configuration bloat.

```bash
# Run the integration test suite
npm test
```

### Test Coverage Highlights
- ✅ User registration and duplicate email rejection
- ✅ Password hashing and JWT issuance
- ✅ Role-based endpoint authorization (`403 Forbidden` on unauthorized role access)
- ✅ Project creation and member assignment
- ✅ Task creation and status transition lifecycle (`todo` -> `in_progress` -> `review` -> `completed`)

---

## 📂 Project Structure

```
sphereops-saas/
├── client/                     # Frontend (React 18 + Vite 6 + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Modular UI (Modal, Button, Input, Kanban, Charts)
│   │   ├── context/            # AuthContext, SocketContext (global reactive state)
│   │   ├── pages/
│   │   │   ├── activity/       # Audit trail and compliance logs
│   │   │   ├── analytics/      # Recharts metrics and productivity analytics
│   │   │   ├── auth/           # Login, Register, Forgot/Reset Password
│   │   │   ├── calendar/       # Project milestones and deadlines
│   │   │   ├── chat/           # Direct messaging and project chat rooms
│   │   │   ├── dashboard/      # Role-scoped KPI cards and summaries
│   │   │   ├── departments/    # Department structure and lead assignments
│   │   │   ├── employees/      # Employee directory and CRUD management
│   │   │   ├── kanban/         # Drag-and-drop task execution board
│   │   │   ├── notifications/  # Unread notifications and quick-actions
│   │   │   ├── profile/        # User profile, skills, and password change
│   │   │   ├── projects/       # Project portfolio and detailed views
│   │   │   └── tasks/          # List view with filters, comments, and uploads
│   │   ├── services/           # Axios API client with interceptors
│   │   ├── App.jsx             # Route definitions and RBAC Route Guards
│   │   └── main.jsx            # React root mount
│   └── vite.config.js          # Vite config with API proxy & HMR
│
├── server/                     # Backend API (Express + Node.js)
│   ├── src/
│   │   ├── config/             # DB connection (Atlas + Embedded fallback), Env vars
│   │   ├── controllers/        # Business logic for Auth, Tasks, Projects, Chat, etc.
│   │   ├── middleware/         # Auth guard, RBAC guard, Error handler, Multer
│   │   ├── models/             # 9 Mongoose schemas (User, Task, Project, Log, etc.)
│   │   ├── routes/             # REST endpoint route declarations
│   │   ├── seeds/              # Realistic enterprise mock dataset generator
│   │   ├── services/           # Socket.IO room manager & event broadcaster
│   │   ├── tests/              # Native API test suite
│   │   └── server.js           # Express app bootstrap & HTTP/WS server
│   └── uploads/                # Local storage directory for user attachments
│
├── data/                       # Local disk storage for embedded MongoDB instance
├── DEPLOYMENT.md               # Step-by-step production deployment guide
├── Dockerfile                  # Production container definition
├── docker-compose.yml          # Multi-container orchestration (App + Mongo)
└── package.json                # Root orchestration scripts
```

---

## 🚀 Production Deployment

SphereOps is production-ready and supports multiple deployment architectures:

### Option A: Monolithic / Single-Service (Render, Railway, Fly.io)
The Express server is configured to automatically serve the compiled frontend (`client/dist`) in production:
```bash
# 1. Build the frontend
npm run build

# 2. Start the production server
npm --prefix server start
```

### Option B: Decoupled (Vercel Frontend + Render/Railway Backend)
- **Frontend**: Deploy `client/` to **Vercel** with `VITE_API_URL=https://your-api.onrender.com`.
- **Backend**: Deploy `server/` to **Render** with `MONGO_URI` pointing to MongoDB Atlas.
- Full details are documented in [DEPLOYMENT.md](file:///d:/project/DEPLOYMENT.md).

### Option C: Docker Container
```bash
docker-compose up --build -d
```

---

## 🔮 Roadmap & Future Improvements

- [ ] **Redis Pub/Sub Adapter:** Scale Socket.IO horizontally across multiple server instances using `@socket.io/redis-adapter`.
- [ ] **Cloud Storage Migration:** Add AWS S3 / Cloudinary pre-signed URLs for handling multi-gigabyte file attachments.
- [ ] **OAuth 2.0 Integration:** Add Google Workspace and GitHub SSO authentication.
- [ ] **Export & Reporting:** Generate PDF sprint summaries and CSV payroll/hours reports.

---

## 👤 Author & Connect

**Abdul Lathif** — Full-Stack Software Engineer  
- 📂 **GitHub Repository:** [https://github.com/abdullath-if/sphereops-saas](https://github.com/abdullath-if/sphereops-saas)
- 👨‍💻 **GitHub Profile:** [@abdullath-if](https://github.com/abdullath-if)
- ✉️ **Email:** [abdullathif6382@gmail.com](mailto:abdullathif6382@gmail.com)

*Feedback, suggestions, or questions about the architecture? Feel free to open an issue or reach out directly!*

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
