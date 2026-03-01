const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;
const WORKSPACE = process.env.WORKSPACE_DIR || path.join(process.env.HOME || '/home/nina', '.openclaw', 'workspace');
const DATA_DIR = path.join(__dirname, 'data');
const VALID_DEPARTMENTS = ['operations', 'it', 'it-branding', 'finance', 'hr', 'marketing-sales'];
const DEPT_PATHS = {
  'operations': 'operations',
  'it': 'it',
  'it-branding': 'it/branding',
  'finance': 'finance',
  'hr': 'hr',
  'marketing-sales': 'marketing-sales',
};
const SUBTASK_STATUSES = new Set(['pending', 'in-progress', 'done']);

app.use(cors());
app.use(express.json());

// ─── Auth middleware for Express API ───────────────────────────────
const API_PASSWORD = process.env.DASH_PASSWORD || 'polly2026!';
app.use('/api', (req, res, next) => {
  // Check Bearer token or x-api-key header
  const auth = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  if (apiKey === API_PASSWORD || (auth && auth === `Bearer ${API_PASSWORD}`)) {
    return next();
  }
  // Also allow if dash_session cookie is valid (for browser requests proxied here)
  const cookie = req.headers.cookie || '';
  const sessionMatch = cookie.match(/dash_session=([^;]+)/);
  if (sessionMatch) {
    // Validate session token
    let hash = 0;
    const str = `dash_${API_PASSWORD}_session`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    if (sessionMatch[1] === `s_${Math.abs(hash).toString(36)}`) {
      return next();
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
});

// ─── Helpers ───────────────────────────────────────────────────────
function getDeptPath(dept) { return DEPT_PATHS[dept] || dept; }

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')); }
  catch { return null; }
}

function writeJSON(file, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

function sanitizeSubtasksInput(subtasks, taskId = 'sub') {
  if (!Array.isArray(subtasks)) return [];
  return subtasks
    .map((subtask, index) => {
      if (!subtask || typeof subtask.title !== 'string') return null;
      const title = subtask.title.trim();
      if (!title) return null;
      let id = subtask.id;
      if (typeof id !== 'string' || !id.trim()) {
        id = `${taskId}-sub-${Date.now().toString(36)}-${index}`;
      } else {
        id = id.trim();
      }
      const status = SUBTASK_STATUSES.has(subtask.status) ? subtask.status : 'pending';
      return { id, title, status };
    })
    .filter(Boolean);
}

function ensureSubtaskArray(task) {
  if (!task) return;
  if (!Array.isArray(task.subtasks)) task.subtasks = [];
}

// ─── File Upload ───────────────────────────────────────────────────
function getUploader(dept) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(WORKSPACE, 'departments', getDeptPath(dept), 'uploads');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, safe);
    },
  });
  return multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
}

app.post('/api/upload/:dept', (req, res) => {
  const { dept } = req.params;
  if (!VALID_DEPARTMENTS.includes(dept)) return res.status(400).json({ error: 'Invalid department' });
  const uploader = getUploader(dept);
  uploader.single('file')(req, res, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    res.json({ success: true, file: { name: req.file.filename, size: req.file.size, department: dept, uploadedAt: new Date().toISOString() } });
  });
});

app.get('/api/files/:dept', (req, res) => {
  const { dept } = req.params;
  if (!VALID_DEPARTMENTS.includes(dept)) return res.status(400).json({ error: 'Invalid department' });
  const dir = path.join(WORKSPACE, 'departments', getDeptPath(dept), 'uploads');
  try {
    const entries = fs.readdirSync(dir).filter(n => !n.startsWith('.'));
    const files = entries.map(name => {
      const stats = fs.statSync(path.join(dir, name));
      return { name, size: stats.size, uploadedAt: stats.mtime.toISOString(), type: path.extname(name).slice(1) || 'unknown' };
    }).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.json({ department: dept, files });
  } catch { res.json({ department: dept, files: [] }); }
});

