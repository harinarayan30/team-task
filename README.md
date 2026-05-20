# Ethara - Premium Full-Stack Team Task Manager

Ethara is a high-fidelity, premium, full-stack collaborative project and task management web application. Designed around a dark glassmorphic aesthetic, it enables organizations to coordinate teams, manage workspaces, build interactive Kanban task boards, and review overall productivity analytics with strict **Role-Based Access Control (RBAC)**.

Built as a single-service Node.js monorepo, it deploys effortlessly to hosting platforms like **Railway** using a single port while serving static compiled React assets directly from an Express server, ensuring zero CORS friction and rapid startup.

---

## 🚀 Key Features

* **Secure Authentication**: Register and log in securely via JSON Web Tokens (JWT) and auto-salted password hashing (`bcryptjs`).
* **Relational Workspaces**: Create project directories where leads can build teams by inviting members using email and revoking access instantly.
* **Interactive Kanban Board**: Coordinate task queues categorized into **To Do**, **In Progress**, **In Review**, and **Completed** columns, complete with priority badges, assignment indicators, and overdue markers.
* **Strict Role-Based Access Control (RBAC)**:
  * **Admins**: Cross-project visibility, complete project and task creation/updates/deletes.
  * **Project Leads (Owners)**: Workspace configuration, full task control, and team management (invite/remove).
  * **Task Assignees**: Modify task attributes and status.
  * **General Members**: Exclusively restricted to moving/updating task status column states (prevented from renaming, reassigning, editing description, or deleting tasks).
* **Analytics Dashboard**: Review project rosters, overdue counts, cross-project workload distributions, personal completion rates, and upcoming task queues.
* **Premium Glassmorphic Aesthetics**: Modern dark slate scheme using pure HSL Vanilla CSS, custom scrollbars, micro-interactions, responsive flex/grid layouts, and fluid transitions.

---

## 🛠️ Technology Stack

* **Frontend**: React.js (v18.3), Vite, Premium Vanilla CSS, context API states, native SVG paths.
* **Backend**: Node.js, Express, Mongoose ODM.
* **Database**: MongoDB (Atlas cloud connection or local server).
* **Security**: JWT tokens, HTTP Header Guards, password salt-hashing.

---

## ⚙️ Quick Local Setup

Follow these simple steps to run Ethara locally on your machine:

### Prerequisites
* Node.js (v18 or higher recommended)
* MongoDB (installed locally or an Atlas connection string)

### 1. Clone & Install Dependencies
From the project root folder, execute our pre-configured installer script which downloads packages for the root, backend, and frontend at once:
```bash
npm run install-all
```

### 2. Configure Environment Variables
Create a `.env` file inside the `backend` folder:
```ini
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ethara
JWT_SECRET=ethara_secret_key_12345_67890
```

### 3. Start Development Servers
Start both the backend server (using hot-reload watch) and the frontend Vite server concurrently with a single command:
```bash
npm run dev
```
* **Frontend Dev Url**: `http://localhost:5173` (requests automatically proxy to backend on port 5000)
* **Backend Server**: `http://localhost:5000`

---

## 📊 Database Validation & Schema Models

Connected via Mongoose, the database maintains strict validation rules and references representing relationships:

### 1. User Model (`User.js`)
| Field | Type | Validation / Description |
| :--- | :--- | :--- |
| `name` | String | Required, trimmed whitespace |
| `email` | String | Required, unique, lowercase, trimmed, validated via Regex format |
| `password` | String | Required, min-length 6, encrypted using `bcryptjs` salt rounds on save |
| `role` | String | Enum: `['Admin', 'Member']`, default is `Member` |
| `createdAt` | Date | Auto-populated to creation time |

### 2. Project Model (`Project.js`)
| Field | Type | Validation / Description |
| :--- | :--- | :--- |
| `name` | String | Required, trimmed, max-length 50 characters |
| `description`| String | Trimmed whitespace |
| `owner` | ObjectId | Reference to `User` model, required |
| `members` | Array | Array of ObjectIds referencing `User` model |
| `createdAt` | Date | Auto-populated to creation time |

