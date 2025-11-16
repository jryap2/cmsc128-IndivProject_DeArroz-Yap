// js/taskStore.js
import * as api from './api.js';

// --- STATE ---
export let tasks = [];
export let completed_tasks = [];
export let deleted_tasks = [];
let currentUserId = null;
// No currentListId

// --- API-SYNCED FUNCTIONS ---

export async function loadTasks(userId) {
  currentUserId = userId;
  try {
    const data = await api.getTasks(userId); // No listId
    tasks = data.tasks || [];
    completed_tasks = data.completed_tasks || [];
    deleted_tasks = data.deleted_tasks || [];
  } catch (error) {
    console.error("Failed to load tasks:", error);
    tasks = [];
    completed_tasks = [];
    deleted_tasks = [];
  }
}

export async function saveTasks() {
  if (!currentUserId) return;
  try {
    await api.saveTasks(
      currentUserId,
      // No listId
      tasks,
      completed_tasks,
      deleted_tasks
    );
  } catch (error) {
    console.error("Failed to save tasks:", error);
  }
}

// --- LOCAL STATE FUNCTIONS ---

export function addTask(task) {
  tasks.push(task);
}

export function updateTask(index, task) {
  if (index >= 0 && index < tasks.length) {
    tasks[index] = task;
  }
}

export function completeTask(index) {
  if (index < 0 || index >= tasks.length) return;
  const task = tasks.splice(index, 1)[0]; 
  completed_tasks.push(task); 
}

export function deleteTask(index, fromCompleted = false) {
  const source = fromCompleted ? completed_tasks : tasks;
  if (index < 0 || index >= source.length) return;

  const task = source.splice(index, 1)[0]; 
  deleted_tasks.push(task); 
}

export function restoreTask(index) {
  if (index < 0 || index >= deleted_tasks.length) return;
  const task = deleted_tasks.splice(index, 1)[0];
  tasks.push(task);
}

export function permanentlyDeleteTask(index) {
  if (index < 0 || index >= deleted_tasks.length) return;
  deleted_tasks.splice(index, 1);
}