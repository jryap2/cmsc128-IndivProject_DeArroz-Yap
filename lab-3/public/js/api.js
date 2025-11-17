// js/api.js
// This file handles all communication with your backend server.

const BASE_URL = "/api"; 

async function fetchApi(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }
    
    return data;
  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
}

// --- USER API ---

export function signup(name, email, password) {
  return fetchApi("/users/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email, password) {
  return fetchApi("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function updateProfile(userId, name, password) {
  const body = {};
  if (name) body.name = name;
  if (password) body.password = password;

  return fetchApi(`/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function checkEmail(email) {
  return fetchApi("/users/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(email, password) {
  return fetchApi("/users/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}


// --- TASK API (MODIFIED) ---

export function getTasks(userId) {
  let endpoint = `/tasks/${userId}`;
  return fetchApi(endpoint);
}

export function saveTasks(userId, tasks, completed_tasks, deleted_tasks) {
  return fetchApi(`/tasks/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // No listId
      tasks,
      completed_tasks,
      deleted_tasks
    }),
  });
}