### 3. Task Model (`Task.js`)
| Field | Type | Validation / Description |
| :--- | :--- | :--- |
| `project` | ObjectId | Reference to `Project` model, required |
| `title` | String | Required, trimmed, max-length 100 characters |
| `description`| String | Trimmed whitespace |
| `status` | String | Enum: `['To Do', 'In Progress', 'In Review', 'Completed']`, default: `To Do` |
| `priority` | String | Enum: `['Low', 'Medium', 'High']`, default: `Medium` |
| `assignee` | ObjectId | Reference to `User` model, nullable |
| `dueDate` | Date | Date timestamp, nullable |
| `createdAt` | Date | Auto-populated to creation time |

---

## 🔒 Role-Based Access Control (RBAC) Permissions Grid

| Action | Admin | Project Owner (Lead) | Task Assignee | General Project Member |
| :--- | :---: | :---: | :---: | :---: |
| **Delete Project** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Update Project Info** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Invite / Remove Team Members** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Create Task** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Delete Task** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Modify Title, Desc, Assignee, Date** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Locked |
| **Modify Task Status Column** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

*Note: On signup, users select their role. To facilitate effortless initial testing, the application automatically promotes the very first registered user in the database to **Admin** status.*

---

## 🌐 REST API Endpoints Guide

All API requests (except login/signup) require a valid token header: `Authorization: Bearer <JWT_TOKEN>`.

### 🔑 Authentication API `/api/auth`
* `POST /signup` - Register a new account.
  * *Request Body*: `{ "name": "...", "email": "...", "password": "...", "role": "Member" }`
* `POST /login` - Verify credentials and return active token.
  * *Request Body*: `{ "email": "...", "password": "..." }`
* `GET /me` - Retrieve current session context.
* `GET /users` - Get list of users inside the directory.

### 📁 Projects API `/api/projects`
* `GET /` - Retrieve all projects the user is authorized to see.
* `POST /` - Create a new project (caller sets as owner and default member).
  * *Request Body*: `{ "name": "Project Name", "description": "Description details..." }`
* `GET /:id` - Get detailed project information populated with members list and active tasks.
* `PUT /:id` - Edit project metadata *(restricted)*.
* `DELETE /:id` - Terminate project and delete all nested tasks *(restricted)*.
* `POST /:id/members` - Invite a user to the team roster by email *(restricted)*.
  * *Request Body*: `{ "email": "member@company.com" }`
* `DELETE /:id/members/:userId` - Revoke membership and unassign associated tasks *(restricted)*.

### 📋 Tasks API `/api/tasks`
* `POST /projects/:id/tasks` - Create a task in the project.
  * *Request Body*: `{ "title": "...", "description": "...", "status": "To Do", "priority": "Medium", "assignee": "assigneeUserId", "dueDate": "yyyy-MM-dd" }`
* `PUT /:id` - Edit task characteristics *(restricted: general members can only submit status changes)*.
* `DELETE /:id` - Permanently delete a task *(restricted)*.

### 📊 Dashboard API `/api/dashboard`
* `GET /stats` - Retrieve compiled workloads, overdue counts, my tasks list, and status counts.

---

## ☁️ Railway Deployment Guide

This repository is optimized to deploy as a unified monorepo on **Railway** with a single dyno service.

### Step 1: Push Code to GitHub
Initialize a git repository in your project root, add files, commit, and push them to a private/public GitHub repository.
```bash
git init
git add .
git commit -m "feat: initial premium release of Ethara"
# Push to your GitHub repo
```

### Step 2: Create Service on Railway
1. Log in to [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo** -> Select your repo.
3. Add a plugin database: Click **New** -> **Database** -> **MongoDB** to automatically provision a database service.

### Step 3: Configure Environment Variables on Railway
Select your GitHub repository service inside the Railway dashboard, navigate to **Variables**, and configure:
1. `MONGODB_URI`: Set to `${{MongoDB.MONGODB_URL}}` (Railway automatically interpolates the provisioned database URL).
2. `JWT_SECRET`: Input a long, random key.
3. `PORT`: Set to `5000` (or leave blank; Railway auto-assigns dynamic ports).
4. `NODE_ENV`: Set to `production` (this triggers the backend to compile, host, and serve static assets inside `frontend/dist` automatically!).

### Step 4: Configure Start Script
Railway automatically detects Node.js and executes:
1. `npm run build` (Builds Vite React compiled bundle into `frontend/dist` in 1 second).
2. `npm start` (Starts backend Express server serving both the REST API and the index.html page).

Your application will go live, and you will receive a public URL to access the system immediately!
