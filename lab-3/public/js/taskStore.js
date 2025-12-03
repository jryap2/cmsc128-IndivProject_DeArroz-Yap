// js/taskStore.js
import * as api from './api.js';

// --- STATE ---
// We keep separate arrays for UI rendering, but populate them from one source
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

// --- API-SYNCED FUNCTIONS (Replaces loadTasks/saveTasks) ---

export async function loadTasks(userId) {
  currentUserId = userId;
  try {
    const data = await api.getTasks(userId);
    // Data now comes back as { tasks: [...] } containing everything
    distributeTasks(data.tasks);
  } catch (error) {
    console.error("Failed to load tasks:", error);
    tasks = []; completed_tasks = []; deleted_tasks = [];
  }
}

// saveTasks() function is now fully removed!

export async function addTask(taskData) {
  try {
    const taskWithUser = { ...taskData, userId: currentUserId, status: 'inbox' };
    const savedTask = await api.createTask(taskWithUser);
    tasks.push(savedTask); // Add to local state immediately
  } catch (err) { console.error(err); }
}

export async function updateTask(index, updates) {
  // Logic: Find the task in the 'inbox' array by index (This is for content updates)
  const task = tasks[index];
  if (!task || !task._id) return;
  
  // Optimistic UI update (update local first)
  const oldData = { ...tasks[index] };
  tasks[index] = { ...task, ...updates };

  try {
    await api.updateTask(task._id, updates);
  } catch (err) {
    tasks[index] = oldData; // Revert on error
    console.error(err);
  }
}

// --- STATUS CHANGE FUNCTIONS (Update via API) ---

export async function completeTask(index) {
  const task = tasks[index];
  if (!task || !task._id) return;

  // Local move
  tasks.splice(index, 1);
  task.status = 'completed';
  completed_tasks.unshift(task);

  // Sync: Change status on DB
  try {
    await api.updateTask(task._id, { status: 'completed' });
  } catch (err) { console.error(err); }
}

export async function deleteTask(index, fromCompleted = false) {
  const sourceList = fromCompleted ? completed_tasks : tasks;
  const task = sourceList[index];
  if (!task || !task._id) return;

  // Local move
  sourceList.splice(index, 1);
  task.status = 'deleted';
  deleted_tasks.unshift(task);

  // Sync: Change status on DB
  try {
    await api.updateTask(task._id, { status: 'deleted' });
  } catch (err) { console.error(err); }
}

export async function restoreTask(index) {
  const task = deleted_tasks[index];
  if (!task || !task._id) return;

  // Local move
  deleted_tasks.splice(index, 1);
  task.status = 'inbox';
  tasks.push(task);

  // Sync: Change status on DB
  try {
    await api.updateTask(task._id, { status: 'inbox' });
  } catch (err) { console.error(err); }
}

export async function permanentlyDeleteTask(index) {
  const task = deleted_tasks[index];
  if (!task || !task._id) return;

  deleted_tasks.splice(index, 1); // Remove locally
  
  try {
    // Permanent deletion from DB
    await api.deleteTask(task._id); 
  } catch (err) { console.error(err); }
}