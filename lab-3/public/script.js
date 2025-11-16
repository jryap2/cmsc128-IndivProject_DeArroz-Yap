// =====================================================
// GLOBAL STATE
// =====================================================

let currentUser = null;
let currentCollabList = null;

// =====================================================
// STORAGE HELPERS (hybrid localStorage and window.storage)
// =====================================================

// Check if window.storage is available (in TDL page)
function hasWindowStorage() {
  return typeof window.storage !== 'undefined' && window.storage !== null;
}

async function getFromStorage(key, shared = false) {
  // Use window.storage if available (TDL page), otherwise localStorage (auth pages)
  if (hasWindowStorage()) {
    try {
      const result = await window.storage.get(key, shared);
      return result ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  } else {
    // Fallback to localStorage for auth pages
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}

async function setToStorage(key, value, shared = false) {
  if (hasWindowStorage()) {
    try {
      await window.storage.set(key, JSON.stringify(value), shared);
      return true;
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      return false;
    }
  } else {
    // Fallback to localStorage for auth pages
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  }
}

async function deleteFromStorage(key, shared = false) {
  if (hasWindowStorage()) {
    try {
      await window.storage.delete(key, shared);
      return true;
    } catch (error) {
      console.error(`Error deleting ${key}:`, error);
      return false;
    }
  } else {
    // Fallback to localStorage for auth pages
    localStorage.removeItem(key);
    return true;
  }
}

// =====================================================
// NOTIFICATION
// =====================================================

function showNotification(msg, type = 'success') {
  const notif = document.getElementById('notification');
  if (!notif) return;

  notif.textContent = msg;
  notif.className = `${type} show`;

  setTimeout(() => {
    notif.classList.remove('show');
  }, 3000);
}

// =====================================================
// PASSWORD TOGGLE
// =====================================================

function togglePassword(id) {
  const input = document.getElementById(id);
  if (!input) return;

  input.type = input.type === 'password' ? 'text' : 'password';

  try {
    const caller = event && event.currentTarget ? event.currentTarget : null;
    if (!caller) return;

    const icon = caller.querySelector('i');
    if (!icon) return;

    const toShow = input.type === 'text';
    icon.classList.toggle('fa-eye', !toShow);
    icon.classList.toggle('fa-eye-slash', toShow);
  } catch {
    // ignore
  }
}

// =====================================================
// VALIDATION HELPERS
// =====================================================

const isValidEmail = email =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPasswordLength = pwd =>
  pwd && pwd.length >= 8 && pwd.length <= 64;

// =====================================================
// AUTH: SIGNUP / LOGIN / LOGOUT
// =====================================================

async function signup() {
  const name = document.getElementById('signup-name')?.value.trim();
  const email = document.getElementById('signup-email')?.value.trim();
  const password = document.getElementById('signup-password')?.value;

  if (!name) return showNotification('Enter your name.', 'error');
  if (!isValidEmail(email)) return showNotification('Enter valid email.', 'error');
  if (!isValidPasswordLength(password)) {
    return showNotification('Password 8-64 chars.', 'error');
  }

  // Check if email already exists
  const existingUser = await getFromStorage(`user:${email}`, true);
  if (existingUser) {
    return showNotification('Email already registered.', 'error');
  }

  const newUser = {
    _id: `user_${Date.now()}`,
    name,
    email,
    password
  };

  await setToStorage(`user:${email}`, newUser, true);

  showNotification('Signup successful! Redirecting...', 'success');
  setTimeout(() => (window.location.href = 'index.html'), 1500);
}

async function login() {
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;

  if (!email || !password) {
    return showNotification('Fill all fields.', 'error');
  }

  const user = await getFromStorage(`user:${email}`, true);
  if (!user || user.password !== password) {
    return showNotification('Invalid email or password.', 'error');
  }

  currentUser = user;
  await setToStorage('currentUser', currentUser);

  showNotification('Login successful!', 'success');
  setTimeout(() => (window.location.href = 'tdl.html'), 500);
}

function logout() {
  currentUser = null;
  deleteFromStorage('currentUser');
  showNotification('Logged out!', 'success');
  setTimeout(() => (window.location.href = 'index.html'), 500);
}

// =====================================================
// PROFILE
// =====================================================

async function loadProfile() {
  if (!currentUser) {
    currentUser = await getFromStorage('currentUser');
    if (!currentUser) return;
  }

  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');

  if (nameEl) nameEl.value = currentUser.name || '';
  if (emailEl) emailEl.value = currentUser.email || '';
}

async function updateProfile() {
  if (!currentUser) return;

  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const passEl = document.getElementById('profile-password');

  if (!nameEl || !emailEl || !passEl) return;

  const name = nameEl.value.trim();
  const password = passEl.value;

  if (!name) return showNotification('Name cannot be empty.', 'error');
  if (password && !isValidPasswordLength(password)) {
    return showNotification('Password 8-64 chars.', 'error');
  }

  currentUser.name = name;
  if (password) currentUser.password = password;

  await setToStorage(`user:${currentUser.email}`, currentUser, true);
  await setToStorage('currentUser', currentUser);

  passEl.value = '';
  showNotification('Profile updated!', 'success');
}

// =====================================================
// TDL INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
  if (document.body.classList.contains('tdl-page')) {
    currentUser = await getFromStorage('currentUser');
    if (!currentUser) {
      window.location.href = 'index.html';
      return;
    }
    await initTDL();
  }
});

