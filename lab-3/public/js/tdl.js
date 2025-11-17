// js/tdl.js
import { getCurrentUser, logout } from './auth.js';
import * as store from './taskStore.js';
import { 
  initUI, 
  setCurrentSection, 
  renderCurrentSection, 
  exitSelectionMode
} from './ui.js';
// All collab imports are gone

let currentUser = null;

// --- MAIN INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  if (!document.body.classList.contains('tdl-page')) return;

  // 1. Check Login
  currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'index.html';
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
  showSection('inbox'); // Show personal TDL by default
});

function setupNavListeners() {
  const menuItems = document.querySelectorAll('.menu-content li a');
  menuItems.forEach(item => {
    item.addEventListener('click', async e => {
      e.preventDefault();
      
      // Stop if clicking collab
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
  if (id === 'profile') {
    // This is just a section, not a new page
  }
  
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
    // Load personal tasks
    await store.loadTasks(currentUser._id);
    renderCurrentSection(id);
  } else if (id === 'completed-tasks' || id === 'deleted-tasks') {
    // These just render, data is already loaded
    renderCurrentSection(id);
  } else if (id === 'profile') {
     // Profile section is just HTML, no render needed
     loadProfileData();
  } else {
    // Default to inbox
    await store.loadTasks(currentUser._id);
    renderCurrentSection('inbox');
  }
}

// ADDED: New function to load profile data
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