app.delete('/api/files/:dept/:filename', (req, res) => {
  const { dept, filename } = req.params;
  if (!VALID_DEPARTMENTS.includes(dept)) return res.status(400).json({ error: 'Invalid department' });
  const filePath = path.join(WORKSPACE, 'departments', getDeptPath(dept), 'uploads', filename);
  try { fs.unlinkSync(filePath); res.json({ success: true }); }
  catch { res.status(404).json({ error: 'File not found' }); }
});

// ─── Tasks API ─────────────────────────────────────────────────────
app.get('/api/tasks', (_req, res) => {
  const data = readJSON('tasks.json') || { tasks: [], nextId: 1 };
  const tasks = (data.tasks || []).map(task => ({
    ...task,
    subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
  }));
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const data = readJSON('tasks.json') || { tasks: [], nextId: 1 };
  const task = {
    id: `TASK-${String(data.nextId).padStart(3, '0')}`,
    title: req.body.title || 'Untitled Task',
    description: req.body.description || '',
    agent: req.body.agent || 'unassigned',
    status: req.body.status || 'backlog',
    priority: req.body.priority || 'medium',
    department: req.body.department || '',
    deadline: req.body.deadline || null,
    estimatedCost: req.body.estimatedCost || null,
    actualCost: req.body.actualCost || null,
    instructions: req.body.instructions || '',
    deliverable: req.body.deliverable || '',
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  task.subtasks = sanitizeSubtasksInput(req.body.subtasks, task.id);
  data.tasks.push(task);
  data.nextId++;
  writeJSON('tasks.json', data);
  res.json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const data = readJSON('tasks.json') || { tasks: [], nextId: 1 };
  const idx = data.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  const allowed = ['title', 'description', 'agent', 'status', 'priority', 'department', 'deadline', 'estimatedCost', 'actualCost', 'instructions', 'deliverable'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) data.tasks[idx][key] = req.body[key];
  }
  if (req.body.subtasks !== undefined) {
    data.tasks[idx].subtasks = sanitizeSubtasksInput(req.body.subtasks, data.tasks[idx].id);
  }
  data.tasks[idx].updatedAt = new Date().toISOString();
  writeJSON('tasks.json', data);
  res.json(data.tasks[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const data = readJSON('tasks.json') || { tasks: [], nextId: 1 };
  data.tasks = data.tasks.filter(t => t.id !== req.params.id);
  writeJSON('tasks.json', data);
  res.json({ success: true });
});

// Subtasks
app.post('/api/tasks/:id/subtasks', (req, res) => {
  const data = readJSON('tasks.json') || { tasks: [], nextId: 1 };
  const task = data.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  ensureSubtaskArray(task);
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Subtask title is required' });
  const status = SUBTASK_STATUSES.has(req.body.status) ? req.body.status : 'pending';
  const subtask = {
    id: `${task.id}-sub-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    title,
    status,
  };
  task.subtasks.push(subtask);
  task.updatedAt = new Date().toISOString();
  writeJSON('tasks.json', data);
  res.json(subtask);
});

app.patch('/api/tasks/:id/subtasks/:subtaskId', (req, res) => {
  const data = readJSON('tasks.json') || { tasks: [], nextId: 1 };
  const task = data.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  ensureSubtaskArray(task);
  const subtask = task.subtasks.find(st => st.id === req.params.subtaskId);
  if (!subtask) return res.status(404).json({ error: 'Subtask not found' });
  let updated = false;
  if (req.body.title !== undefined) {
    const title = req.body.title.trim();
    if (!title) return res.status(400).json({ error: 'Subtask title is required' });
    subtask.title = title;
    updated = true;
  }
  if (req.body.status !== undefined) {
    if (!SUBTASK_STATUSES.has(req.body.status)) return res.status(400).json({ error: 'Invalid subtask status' });
    subtask.status = req.body.status;
    updated = true;
  }
  if (!updated) return res.status(400).json({ error: 'No fields to update' });
  task.updatedAt = new Date().toISOString();
  writeJSON('tasks.json', data);
  res.json(subtask);
});

// Task comments
app.post('/api/tasks/:id/comments', (req, res) => {
  const data = readJSON('tasks.json') || { tasks: [], nextId: 1 };
  const task = data.tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const comment = {
    id: Date.now().toString(36),
    author: req.body.author || 'Unknown',
    text: req.body.text || '',
    createdAt: new Date().toISOString(),
  };
  task.comments.push(comment);
  task.updatedAt = new Date().toISOString();
  writeJSON('tasks.json', data);
  res.json(comment);
});

// ─── Budget API ────────────────────────────────────────────────────
app.get('/api/budget', (_req, res) => {
  const data = readJSON('budget.json') || { monthlyBudget: 200, entries: [], modelRates: {} };
  // Calculate totals
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEntries = data.entries.filter(e => new Date(e.date) >= monthStart);
  const totalSpend = monthEntries.reduce((sum, e) => sum + (e.cost || 0), 0);
  const byModel = {};
  const byAgent = {};
  for (const e of monthEntries) {
    byModel[e.model] = (byModel[e.model] || 0) + (e.cost || 0);
    byAgent[e.agent] = (byAgent[e.agent] || 0) + (e.cost || 0);
  }
  res.json({
    monthlyBudget: data.monthlyBudget,
    totalSpend: Math.round(totalSpend * 100) / 100,
    remaining: Math.round((data.monthlyBudget - totalSpend) * 100) / 100,
    percentUsed: Math.round((totalSpend / data.monthlyBudget) * 100),
    byModel,
    byAgent,
    entries: monthEntries.slice(-20),
    modelRates: data.modelRates,
  });
});

app.post('/api/budget/entry', (req, res) => {
  const data = readJSON('budget.json') || { monthlyBudget: 200, entries: [], modelRates: {} };
  const entry = {
    id: Date.now().toString(36),
    date: req.body.date || new Date().toISOString(),
    model: req.body.model || '',
    agent: req.body.agent || 'polly',
    tokensIn: req.body.tokensIn || 0,
    tokensOut: req.body.tokensOut || 0,
    cost: req.body.cost || 0,
    task: req.body.task || '',
    note: req.body.note || '',
  };
  data.entries.push(entry);
  writeJSON('budget.json', data);
  res.json(entry);
});

// ─── Org Chart API ─────────────────────────────────────────────────
app.get('/api/org', (_req, res) => {
  res.json({
    org: [
      { id: 'nina', name: 'Nina Bond', role: 'CEO', emoji: '👩‍💼', model: null, status: 'active', parent: null },
      { id: 'polly', name: 'Polly', role: 'COO (Orchestrator)', emoji: '🦜', model: 'anthropic/claude-opus-4-6', status: 'active', parent: 'nina', tier: 1 },
      { id: 'ops', name: 'Ops Agent', role: 'Operations', emoji: '📋', model: 'openai/gpt-5.1-codex', status: 'ready', parent: 'polly', tier: 2 },
      { id: 'dev', name: 'Dev Agent', role: 'Developer', emoji: '🛠️', model: 'openai/gpt-5.1-codex', status: 'ready', parent: 'polly', tier: 2 },
      { id: 'it', name: 'IT Agent', role: 'CTO / Code Review', emoji: '💻', model: 'openai/gpt-5.1-codex', status: 'planned', parent: 'polly', tier: 2 },
      { id: 'finance', name: 'Finance Agent', role: 'Finance', emoji: '💰', model: 'openai/gpt-5.1-codex', status: 'planned', parent: 'polly', tier: 2 },
      { id: 'hr', name: 'HR Agent', role: 'HR', emoji: '👥', model: 'google/gemini-3-pro-preview', status: 'planned', parent: 'polly', tier: 3 },
      { id: 'mkt', name: 'Marketing & Sales Agent', role: 'Marketing & Sales', emoji: '📢', model: 'google/gemini-3-pro-preview', status: 'planned', parent: 'polly', tier: 3 },
    ]
  });
});

// ─── Static files ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦜 Polly-Dash running at http://localhost:${PORT}`);
});
