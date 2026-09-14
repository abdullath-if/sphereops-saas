process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { app, server } = require('../server');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Department = require('../models/Department');

let baseUrl = '';
let testServer = null;
let adminToken = '';
let employeeToken = '';
let createdEmployeeId = '';
let createdProjectId = '';
let createdTaskId = '';

test.before(async () => {
  await connectDB();

  // Clean test tables
  await User.deleteMany({ email: /@test-suite\.com/ });
  await Project.deleteMany({ name: /Test Project/ });
  await Task.deleteMany({ title: /Test Task/ });

  // Start test server on random free port
  await new Promise((resolve) => {
    testServer = server.listen(0, () => {
      const port = testServer.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  if (testServer) {
    await new Promise((resolve) => testServer.close(resolve));
  }
  await disconnectDB();
});

test('POST /api/auth/register - Register Admin User', async () => {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Admin Tester',
      email: 'admin@test-suite.com',
      password: 'Password123!',
      role: 'admin',
      position: 'Director of Testing',
    }),
  });

  const body = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.success, true);
  assert.ok(body.data.token);
  assert.strictEqual(body.data.user.email, 'admin@test-suite.com');
  adminToken = body.data.token;
});

test('POST /api/auth/login - Login with valid credentials', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@test-suite.com',
      password: 'Password123!',
    }),
  });

  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.success, true);
  assert.ok(body.data.token);
});

test('GET /api/auth/me - Verify JWT Authentication', async () => {
  const res = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.data.user.email, 'admin@test-suite.com');
  assert.strictEqual(body.data.user.role, 'admin');
});

test('POST /api/employees - Admin can create an Employee', async () => {
  const res = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Employee Tester',
      email: 'employee@test-suite.com',
      password: 'Password123!',
      role: 'employee',
      position: 'Junior Developer',
    }),
  });

  const body = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.data.employee.email, 'employee@test-suite.com');
  createdEmployeeId = body.data.employee._id;
});

test('Employee login and RBAC authorization verification', async () => {
  // Login as employee
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'employee@test-suite.com',
      password: 'Password123!',
    }),
  });

  const loginBody = await loginRes.json();
  employeeToken = loginBody.data.token;

  // Attempt to perform Admin-only action (create another employee)
  const forbiddenRes = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${employeeToken}`,
    },
    body: JSON.stringify({
      name: 'Hacker',
      email: 'hacker@test-suite.com',
      password: 'Password123!',
    }),
  });

  assert.strictEqual(forbiddenRes.status, 403);
});

test('POST /api/projects - Create a Project', async () => {
  const res = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Test Project Alpha',
      description: 'Integration test project',
      client: 'Acme Test Corp',
      status: 'active',
      priority: 'high',
      budget: 50000,
      members: [createdEmployeeId],
    }),
  });

  const body = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.data.project.name, 'Test Project Alpha');
  createdProjectId = body.data.project._id;
});

test('POST /api/tasks - Create and Assign a Task', async () => {
  const res = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: 'Test Task One',
      description: 'Verify task creation pipeline',
      project: createdProjectId,
      assignedTo: createdEmployeeId,
      priority: 'medium',
      status: 'todo',
    }),
  });

  const body = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.data.task.title, 'Test Task One');
  createdTaskId = body.data.task._id;
});

test('PATCH /api/tasks/:id/status - Update Task Status (Kanban Drop)', async () => {
  const res = await fetch(`${baseUrl}/tasks/${createdTaskId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${employeeToken}`,
    },
    body: JSON.stringify({
      status: 'in_progress',
      order: 1,
    }),
  });

  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.data.task.status, 'in_progress');
});

test('GET /api/analytics/dashboard - Fetch Dashboard Metrics', async () => {
  const res = await fetch(`${baseUrl}/analytics/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(body.data.overview.totalEmployees >= 2);
  assert.ok(body.data.overview.totalProjects >= 1);
  assert.ok(body.data.charts.projectStatus);
  assert.ok(body.data.charts.taskStatus);
});
