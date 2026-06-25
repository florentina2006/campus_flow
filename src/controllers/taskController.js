// src/controllers/taskController.js
// All task-related logic. Every route here is PROTECTED — authMiddleware runs first.
// So req.user.id is always available here.

const supabase = require('../config/supabase');
const axios = require('axios');

// ─── GET /api/tasks ───────────────────────────────────────────────────────────
// Returns all tasks belonging to the logged-in user
const getTasks = async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)    // only THIS user's tasks
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ tasks });
  } catch (err) {
    console.error('Get tasks error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// ─── POST /api/tasks ──────────────────────────────────────────────────────────
// Creates a new task AND fires n8n webhook for WhatsApp + Calendar
const createTask = async (req, res) => {
  try {
    const { title, description, deadline, priority } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({ error: 'title and deadline are required' });
    }

    // 1. Insert into Supabase
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        user_id: req.user.id,
        title,
        description: description || '',
        deadline,
        priority: priority || 'medium',  // low | medium | high
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Trigger n8n webhook — this is what sends WhatsApp + adds to Google Calendar
    //    We do this in a try/catch so if n8n fails, the task is still saved
    try {
      await axios.post(`${process.env.N8N_WEBHOOK_URL}/task-created`, {
        taskId: task.id,
        title: task.title,
        deadline: task.deadline,
        userEmail: req.user.email,
      });
    } catch (webhookErr) {
      // Don't crash the main response — just log it
      console.warn('n8n webhook failed (task still saved):', webhookErr.message);
    }

    return res.status(201).json({ message: 'Task created', task });
  } catch (err) {
    console.error('Create task error:', err.message);
    return res.status(500).json({ error: 'Failed to create task' });
  }
};

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
// Updates a task. Only the owner can update their own task.
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, priority, status } = req.body;

    // Security: make sure this task belongs to req.user.id
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Task not found or not yours' });
    }

    // Build update object — only include fields that were actually sent
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (deadline !== undefined) updates.deadline = deadline;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ message: 'Task updated', task });
  } catch (err) {
    console.error('Update task error:', err.message);
    return res.status(500).json({ error: 'Failed to update task' });
  }
};

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Security check — only owner can delete
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Task not found or not yours' });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
