# SphereOps — Enterprise Employee & Project Management SaaS

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-6366f1.svg)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/Node-v20%2B-green.svg)](https://nodejs.org)
[![Vite + React](https://img.shields.io/badge/Frontend-Vite%20%7C%20React%2018-blueviolet.svg)](https://vitejs.dev)
[![Socket.IO](https://img.shields.io/badge/RealTime-Socket.IO-black.svg)](https://socket.io)

**SphereOps** is a production-quality, multi-tenant ready **Employee & Project Management SaaS platform** engineered with the MERN stack. Designed with real-world enterprise workflows in mind, SphereOps provides strict Role-Based Access Control (RBAC), interactive drag-and-drop Kanban execution, team communication, automated audit logging, analytics dashboards with Recharts, and instant real-time sync across connected clients.

---

## 1. System Architecture

```
                                  +---------------------------------------+
                                  |         SphereOps Web Client          |
                                  |   React 18 + Vite + Tailwind CSS      |
                                  |   Recharts + Lucide + Context API     |
                                  +-------------------+-------------------+
                                                      |
                                     HTTP REST APIs   |   WebSockets
                                     & Multipart Data |   (Socket.IO)
                                                      |
                                  +-------------------v-------------------+
                                  |          SphereOps API Server         |
                                  |          Express.js / Node.js         |
                                  |    JWT Authentication & RBAC Guard    |
                                  |    Socket.IO Event Engine & Pub/Sub   |
                                  +---------+-------------------+---------+
                                            |                   |
                         +------------------v---+           +---v------------------+
                         |   MongoDB Cluster    |           |    Local Storage /   |
                         |   (Atlas / Local)    |           |      Cloudinary      |
                         |  Mongoose Schemas    |           |  File Upload Service |
                         +----------------------+           +----------------------+
```

### Key Architectural Tenets
1. **Multi-Role RBAC**: Admin, Manager, and Employee tiers with backend route protection, role filtering, and resource ownership checks.
2. **Real-Time Collaboration**: Real-time Kanban movements, instantaneous chat messages, live notifications, and team online presence.
3. **Resilient Database Layer**: Direct support for local MongoDB and MongoDB Atlas, with zero-config embedded fallback.
4. **Comprehensive Audit Trail**: Every entity creation, assignment, status transition, and comment is logged with actor identification and timestamps.

---

## 2. Core Feature Matrix

| Feature Area | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| **Dashboard Analytics & KPIs** | Full Company Scope | Department/Team Scope | Personal Productivity Scope |
| **Employee Directory** | Full CRUD + Role Assignment | View Team Directory | View Team Directory |
| **Department Management** | Full CRUD + Assign Leads | View Departments | View Departments |
| **Project Portfolio** | Create, Edit, Delete, View | Create, Manage, View | View Assigned Projects |
| **Task Management** | Create, Assign, Edit, Delete | Create, Assign, Edit, Delete | Update Status, Comment, Attach |
| **Interactive Kanban Board** | Drag-and-drop across stages | Drag-and-drop across stages | Drag assigned tasks |
| **Team Chat (Direct & Channels)** | Full Access | Full Access | Full Access |
| **Company Calendar** | Milestones & Deadlines | Milestones & Deadlines | Assigned Deadlines |
| **File Management** | Upload, Download, Delete | Upload, Download, Delete | Upload, Download |
| **Audit Logs & Compliance** | Full Company Stream | Project Stream | Personal Activity |

---

## 3. Tech Stack Details

### Frontend
- **Framework**: React 18 with Vite 6
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v3 with custom SaaS design tokens
- **Data Visualization**: Recharts (Pie/Donut, Velocity Bar Charts, Team Productivity)
- **Icons**: Lucide React
- **Real-Time**: Socket.IO Client
- **Animations & Effects**: Canvas Confetti for celebratory task delivery
- **HTTP Client**: Axios with global interceptors

### Backend
- **Runtime**: Node.js v20+ / v24
- **Web Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) with bcryptjs password hashing
- **WebSockets**: Socket.IO Server with room multiplexing
- **File Handling**: Multer with size/MIME validation and static routing
- **Mailing**: Nodemailer with Ethereal and production SMTP support
- **Rate Limiting**: `express-rate-limit` against brute-force attacks

---

## 4. Database Models & Schema

- **User**: Name, unique lowercase email, bcrypt hashed password, role (`admin` | `manager` | `employee`), department reference, job title/position, phone, avatar, skills array, joining date, status (`active` | `inactive`).
- **Department**: Unique department name, description, assigned department manager reference.
- **Project**: Name, client/company, start date, target end date, status (`planning` | `active` | `on_hold` | `completed`), priority (`low` | `medium` | `high` | `critical`), project manager reference, team members array, budget, technologies stack.
- **Task**: Title, description, project reference, assigned employee reference, created by reference, priority, status (`todo` | `in_progress` | `review` | `completed`), due date, tags, attachments array, sequence order.
- **Comment**: Target type (`project` | `task`), target ID reference, author reference, content text, attachments.
- **Message**: Conversation type (`direct` | `project`), sender reference, recipient reference, project reference, message content, read-by array.
- **Notification**: Recipient reference, sender reference, type (`task_assigned`, `task_completed`, `project_added`, `comment_added`), title, message, link, read flag.
- **ActivityLog**: Actor reference, action code, entity type, entity ID, entity name, human-readable description, metadata object.
- **FileRecord**: Filename, original name, storage path, size in bytes, MIME type, uploader reference, related entity reference.

---

## 5. API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new user account.
- `POST /api/auth/login` — Authenticate credentials and receive Bearer token.
- `GET /api/auth/me` — Retrieve currently authenticated user profile.
- `PUT /api/auth/profile` — Update user details, avatar, skills, position.
- `PUT /api/auth/change-password` — Change user password.
- `POST /api/auth/forgot-password` — Dispatch password reset instructions.
- `POST /api/auth/reset-password/:token` — Verify reset token and set new password.

### Employees (`/api/employees`)
- `GET /api/employees` — Search, filter by department/role/status with pagination.
- `GET /api/employees/:id` — Employee profile with completed/pending task metrics.
- `POST /api/employees` — Admin: Create new employee account.
- `PUT /api/employees/:id` — Admin/Self: Update employee details.
- `DELETE /api/employees/:id` — Admin: Delete employee account.

### Projects (`/api/projects`)
- `GET /api/projects` — Filter by status, priority, manager with calculated completion percentage.
- `GET /api/projects/:id` — Single project overview with tasks, team members, files, and activity.
- `POST /api/projects` — Admin & Manager: Create project and assign members.
- `PUT /api/projects/:id` — Admin & Manager: Update project details.
- `DELETE /api/projects/:id` — Admin & Manager: Delete project and cascade tasks.

### Tasks (`/api/tasks`)
- `GET /api/tasks` — Filter by project, assignee, status, priority, and search.
- `GET /api/tasks/:id` — Detailed task view with comments and attachments.
- `POST /api/tasks` — Create task, assign employee, and trigger real-time notification.
- `PUT /api/tasks/:id` — Update task details.
- `PATCH /api/tasks/:id/status` — Kanban drag-and-drop status update with Socket.IO broadcast.
- `DELETE /api/tasks/:id` — Delete task.

### Team Chat & Notifications
- `GET /api/messages/conversations` — Retrieve active 1-on-1 chats and project channels.
- `GET /api/messages?type=direct&targetId=:id` — Retrieve conversation history.
- `POST /api/messages` — Send message and emit via WebSocket.
- `GET /api/notifications` — Retrieve user notifications and unread counter.
- `PATCH /api/notifications/:id/read` — Mark notification as read.
- `PATCH /api/notifications/read-all` — Mark all notifications as read.

---

## 6. Getting Started & Installation

### Prerequisites
- Node.js v20.x or higher
- npm v10.x or higher
- MongoDB instance (local service or free MongoDB Atlas URI)

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/your-org/sphereops-saas.git
cd sphereops-saas

# 2. Install dependencies
npm run install:all

# 3. Configure server environment
cp server/.env.example server/.env

# 4. Seed demo dataset (Admin, Managers, Employees, Projects, Tasks, Chats)
npm run seed

# 5. Start development servers concurrently (Frontend: 5173, Backend: 5000)
npm run dev
```

### Demo Accounts Seeded Out of the Box
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@company.com` | `Password123!` |
| **Manager** | `manager.sarah@company.com` | `Password123!` |
| **Manager** | `manager.david@company.com` | `Password123!` |
| **Employee** | `marcus.v@company.com` | `Password123!` |
| **Employee** | `elena.r@company.com` | `Password123!` |

---

## 7. Running Automated Tests

Run the integration test suite verifying Auth, RBAC, Employee CRUD, Project CRUD, and Kanban status transitions:
```bash
npm test
```

---

## 8. Production Deployment

### Frontend (e.g. Vercel, Netlify)
```bash
cd client
npm run build
# Deploy 'dist' folder with environment variable VITE_API_URL pointing to production backend
```

### Backend (e.g. Render, Railway, DigitalOcean App Platform)
```bash
cd server
npm start
# Configure PORT, MONGO_URI (MongoDB Atlas), JWT_SECRET, and CLIENT_URL
```

---

## 9. License
MIT License. Built for enterprise workplace management.
