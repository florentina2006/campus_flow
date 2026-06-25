// src/routes/taskRoutes.js
// authMiddleware is applied to ALL routes in this file.

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');

// All task routes require a valid JWT
router.use(authMiddleware);

// GET  /api/tasks        → get all tasks for logged-in user
// POST /api/tasks        → create a new task
router.get('/', getTasks);
router.post('/', createTask);

// PUT    /api/tasks/:id  → update task by id
// DELETE /api/tasks/:id  → delete task by id
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
