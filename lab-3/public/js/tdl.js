// js/tdl.js

import { getCurrentUser, logout } from './auth.js';
import * as store from './taskStore.js';
import {
  initUI,
  setCurrentSection,
  renderCurrentSection,
  exitSelectionMode
} from './ui.js';

let currentUser = null;

// --- MAIN INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.body.classList.contains('tdl-page')) return;

  // 1. Check Login - redirect if not authenticated
  currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.replace('index.html'); // Changed: use replace
    return;
  }

  // 2. Load PERSONAL tasks by default
  await store.loadTasks(currentUser._id);

  // 3. Init UI
  initUI();

  // 4. Add Page Listeners
  setupNavListeners();
  document.querySelector('.logout-btn')?.addEventListener('click', logout);

  // 6. Initial Render
  showSection('inbox');
});

function setupNavListeners() {
  const menuItems = document.querySelectorAll('.menu-content li a');
  menuItems.forEach(item => {
    item.addEventListener('click', async e => {
      e.preventDefault();
      const targetId = item.getAttribute('data-target');
      
      if (targetId === 'collaborative-lists') {
        alert("Collaborative features are not implemented yet.");
        return;
      }

      menuItems.forEach(mi => mi.parentElement.classList.remove('active'));
      item.parentElement.classList.add('active');
      await showSection(targetId);
    });
  });
}

async function showSection(id) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.hidden = true;
    sec.classList.remove('active');
  });

  // Show the target section
  const target = document.getElementById(id);
  if (target) {
    target.hidden = false;
    target.classList.add('active');
  }

  setCurrentSection(id);
  exitSelectionMode();

  // Call the correct render/load function
  if (id === 'inbox') {
    await store.loadTasks(currentUser._id);
    renderCurrentSection(id);
  } else if (id === 'completed-tasks' || id === 'deleted-tasks') {
    renderCurrentSection(id);
  } else if (id === 'profile') {
    loadProfileData();
  } else {
    await store.loadTasks(currentUser._id);
    renderCurrentSection('inbox');
  }
}

function loadProfileData() {
  const user = getCurrentUser();
  if (!user) return;
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  if (nameInput) nameInput.value = user.name || '';
  if (emailInput) emailInput.value = user.email || '';
}

document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', () => {
    const target = link.dataset.target;
    document.body.classList.toggle("profile-view", target === "profile");
  });
});