async function initTDL() {
  const menuItems = document.querySelectorAll('.menu-content li a');
  const sections = document.querySelectorAll('.content-section');
  const addTaskBtns = document.querySelectorAll('.add-task-btn1, .add-task-btn2');

  const modal = document.getElementById('taskModal');
  const cancelBtn = document.querySelector('.cancel-btn');
  const saveTaskBtn = document.querySelector('.save-task-btn');

  const dateInput = document.getElementById('task-date');
  const dateBtn = document.getElementById('task-date-btn');
  const dateDropdown = document.getElementById('date-picker-dropdown');
  const confirmDateBtn = document.getElementById('confirm-date');
  const cancelDateBtn = document.getElementById('cancel-date');

  const priorityBtn = document.getElementById('task-priority-btn');
  const priorityMenu = document.getElementById('priority-menu');
  const hiddenPriority = document.getElementById('task-priority');

  const filterBtn = document.querySelector('.settings-display button:first-child');
  const selectBtn = document.querySelector('.settings-display button:nth-child(2)');

  const sectionOriginalHTML = {};
  document.querySelectorAll('.content-section').forEach(section => {
    const contentDiv = section.querySelector(
      '.inbox-content, .completed-tasks-content, .deleted-tasks-content'
    );
    if (contentDiv) sectionOriginalHTML[section.id] = contentDiv.innerHTML;
  });

  function tasksKey() {
    return currentCollabList ? `collab:${currentCollabList._id}:tasks` : `tasks:${currentUser._id}`;
  }
  function completedKey() {
    return currentCollabList ? `collab:${currentCollabList._id}:completed` : `completed:${currentUser._id}`;
  }
  function deletedKey() {
    return currentCollabList ? `collab:${currentCollabList._id}:deleted` : `deleted:${currentUser._id}`;
  }
  function isShared() {
    return !!currentCollabList;
  }

  let tasks = [];
  let completed_tasks = [];
  let deleted_tasks = [];

  let currentFilter = { type: 'none', value: '' };
  let selectionMode = false;
  const selectedTasks = new Set();
  let currentSection = 'inbox';

  // ---------- STORAGE ----------
  async function loadTasksFromServer() {
    tasks = await getFromStorage(tasksKey(), isShared()) || [];
    completed_tasks = await getFromStorage(completedKey(), isShared()) || [];
    deleted_tasks = await getFromStorage(deletedKey(), isShared()) || [];
    renderCurrentSection(currentSection);
  }

  async function saveTasksToServer() {
    await setToStorage(tasksKey(), tasks, isShared());
    await setToStorage(completedKey(), completed_tasks, isShared());
    await setToStorage(deletedKey(), deleted_tasks, isShared());
  }

  async function updateTasksAndSave() {
    await saveTasksToServer();
    renderCurrentSection(currentSection);
  }

  // ---------- HELPERS ----------
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
  }

  function resetForm() {
    const t = document.getElementById('task-title');
    const d = document.getElementById('task-desc');
    if (t) t.value = '';
    if (d) d.value = '';

    if (window.flatpickr && fp) fp.clear();
    if (dateBtn) {
      dateBtn.innerHTML = '<i class="fa-regular fa-calendar"></i> Due Date';
    }

    if (hiddenPriority) hiddenPriority.value = '';
    if (priorityBtn) {
      priorityBtn.innerHTML = '<i class="fa-regular fa-flag"></i> Priority';
    }
  }

  function closeAllPopups() {
    if (dateDropdown) dateDropdown.classList.remove('active');
    if (priorityMenu) priorityMenu.classList.remove('show');
    const filterMenu = document.getElementById('filter-menu');
    if (filterMenu) filterMenu.classList.remove('show');
  }

  // ---------- NAVIGATION ----------
  async function showSection(id) {
    sections.forEach(sec => {
      sec.classList.remove('active');
      sec.hidden = true;
    });

    const target = document.getElementById(id);
    if (!target) return;

    target.classList.add('active');
    target.hidden = false;
    currentSection = id;
    exitSelectionMode();

    if (id === 'profile') {
      await loadProfile();
    } else if (id === 'collaborative-lists') {
      await renderCollaborativeLists();
    } else {
      renderCurrentSection(id);
    }
  }

  if (sections.length > 0) {
    showSection('inbox');
    if (menuItems[0]) menuItems[0].parentElement.classList.add('active');
  }

  menuItems.forEach(item => {
    item.addEventListener('click', async e => {
      e.preventDefault();
      menuItems.forEach(mi => mi.parentElement.classList.remove('active'));
      item.parentElement.classList.add('active');

      const targetId = item.getAttribute('data-target');
      await showSection(targetId);
    });
  });

  // ---------- MODAL ----------
  function openModalForTask(task = null, taskIndex = null) {
    if (!modal) return;

    modal.classList.add('show');
    modal.hidden = false;

    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-desc');

    if (task && taskIndex !== null) {
      if (titleInput) titleInput.value = task.title || '';
      if (descInput) descInput.value = task.description || '';
      if (dateInput) dateInput.value = task.date || '';
      if (hiddenPriority) hiddenPriority.value = task.priority || '';

      if (task.priority && priorityBtn) {
        let color = '#93E1FF';
        if (task.priority === 'High') color = '#F75A5A';
        else if (task.priority === 'Mid') color = '#F8E067';

        priorityBtn.innerHTML =
          `<i class="fa-regular fa-flag" style="color: ${color};"></i> ${task.priority}`;
      }

      if (task.date && dateBtn) {
        try {
          const dateObj = new Date(task.date);
          const formatted = dateObj.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          dateBtn.innerHTML =
            `<i class="fa-regular fa-calendar"></i> ${formatted}`;
        } catch {
          dateBtn.innerHTML =
            '<i class="fa-regular fa-calendar"></i> Due Date';
        }
      }

      if (saveTaskBtn) {
        saveTaskBtn.textContent = 'Save Task';
        saveTaskBtn.dataset.editIndex = taskIndex;
      }
    } else {
      resetForm();
      if (saveTaskBtn) {
        saveTaskBtn.textContent = 'Add Task';
        delete saveTaskBtn.dataset.editIndex;
      }
    }

    updateSaveButtonState();
  }

  addTaskBtns.forEach(btn => btn.addEventListener('click', () => openModalForTask()));

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      resetForm();
      modal.classList.remove('show');
      modal.hidden = true;
      closeAllPopups();
    });
  }

  window.addEventListener('click', e => {
    if (e.target === modal) {
      resetForm();
      modal.classList.remove('show');
      modal.hidden = true;
      closeAllPopups();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (modal) {
        modal.classList.remove('show');
        modal.hidden = true;
      }
      closeAllPopups();
    }

    if (e.key === 'Enter' && modal && !modal.hidden && saveTaskBtn && !saveTaskBtn.disabled) {
      saveTaskBtn.click();
    }
  });

  // ---------- DATE PICKER ----------
  let fp;
  if (window.flatpickr && dateInput) {
    fp = flatpickr('#task-date', {
      enableTime: true,
      dateFormat: 'Y-m-d h:i K',
      time_24hr: false,
      inline: true,
      appendTo: dateDropdown
    });
  }

  if (dateBtn) {
    dateBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (dateDropdown) dateDropdown.classList.toggle('active');
      if (priorityMenu) priorityMenu.classList.remove('show');
    });
  }

  if (confirmDateBtn) {
    confirmDateBtn.addEventListener('click', () => {
      if (fp && fp.selectedDates.length > 0) {
        const selected = fp.selectedDates[0];
        const formatted = selected.toLocaleString([], {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        if (dateBtn) {
          dateBtn.innerHTML =
            `<i class="fa-regular fa-calendar"></i> ${formatted}`;
        }
      }
      if (dateDropdown) dateDropdown.classList.remove('active');
    });
  }

  if (cancelDateBtn) {
    cancelDateBtn.addEventListener('click', () => {
      if (fp) fp.clear();
      if (dateBtn) {
        dateBtn.innerHTML =
          '<i class="fa-regular fa-calendar"></i> Due Date';
      }
      if (dateDropdown) dateDropdown.classList.remove('active');
    });
  }

  // ---------- PRIORITY ----------
  if (priorityBtn) {
    priorityBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (priorityMenu) priorityMenu.classList.toggle('show');
      if (dateDropdown) dateDropdown.classList.remove('active');
    });
  }

  const priorityButtons = document.querySelectorAll('#priority-menu button');
  priorityButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      if (hiddenPriority) {
        hiddenPriority.value = this.getAttribute('data-value');
      }

      const iconColor = this.querySelector('i')?.style.color;
      if (priorityBtn) {
        priorityBtn.innerHTML =
          `<i class="fa-regular fa-flag"></i> ${this.getAttribute('data-value')}`;
        const icon = priorityBtn.querySelector('i');
        if (icon && iconColor) icon.style.color = iconColor;
      }

      if (priorityMenu) priorityMenu.classList.remove('show');
    });
  });

  document.addEventListener('click', e => {
    if (dateDropdown && !dateDropdown.contains(e.target) && e.target !== dateBtn) {
      dateDropdown.classList.remove('active');
    }
    if (priorityMenu && !priorityMenu.contains(e.target) && e.target !== priorityBtn) {
      priorityMenu.classList.remove('show');
    }
    const filterMenu = document.getElementById('filter-menu');
    if (filterMenu && !filterMenu.contains(e.target) && e.target !== filterBtn) {
      filterMenu.classList.remove('show');
    }
  });

  // ---------- SAVE TASK ----------
  const titleInput = document.getElementById('task-title');

  function updateSaveButtonState() {
    if (!saveTaskBtn || !titleInput) return;

    const disabled = titleInput.value.trim() === '';
    saveTaskBtn.disabled = disabled;
    saveTaskBtn.style.opacity = disabled ? '0.6' : '1';
    saveTaskBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }

  if (titleInput) {
    updateSaveButtonState();
    titleInput.addEventListener('input', updateSaveButtonState);
  }

  if (saveTaskBtn) {
    saveTaskBtn.addEventListener('click', async () => {
      const title = document.getElementById('task-title')?.value.trim();
      const desc = document.getElementById('task-desc')?.value.trim();
      const date = dateInput ? dateInput.value : '';
      const priority = hiddenPriority ? hiddenPriority.value : '';

      if (!title) return;

      const editIndex = saveTaskBtn.dataset.editIndex;
      if (editIndex !== undefined) {
        const index = parseInt(editIndex, 10);
        if (index >= 0 && index < tasks.length) {
          tasks[index] = { title, description: desc, date, priority };
        }
        delete saveTaskBtn.dataset.editIndex;
      } else {
        tasks.push({ title, description: desc, date, priority });
      }

      await updateTasksAndSave();
      modal.classList.remove('show');
      modal.hidden = true;
      closeAllPopups();
      resetForm();
    });
  }

  // ---------- FILTER ----------
  function applyFilter(type, value) {
    currentFilter = { type, value };

    if (!filterBtn) return;

    if (type === 'none') {
      filterBtn.style.color = '#6B6C7E';
      filterBtn.title = 'Filter tasks';
    } else {
      filterBtn.style.color = '#fb5a04';
      filterBtn.title = `Filtered by ${type}: ${value}`;
    }
    renderCurrentSection(currentSection);
  }

  function clearFilter() {
    applyFilter('none', '');
  }

  function filterTasks(list) {
    if (currentFilter.type === 'none') return list;

    let filtered = list.slice();

    switch (currentFilter.type) {
      case 'priority':
        filtered = filtered.filter(task => task.priority === currentFilter.value);
        break;

      case 'due': {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        filtered = filtered.filter(task => {
          if (currentFilter.value === 'no-date') {
            return !task.date;
          }
          if (!task.date) return false;

          const taskDate = new Date(task.date);
          switch (currentFilter.value) {
            case 'today':
              return taskDate.toDateString() === today.toDateString();
            case 'overdue':
              return taskDate < today;
            case 'week':
              return taskDate >= startOfWeek && taskDate <= endOfWeek;
            default:
              return true;
          }
        });
        break;
      }

      case 'sort':
        if (currentFilter.value === 'newest') {
          filtered = filtered.reverse();
        }
        break;
      default:
        break;
    }

    return filtered;
  }

  function createFilterMenu() {
    const filterMenu = document.createElement('div');
    filterMenu.id = 'filter-menu';
    filterMenu.className = 'filter-menu';
    filterMenu.innerHTML = `
      <div class="filter-section">
        <h4>Filter by Priority</h4>
        <button data-filter="priority" data-value="High">
          <i class="fa-regular fa-flag" style="color: #F75A5A;"></i> High Priority
        </button>
        <button data-filter="priority" data-value="Mid">
          <i class="fa-regular fa-flag" style="color: #F8E067;"></i> Mid Priority
        </button>
        <button data-filter="priority" data-value="Low">
          <i class="fa-regular fa-flag" style="color: #93E1FF;"></i> Low Priority
        </button>
      </div>
      <div class="filter-section">
        <h4>Filter by Due Date</h4>
        <button data-filter="due" data-value="today">Due Today</button>
        <button data-filter="due" data-value="overdue">Overdue</button>
        <button data-filter="due" data-value="week">Due This Week</button>
        <button data-filter="due" data-value="no-date">No Due Date</button>
      </div>
      <div class="filter-section">
        <h4>Sort by Date Added</h4>
        <button data-filter="sort" data-value="newest">Newest First</button>
        <button data-filter="sort" data-value="oldest">Oldest First</button>
      </div>
      <div class="filter-actions">
        <button class="clear-filter-btn">Clear Filter</button>
      </div>
    `;

    filterBtn.parentNode.appendChild(filterMenu);

    const filterOptions = filterMenu.querySelectorAll('button[data-filter]');
    filterOptions.forEach(option => {
      option.addEventListener('click', function () {
        applyFilter(this.getAttribute('data-filter'), this.getAttribute('data-value'));
        filterMenu.classList.remove('show');
      });
    });

    const clearBtn = filterMenu.querySelector('.clear-filter-btn');
    clearBtn.addEventListener('click', () => {
      clearFilter();
      filterMenu.classList.remove('show');
    });

    return filterMenu;
  }

  if (filterBtn) {
    filterBtn.addEventListener('click', e => {
      e.stopPropagation();
      let filterMenu = document.getElementById('filter-menu');
      if (!filterMenu) filterMenu = createFilterMenu();

      if (dateDropdown) dateDropdown.classList.remove('active');
      if (priorityMenu) priorityMenu.classList.remove('show');

      filterMenu.classList.toggle('show');
    });
  }

  // ---------- SELECTION ----------
  function showSelectionToolbar() {
    const existingToolbar = document.getElementById('selection-toolbar');
    if (existingToolbar) existingToolbar.remove();

    const toolbar = document.createElement('div');
    toolbar.id = 'selection-toolbar';
    toolbar.className = 'selection-toolbar';

    let actions = [];
    if (currentSection === 'inbox' || currentSection === 'collab-detail') {
      actions = [
        { text: 'Delete', class: 'delete-selected', icon: 'fa-trash', color: '#f3121d' },
        { text: 'Complete', class: 'complete-selected', icon: 'fa-circle-check', color: '#27d343' }
      ];
    } else if (currentSection === 'completed-tasks') {
      actions = [
        { text: 'Delete', class: 'delete-selected', icon: 'fa-trash', color: '#f3121d' },
        { text: 'Revert', class: 'revert-selected', icon: 'fa-undo', color: '#4CAF50' }
      ];
    } else if (currentSection === 'deleted-tasks') {
      actions = [
        { text: 'Delete Forever', class: 'permanent-delete-selected', icon: 'fa-times', color: '#f3121d' },
        { text: 'Recover', class: 'recover-selected', icon: 'fa-undo', color: '#4CAF50' }
      ];
    }

    const actionsHTML = actions.map(a => `
      <button class="${a.class}" disabled>
        <i class="fa-solid ${a.icon}" style="color: ${a.color};"></i> ${a.text}
      </button>
    `).join('');

    toolbar.innerHTML = `
      <div class="selection-info">
        <span id="selection-count">(0 selected)</span>
      </div>
      <div class="selection-actions">
        ${actionsHTML}
        <button class="cancel-selection">
          <i class="fa-solid fa-times"></i> Cancel
        </button>
      </div>
    `;

    const settingsDisplay = document.querySelector('.settings-display');
    settingsDisplay.insertAdjacentElement('afterend', toolbar);

    addSelectionToolbarListeners(toolbar);
  }

  function hideSelectionToolbar() {
    const toolbar = document.getElementById('selection-toolbar');
    if (toolbar) toolbar.remove();
  }

  function updateSelectionCount() {
    const countElement = document.getElementById('selection-count');
    if (countElement) {
      const count = selectedTasks.size;
      countElement.textContent =
        count === 0 ? '(0 selected)' :
        count === 1 ? '(1 selected)' :
        `(${count} selected)`;
    }

    const actionButtons = document.querySelectorAll(
      '.selection-toolbar .selection-actions button:not(.cancel-selection)'
    );
    actionButtons.forEach(btn => {
      const disabled = selectedTasks.size === 0;
      btn.disabled = disabled;
      btn.style.opacity = disabled ? '0.5' : '1';
    });
  }

  function addSelectionToolbarListeners(toolbar) {
    const cancelSelectionBtn = toolbar.querySelector('.cancel-selection');
    cancelSelectionBtn.addEventListener('click', exitSelectionMode);

    const completeBtn = toolbar.querySelector('.complete-selected');
    if (completeBtn) {
      completeBtn.addEventListener('click', async () => {
        const indices = Array.from(selectedTasks).sort((a, b) => b - a);
        for (const index of indices) {
          await completeTask(index);
        }
        exitSelectionMode();
      });
    }

    const deleteBtn = toolbar.querySelector('.delete-selected');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const indices = Array.from(selectedTasks).sort((a, b) => b - a);
        const fromCompleted = currentSection === 'completed-tasks';
        for (const index of indices) {
          await deleteTask(index, fromCompleted);
        }
        exitSelectionMode();
      });
    }

    const revertBtn = toolbar.querySelector('.revert-selected');
    if (revertBtn) {
      revertBtn.addEventListener('click', async () => {
        const indices = Array.from(selectedTasks).sort((a, b) => b - a);
        for (const index of indices) {
          if (index >= 0 && index < completed_tasks.length) {
            const task = completed_tasks[index];
            tasks.push(task);
            completed_tasks.splice(index, 1);
          }
        }
        exitSelectionMode();
        await updateTasksAndSave();
      });
    }

    const recoverBtn = toolbar.querySelector('.recover-selected');
    if (recoverBtn) {
      recoverBtn.addEventListener('click', async () => {
        const indices = Array.from(selectedTasks).sort((a, b) => b - a);
        for (const index of indices) {
          await restoreTask(index);
        }
        exitSelectionMode();
      });
    }

    const permanentDeleteBtn = toolbar.querySelector('.permanent-delete-selected');
    if (permanentDeleteBtn) {
      permanentDeleteBtn.addEventListener('click', async () => {
        if (confirm(
          `Are you sure you want to permanently delete ${selectedTasks.size} task(s)? This action cannot be undone.`
        )) {
          const indices = Array.from(selectedTasks).sort((a, b) => b - a);
          for (const index of indices) {
            await permanentlyDeleteTask(index);
          }
          exitSelectionMode();
        }
      });
    }
  }

  function enterSelectionMode() {
    selectionMode = true;
    selectedTasks.clear();

    if (selectBtn) {
      selectBtn.style.color = '#fb5a04';
      selectBtn.innerHTML =
        '<i class="fa-solid fa-circle-check fa-lg" style="color: #fb5a04;"></i>';
      selectBtn.title = 'Exit selection mode';
    }

    showSelectionToolbar();
    renderCurrentSection(currentSection);
  }

  function exitSelectionMode() {
    selectionMode = false;
    selectedTasks.clear();

    if (selectBtn) {
      selectBtn.style.color = '#6B6C7E';
      selectBtn.innerHTML =
        '<i class="fa-regular fa-circle fa-lg" style="color: #6B6C7E;"></i>';
      selectBtn.title = 'Select tasks';
    }

    hideSelectionToolbar();
    renderCurrentSection(currentSection);
  }

  function toggleTaskSelection(index) {
    if (selectedTasks.has(index)) {
      selectedTasks.delete(index);
    } else {
      selectedTasks.add(index);
    }
    updateSelectionCount();

    const checkbox = document.querySelector(
      `[data-task-index="${index}"] .task-checkbox`
    );
    if (!checkbox) return;

    checkbox.innerHTML = selectedTasks.has(index)
      ? '<i class="fa-solid fa-check-square" style="color: #fb5a04;"></i>'
      : '<i class="fa-regular fa-square"></i>';
  }

  if (selectBtn) {
    selectBtn.addEventListener('click', e => {
      e.stopPropagation();
      selectionMode ? exitSelectionMode() : enterSelectionMode();
    });
  }

  window.toggleTaskSelection = toggleTaskSelection;
  window.clearFilter = clearFilter;

  // ---------- TASK ACTIONS ----------
  async function completeTask(index) {
    if (index < 0 || index >= tasks.length) return;
    const task = tasks[index];
    completed_tasks.push(task);
    tasks.splice(index, 1);
    await updateTasksAndSave();
  }

  async function deleteTask(index, fromCompleted = false) {
    const source = fromCompleted ? completed_tasks : tasks;
    if (index < 0 || index >= source.length) return;

    const task = source[index];
    deleted_tasks.push(task);
    source.splice(index, 1);
    await updateTasksAndSave();
  }

  async function restoreTask(index) {
    if (index < 0 || index >= deleted_tasks.length) return;
    const task = deleted_tasks[index];
    tasks.push(task);
    deleted_tasks.splice(index, 1);
    await updateTasksAndSave();
  }

  async function permanentlyDeleteTask(index) {
    if (index < 0 || index >= deleted_tasks.length) return;
    deleted_tasks.splice(index, 1);
    await updateTasksAndSave();
  }

  // ---------- RENDER ----------
  function getPriorityColor(priority) {
    switch (priority) {
      case 'High': return '#F75A5A';
      case 'Mid': return '#F8E067';
      case 'Low': return '#93E1FF';
      default: return '#93E1FF';
    }
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  function renderCurrentSection(sectionId) {
    switch (sectionId) {
      case 'inbox':
        renderInboxTasks();
        break;
      case 'completed-tasks':
        renderCompletedTasks();
        break;
      case 'deleted-tasks':
        renderDeletedTasks();
        break;
      case 'collab-detail':
        renderCollabDetail();
        break;
      default:
        renderInboxTasks();
        break;
    }
  }

  function renderEmptyOrOriginal(contentDiv, key, emptyText) {
    if (currentFilter.type !== 'none') {
      contentDiv.innerHTML = `
        <div class="no-results">
          <p>${emptyText}</p>
          <button onclick="clearFilter()">Clear Filter</button>
        </div>
      `;
    } else {
      contentDiv.innerHTML = sectionOriginalHTML[key] || '';
      const addBtns = contentDiv.querySelectorAll('.add-task-btn2, .add-task-btn3');
      addBtns.forEach(btn => btn.addEventListener('click', () => openModalForTask()));
    }
  }

  function renderInboxTasks() {
    const section = document.getElementById('inbox');
    if (!section) return;

    const contentDiv = section.querySelector('.inbox-content');
    if (!contentDiv) return;
    contentDiv.innerHTML = '';

    const filteredTasks = filterTasks(tasks);
    if (filteredTasks.length === 0) {
      renderEmptyOrOriginal(
        contentDiv,
        'inbox',
        'No tasks match the current filter.'
      );
      return;
    }

    filteredTasks.forEach(task => {
      const actualIndex = tasks.indexOf(task);
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task-item';
      taskDiv.dataset.taskIndex = actualIndex;

      const selectionCheckbox = selectionMode
        ? `
          <div class="task-checkbox" onclick="toggleTaskSelection(${actualIndex})">
            <i class="fa-regular fa-square"></i>
          </div>
          <style>
            .task-priority-container,
            .task-item p {
              display: flex;
              flex-direction: column;
              gap: 5px;
              padding-left: 7vh;
            }
          </style>
        `
        : '';

      const actionButtons = selectionMode
        ? ''
        : `
          <button class="edit-button" data-index="${actualIndex}">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="confirm-complete-btn" data-index="${actualIndex}">
            <i class="fa-regular fa-circle-check"></i>
          </button>
        `;

      taskDiv.innerHTML = `
        <h3>${selectionCheckbox} ${escapeHtml(task.title)} ${actionButtons}</h3>
        <p>${escapeHtml(task.description || '')}</p>
        <div class="task-priority-container">
          ${
            task.priority
              ? `
            <span class="priority-badge priority-${task.priority.toLowerCase()}">
              <i class="fa-regular fa-flag" style="color: ${getPriorityColor(task.priority)};"></i>
              ${task.priority}
            </span>
          `
              : ''
          }
          ${
            task.date
              ? `
            <span class="due-date">
              <i class="fa-regular fa-calendar"></i>
              ${formatDate(task.date)}
            </span>
          `
              : ''
          }
        </div>
        <div class="line"></div>
      `;

      contentDiv.appendChild(taskDiv);

      if (!selectionMode) {
        const editBtn = taskDiv.querySelector('.edit-button');
        const completeBtn = taskDiv.querySelector('.confirm-complete-btn');

        if (editBtn) {
          editBtn.addEventListener('click', () => openModalForTask(task, actualIndex));
        }
        if (completeBtn) {
          completeBtn.addEventListener('click', async () => await completeTask(actualIndex));
        }
      }
    });

    if (!selectionMode) {
      const addTaskBtn = document.createElement('button');
      addTaskBtn.className = 'add-task-btn3';
      addTaskBtn.innerHTML =
        '<i class="fa-solid fa-plus" style="color: #FF621C;"></i> Add Task';
      addTaskBtn.addEventListener('click', () => openModalForTask());
      contentDiv.appendChild(addTaskBtn);
    }
  }

  function renderCompletedTasks() {
    const section = document.getElementById('completed-tasks');
    if (!section) return;

    const contentDiv = section.querySelector('.completed-tasks-content');
    if (!contentDiv) return;
    contentDiv.innerHTML = '';

    const filteredTasks = filterTasks(completed_tasks);
    if (filteredTasks.length === 0) {
      renderEmptyOrOriginal(
        contentDiv,
        'completed-tasks',
        'No completed tasks match the current filter.'
      );
      return;
    }

    filteredTasks.forEach(task => {
      const actualIndex = completed_tasks.indexOf(task);
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task-item completed';
      taskDiv.dataset.taskIndex = actualIndex;

      const selectionCheckbox = selectionMode
        ? `
          <div class="task-checkbox" onclick="toggleTaskSelection(${actualIndex})">
            <i class="fa-regular fa-square"></i>
          </div>
          <style>
            .task-priority-container,
            .task-item p {
              display: flex;
              flex-direction: column;
              gap: 5px;
              padding-left: 7vh;
            }
          </style>
        `
        : '';

      const actionButtons = selectionMode
        ? ''
        : `
          <div class="completed-task-actions">
            <button class="delete-button" data-index="${actualIndex}" title="Move to deleted tasks">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `;

      taskDiv.innerHTML = `
        <h3 class="completed-title">
          ${selectionCheckbox} ${escapeHtml(task.title)} ${actionButtons}
        </h3>
        <p class="completed-desc">${escapeHtml(task.description || '')}</p>
        <div class="task-priority-container">
          ${
            task.priority
              ? `
            <span class="priority-badge priority-${task.priority.toLowerCase()}">
              <i class="fa-regular fa-flag" style="color: ${getPriorityColor(task.priority)};"></i>
              ${task.priority}
            </span>
          `
              : ''
          }
          ${
            task.date
              ? `
            <span class="due-date completed">
              <i class="fa-regular fa-calendar"></i>
              ${formatDate(task.date)}
            </span>
          `
              : ''
          }
        </div>
        <div class="line"></div>
      `;
      contentDiv.appendChild(taskDiv);

      if (!selectionMode) {
        const deleteBtn = taskDiv.querySelector('.delete-button');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => await deleteTask(actualIndex, true));
        }
      }
    });
  }

  function renderDeletedTasks() {
    const section = document.getElementById('deleted-tasks');
    if (!section) return;

    const contentDiv = section.querySelector('.deleted-tasks-content');
    if (!contentDiv) return;
    contentDiv.innerHTML = '';

    const filteredTasks = filterTasks(deleted_tasks);
    if (filteredTasks.length === 0) {
      renderEmptyOrOriginal(
        contentDiv,
        'deleted-tasks',
        'No deleted tasks match the current filter.'
      );
      return;
    }

    filteredTasks.forEach(task => {
      const actualIndex = deleted_tasks.indexOf(task);
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task-item deleted';
      taskDiv.dataset.taskIndex = actualIndex;

      const selectionCheckbox = selectionMode
        ? `
          <div class="task-checkbox" onclick="toggleTaskSelection(${actualIndex})">
            <i class="fa-regular fa-square"></i>
          </div>
          <style>
            .task-priority-container,
            .task-item p {
              display: flex;
              flex-direction: column;
              gap: 5px;
              padding-left: 7vh;
            }
          </style>
        `
        : '';

      const actionButtons = selectionMode
        ? ''
        : `
          <div class="deleted-task-actions">
            <button class="restore-button" data-index="${actualIndex}" title="Restore to inbox">
              <i class="fa-solid fa-undo"></i>
            </button>
            <button class="permanent-delete-button" data-index="${actualIndex}" title="Delete permanently">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        `;

      taskDiv.innerHTML = `
        <h3 class="deleted-title">
          ${selectionCheckbox} ${escapeHtml(task.title)}
          <div class="deleted-task-actions-container">
            ${actionButtons}
          </div>
        </h3>
        <p class="deleted-desc">${escapeHtml(task.description || '')}</p>
        <div class="task-priority-container">
          ${
            task.priority
              ? `
            <span class="priority-badge priority-${task.priority.toLowerCase()} faded">
              <i class="fa-regular fa-flag" style="color: ${getPriorityColor(task.priority)};"></i>
              ${task.priority}
            </span>
          `
              : ''
          }
          ${
            task.date
              ? `
            <span class="due-date deleted">
              <i class="fa-regular fa-calendar"></i>
              ${formatDate(task.date)}
            </span>
          `
              : ''
          }
        </div>
        <div class="line"></div>
      `;
      contentDiv.appendChild(taskDiv);

      if (!selectionMode) {
        const restoreBtn = taskDiv.querySelector('.restore-button');
        const permDeleteBtn = taskDiv.querySelector('.permanent-delete-button');

        if (restoreBtn) {
          restoreBtn.addEventListener('click', async () => await restoreTask(actualIndex));
        }
        if (permDeleteBtn) {
          permDeleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
              await permanentlyDeleteTask(actualIndex);
            }
          });
        }
      }
    });
  }

  // ---------- COLLABORATIVE LISTS ----------
  async function renderCollaborativeLists() {
    const container = document.getElementById('collab-lists-container');
    if (!container) return;

    container.innerHTML = '<p>Loading collaborative lists...</p>';

    // Get user's created lists and lists they're member of
    const userLists = await getFromStorage(`user:${currentUser._id}:collab-lists`) || [];
    const memberOf = await getFromStorage(`user:${currentUser._id}:member-of`) || [];

    const allListIds = [...new Set([...userLists, ...memberOf])];

    if (allListIds.length === 0) {
      container.innerHTML = '<p>You don\'t have any collaborative lists yet. Create one to get started!</p>';
      return;
    }

    container.innerHTML = '';

    for (const listId of allListIds) {
      const list = await getFromStorage(listId, true);
      if (!list) continue;

      const isOwner = list.owner === currentUser._id;
      const memberCount = list.members ? list.members.length : 0;

      const card = document.createElement('div');
      card.className = 'collab-list-card';
      card.innerHTML = `
        <div class="collab-list-info">
          <h3>${escapeHtml(list.name)}</h3>
          <p>${isOwner ? 'Owner' : 'Member'}</p>
        </div>
        <div class="collab-list-meta">
          <span><i class="fa-solid fa-users"></i> ${memberCount} members</span>
        </div>
      `;

      card.addEventListener('click', async () => {
        currentCollabList = list;
        await showCollabDetail(list);
      });

      container.appendChild(card);
    }
  }

  async function showCollabDetail(list) {
    currentCollabList = list;
    
    const section = document.getElementById('collab-detail');
    if (!section) return;

    const title = document.getElementById('collab-detail-title');
    if (title) title.textContent = list.name;

    sections.forEach(sec => {
      sec.classList.remove('active');
      sec.hidden = true;
    });

    section.classList.add('active');
    section.hidden = false;
    currentSection = 'collab-detail';

    await loadTasksFromServer();
  }

  function renderCollabDetail() {
    const section = document.getElementById('collab-detail');
    if (!section) return;

    const contentDiv = section.querySelector('.collab-detail-content');
    if (!contentDiv) return;
    contentDiv.innerHTML = '';

    const filteredTasks = filterTasks(tasks);
    if (filteredTasks.length === 0) {
      contentDiv.innerHTML = '<p style="text-align: center; margin-top: 25vh;">No tasks yet. Add one to get started!</p>';
      const addBtn = document.createElement('button');
      addBtn.className = 'add-task-btn2';
      addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>Add Task';
      addBtn.addEventListener('click', () => openModalForTask());
      contentDiv.appendChild(addBtn);
      return;
    }

    filteredTasks.forEach(task => {
      const actualIndex = tasks.indexOf(task);
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task-item';
      taskDiv.dataset.taskIndex = actualIndex;

      const selectionCheckbox = selectionMode
        ? `
          <div class="task-checkbox" onclick="toggleTaskSelection(${actualIndex})">
            <i class="fa-regular fa-square"></i>
          </div>
        `
        : '';

      const actionButtons = selectionMode
        ? ''
        : `
          <button class="edit-button" data-index="${actualIndex}">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="confirm-complete-btn" data-index="${actualIndex}">
            <i class="fa-regular fa-circle-check"></i>
          </button>
        `;

      taskDiv.innerHTML = `
        <h3>${selectionCheckbox} ${escapeHtml(task.title)} ${actionButtons}</h3>
        <p>${escapeHtml(task.description || '')}</p>
        <div class="task-priority-container">
          ${
            task.priority
              ? `
            <span class="priority-badge">
              <i class="fa-regular fa-flag" style="color: ${getPriorityColor(task.priority)};"></i>
              ${task.priority}
            </span>
          `
              : ''
          }
          ${
            task.date
              ? `
            <span class="due-date">
              <i class="fa-regular fa-calendar"></i>
              ${formatDate(task.date)}
            </span>
          `
              : ''
          }
        </div>
        <div class="line"></div>
      `;

      contentDiv.appendChild(taskDiv);

      if (!selectionMode) {
        const editBtn = taskDiv.querySelector('.edit-button');
        const completeBtn = taskDiv.querySelector('.confirm-complete-btn');

        if (editBtn) {
          editBtn.addEventListener('click', () => openModalForTask(task, actualIndex));
        }
        if (completeBtn) {
          completeBtn.addEventListener('click', async () => await completeTask(actualIndex));
        }
      }
    });

    if (!selectionMode) {
      const addTaskBtn = document.createElement('button');
      addTaskBtn.className = 'add-task-btn3';
      addTaskBtn.innerHTML = '<i class="fa-solid fa-plus" style="color: #FF621C;"></i> Add Task';
      addTaskBtn.addEventListener('click', () => openModalForTask());
      contentDiv.appendChild(addTaskBtn);
    }
  }

  // ---------- COLLABORATIVE LIST MODALS ----------
  const createCollabModal = document.getElementById('createCollabModal');
  const createCollabBtn = document.querySelector('.create-collab-btn');
  const cancelCollabBtn = document.querySelector('.cancel-collab-btn');
  const saveCollabBtn = document.querySelector('.save-collab-btn');

  if (createCollabBtn) {
    createCollabBtn.addEventListener('click', () => {
      if (createCollabModal) {
        createCollabModal.classList.add('show');
        createCollabModal.hidden = false;
      }
    });
  }

  if (cancelCollabBtn) {
    cancelCollabBtn.addEventListener('click', () => {
      const input = document.getElementById('collab-list-name');
      if (input) input.value = '';
      if (createCollabModal) {
        createCollabModal.classList.remove('show');
        createCollabModal.hidden = true;
      }
    });
  }

  if (saveCollabBtn) {
    saveCollabBtn.addEventListener('click', async () => {
      const input = document.getElementById('collab-list-name');
      const name = input?.value.trim();

      if (!name) {
        showNotification('Please enter a list name.', 'error');
        return;
      }

      const listId = `collab:${Date.now()}`;
      const newList = {
        _id: listId,
        name,
        owner: currentUser._id,
        ownerEmail: currentUser.email,
        members: [currentUser.email],
        createdAt: new Date().toISOString()
      };

      await setToStorage(listId, newList, true);

      const userLists = await getFromStorage(`user:${currentUser._id}:collab-lists`) || [];
      userLists.push(listId);
      await setToStorage(`user:${currentUser._id}:collab-lists`, userLists);

      if (input) input.value = '';
      if (createCollabModal) {
        createCollabModal.classList.remove('show');
        createCollabModal.hidden = true;
      }

      showNotification('Collaborative list created!', 'success');
      await renderCollaborativeLists();
    });
  }

  // ---------- MANAGE MEMBERS ----------
  const manageMembersModal = document.getElementById('manageMembersModal');
  const manageMembersBtn = document.querySelector('.manage-members-btn');
  const closeMembersBtn = document.querySelector('.close-members-btn');
  const addMemberBtn = document.querySelector('.add-member-btn');

  if (manageMembersBtn) {
    manageMembersBtn.addEventListener('click', async () => {
      if (!currentCollabList) return;

      if (manageMembersModal) {
        manageMembersModal.classList.add('show');
        manageMembersModal.hidden = false;
        await renderCurrentMembers();
      }
    });
  }

  if (closeMembersBtn) {
    closeMembersBtn.addEventListener('click', () => {
      const input = document.getElementById('member-email');
      if (input) input.value = '';
      if (manageMembersModal) {
        manageMembersModal.classList.remove('show');
        manageMembersModal.hidden = true;
      }
    });
  }

  if (addMemberBtn) {
    addMemberBtn.addEventListener('click', async () => {
      const input = document.getElementById('member-email');
      const email = input?.value.trim();

      if (!email) {
        showNotification('Please enter an email.', 'error');
        return;
      }

      if (!isValidEmail(email)) {
        showNotification('Please enter a valid email.', 'error');
        return;
      }

      if (!currentCollabList) return;

      // Check if user exists
      const user = await getFromStorage(`user:${email}`, true);
      if (!user) {
        showNotification('User not found.', 'error');
        return;
      }

      // Check if already a member
      if (currentCollabList.members.includes(email)) {
        showNotification('User is already a member.', 'error');
        return;
      }

      // Add member
      currentCollabList.members.push(email);
      await setToStorage(currentCollabList._id, currentCollabList, true);

      // Add to user's member-of list
      const memberOf = await getFromStorage(`user:${user._id}:member-of`) || [];
      if (!memberOf.includes(currentCollabList._id)) {
        memberOf.push(currentCollabList._id);
        await setToStorage(`user:${user._id}:member-of`, memberOf);
      }

      if (input) input.value = '';
      showNotification('Member added successfully!', 'success');
      await renderCurrentMembers();
    });
  }

  async function renderCurrentMembers() {
    const container = document.getElementById('current-members');
    if (!container || !currentCollabList) return;

    container.innerHTML = '';

    for (const memberEmail of currentCollabList.members) {
      const memberDiv = document.createElement('div');
      memberDiv.className = 'member-item';

      const isOwner = memberEmail === currentCollabList.ownerEmail;
      const isCurrentUser = memberEmail === currentUser.email;

      memberDiv.innerHTML = `
        <span class="member-email">${escapeHtml(memberEmail)}</span>
        <div style="display: flex; gap: 10px; align-items: center;">
          <span class="member-role">${isOwner ? 'Owner' : 'Member'}</span>
          ${!isOwner && (currentCollabList.ownerEmail === currentUser.email || isCurrentUser) ? 
            `<button class="remove-member-btn" data-email="${escapeHtml(memberEmail)}">Remove</button>` : 
            ''}
        </div>
      `;

      container.appendChild(memberDiv);

      const removeBtn = memberDiv.querySelector('.remove-member-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', async () => {
          if (confirm(`Remove ${memberEmail} from this list?`)) {
            await removeMember(memberEmail);
          }
        });
      }
    }
  }

  async function removeMember(email) {
    if (!currentCollabList) return;

    currentCollabList.members = currentCollabList.members.filter(m => m !== email);
    await setToStorage(currentCollabList._id, currentCollabList, true);

    const user = await getFromStorage(`user:${email}`, true);
    if (user) {
      const memberOf = await getFromStorage(`user:${user._id}:member-of`) || [];
      const updated = memberOf.filter(id => id !== currentCollabList._id);
      await setToStorage(`user:${user._id}:member-of`, updated);
    }

    showNotification('Member removed.', 'success');
    await renderCurrentMembers();
  }

  // Back to collab lists button
  const backToCollabBtn = document.querySelector('.back-to-collab-btn');
  if (backToCollabBtn) {
    backToCollabBtn.addEventListener('click', async () => {
      currentCollabList = null;
      await showSection('collaborative-lists');
    });
  }

  // ---------- INITIAL LOAD ----------
  await loadTasksFromServer();
}