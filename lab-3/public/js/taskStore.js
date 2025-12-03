// js/taskStore.js
import * as api from './api.js';

// --- STATE ---
export let tasks = [];
export let completed_tasks = [];
export let deleted_tasks = [];
let currentUserId = null;

// --- HELPERS ---
function distributeTasks(allTasks) {
  // Distributes the tasks fetched from the unified backend schema
  tasks = allTasks.filter(t => t.status === 'inbox');
  completed_tasks = allTasks.filter(t => t.status === 'completed');
  deleted_tasks = allTasks.filter(t => t.status === 'deleted');
}

// --- API-SYNCED FUNCTIONS ---

export async function loadTasks(userId) {
  currentUserId = userId;
  try {
    const data = await api.getTasks(userId);
    // Data now comes back as { tasks: [...] }
    distributeTasks(data.tasks || []);
  } catch (error) {
    console.error("Failed to load tasks:", error);
    tasks = []; completed_tasks = []; deleted_tasks = [];
  }
}

export async function addTask(taskData) {
  try {
    const taskWithUser = { ...taskData, userId: currentUserId, status: 'inbox' };
    const savedTask = await api.createTask(taskWithUser);
    // FIX: Push to bottom
    tasks.push(savedTask); 
  } catch (err) { console.error(err); }
}

export async function updateTask(index, updates) {
  const task = tasks[index];
  if (!task || !task._id) return;
  
  // Optimistic UI update
  const oldData = { ...tasks[index] };
  tasks[index] = { ...task, ...updates };

  try {
    await api.updateTask(task._id, updates);
  } catch (err) {
    tasks[index] = oldData;
    console.error(err);
  }
}

// --- STATUS CHANGE FUNCTIONS ---

export async function completeTask(index) {
  const task = tasks[index];
  if (!task || !task._id) return;

  tasks.splice(index, 1);
  task.status = 'completed';
  completed_tasks.unshift(task);

  try {
    await api.updateTask(task._id, { status: 'completed' });
  } catch (err) { console.error(err); }
}

export async function revertTask(index) {
  const task = completed_tasks[index];
  if (!task || !task._id) return;

  completed_tasks.splice(index, 1);
  task.status = 'inbox';
  tasks.push(task); // Add back to Inbox (Bottom)

  try {
    await api.updateTask(task._id, { status: 'inbox' });
  } catch (err) { console.error(err); }
}

export async function deleteTask(index, fromCompleted = false) {
  const sourceList = fromCompleted ? completed_tasks : tasks;
  const task = sourceList[index];
  if (!task || !task._id) return;

  sourceList.splice(index, 1);
  task.status = 'deleted';
  deleted_tasks.unshift(task);

  try {
    await api.updateTask(task._id, { status: 'deleted' });
  } catch (err) { console.error(err); }
}

export async function restoreTask(index) {
  const task = deleted_tasks[index];
  if (!task || !task._id) return;

  deleted_tasks.splice(index, 1);
  task.status = 'inbox';
  
  // FIX: Push to bottom matches addTask behavior
  tasks.push(task);

  try {
    await api.updateTask(task._id, { status: 'inbox' });
  } catch (err) { console.error(err); }
}

export async function permanentlyDeleteTask(index) {
  const task = deleted_tasks[index];
  if (!task || !task._id) return;

  deleted_tasks.splice(index, 1);
  
  try {
    await api.deleteTask(task._id); 
  } catch (err) { console.error(err); }
}