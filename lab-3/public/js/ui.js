// js/ui.js
// This file handles all non-collab UI: Modals, Rendering,
// Filtering, and Selection.

import * as store from './taskStore.js';
import { escapeHtml, getPriorityColor, formatDate } from './utils.js';
// No collab imports

// --- UI STATE & VARS ---
export let currentSection = 'inbox';
let selectionMode = false;
let selectedTasks = new Set();
let currentFilter = { type: 'none', value: '' };
let sectionOriginalHTML = {};
let fp; // flatpickr instance

// --- MODAL & POPUP VARS ---
let modal, saveTaskBtn, titleInput, descInput, dateInput, hiddenPriority;
let dateBtn, dateDropdown, priorityBtn, priorityMenu, cancelBtn, filterBtn;
let selectBtn;

// --- RENDER ---
export function render() {
  renderCurrentSection(currentSection);
}

export function setCurrentSection(sectionId) {
  currentSection = sectionId;
}

export function renderCurrentSection(sectionId) {
  currentSection = sectionId;
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
    // Collab cases removed
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

  const filteredTasks = filterTasks(store.tasks);
  if (filteredTasks.length === 0) {
    renderEmptyOrOriginal(contentDiv, 'inbox', 'No tasks match the current filter.');
    return;
  }

  filteredTasks.forEach(task => {
    const actualIndex = store.tasks.indexOf(task);
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    taskDiv.dataset.taskIndex = actualIndex;

    const selectionCheckbox = selectionMode
      ? `<div class="task-checkbox" onclick="toggleTaskSelection(${actualIndex})">
           <i class="fa-regular ${selectedTasks.has(actualIndex) ? 'fa-check-square' : 'fa-square'}" style="color: #fb5a04;"></i>
         </div>`
      : '';

    const actionButtons = selectionMode ? '' : `
      <button class="delete-inbox-button" data-index="${actualIndex}"><i class="fa-solid fa-trash"></i></button>
      <button class="edit-button" data-index="${actualIndex}"><i class="fa-solid fa-pen-to-square"></i></button>
      <button class="confirm-complete-btn" data-index="${actualIndex}"><i class="fa-regular fa-circle-check"></i></button>
    `;

    const formattedDate = formatDate(task.date);
    const dateHtml = (formattedDate && formattedDate !== 'Invalid Date') 
      ? `<span class="due-date"><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>` 
      : '';

    taskDiv.innerHTML = `
      <h3>${selectionCheckbox} ${escapeHtml(task.title)} ${actionButtons}</h3>
      <p>${escapeHtml(task.description || '')}</p>
      <div class="task-priority-container">
        ${task.priority ? `<span class="priority-badge"><i class="fa-regular fa-flag" style="color: ${getPriorityColor(task.priority)};"></i> ${task.priority}</span>` : ''}
        ${dateHtml}
      </div>
      <div class="line"></div>
    `;
    contentDiv.appendChild(taskDiv);

    if (!selectionMode) {
      taskDiv.querySelector('.delete-inbox-button')?.addEventListener('click', () => onDeleteTask(actualIndex, false));
      taskDiv.querySelector('.edit-button')?.addEventListener('click', () => openModalForTask(task, actualIndex));
      taskDiv.querySelector('.confirm-complete-btn')?.addEventListener('click', () => onCompleteTask(actualIndex));
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

async function onRevertTask(index) {
  if (index >= 0 && index < store.completed_tasks.length) {
    store.addTask(store.completed_tasks.splice(index, 1)[0]);
    await store.saveTasks();
    render();
  }
}

function renderCompletedTasks() {
  const section = document.getElementById('completed-tasks');
  if (!section) return;
  const contentDiv = section.querySelector('.completed-tasks-content');
  if (!contentDiv) return;
  contentDiv.innerHTML = '';

  const filteredTasks = filterTasks(store.completed_tasks);
  if (filteredTasks.length === 0) {
    renderEmptyOrOriginal(contentDiv, 'completed-tasks', 'No completed tasks match the current filter.');
    return;
  }

  filteredTasks.forEach(task => {
    const actualIndex = store.completed_tasks.indexOf(task);
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item completed';
    taskDiv.dataset.taskIndex = actualIndex;

    const selectionCheckbox = selectionMode
      ? `<div class="task-checkbox" onclick="toggleTaskSelection(${actualIndex})">
           <i class="fa-regular ${selectedTasks.has(actualIndex) ? 'fa-check-square' : 'fa-square'}" style="color: #fb5a04;"></i>
         </div>`
      : '';

    const actionButtons = selectionMode ? '' : `
      <div class="completed-task-actions">
        <button class="revert-button" data-index="${actualIndex}" title="Revert to inbox">
          <i class="fa-solid fa-undo"></i>
        </button>
        <button class="delete-button" data-index="${actualIndex}" title="Move to deleted tasks">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;

    const formattedDate = formatDate(task.date);
    const dateHtml = (formattedDate && formattedDate !== 'Invalid Date') 
      ? `<span class="due-date completed"><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>` 
      : '';

    taskDiv.innerHTML = `
      <h3 class="completed-title">${selectionCheckbox} ${escapeHtml(task.title)} ${actionButtons}</h3>
      <p class="completed-desc">${escapeHtml(task.description || '')}</p>
      <div class="task-priority-container">
        ${task.priority ? `<span class="priority-badge"><i class="fa-regular fa-flag" style="color: ${getPriorityColor(task.priority)};"></i> ${task.priority}</span>` : ''}
        ${dateHtml}
      </div>
      <div class="line"></div>
    `;
    contentDiv.appendChild(taskDiv);

    if (!selectionMode) {
      taskDiv.querySelector('.revert-button')?.addEventListener('click', () => onRevertTask(actualIndex));
      taskDiv.querySelector('.delete-button')?.addEventListener('click', () => onDeleteTask(actualIndex, true));
    }
  });
}

function renderDeletedTasks() {
  const section = document.getElementById('deleted-tasks');
  if (!section) return;
  const contentDiv = section.querySelector('.deleted-tasks-content');
  if (!contentDiv) return;
  contentDiv.innerHTML = '';

  const filteredTasks = filterTasks(store.deleted_tasks);
  if (filteredTasks.length === 0) {
    renderEmptyOrOriginal(contentDiv, 'deleted-tasks', 'No deleted tasks match the current filter.');
    return;
  }

  filteredTasks.forEach(task => {
    const actualIndex = store.deleted_tasks.indexOf(task);
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item deleted';
    taskDiv.dataset.taskIndex = actualIndex;

    const selectionCheckbox = selectionMode
      ? `<div class="task-checkbox" onclick="toggleTaskSelection(${actualIndex})">
           <i class="fa-regular ${selectedTasks.has(actualIndex) ? 'fa-check-square' : 'fa-square'}" style="color: #fb5a04;"></i>
         </div>`
      : '';

    const actionButtons = selectionMode ? '' : `
      <div class="deleted-task-actions">
        <button class="restore-button" data-index="${actualIndex}" title="Restore to inbox">
          <i class="fa-solid fa-undo"></i>
        </button>
        <button class="permanent-delete-button" data-index="${actualIndex}" title="Delete permanently">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `;
    
    const formattedDate = formatDate(task.date);
    const dateHtml = (formattedDate && formattedDate !== 'Invalid Date')
      ? `<span class="due-date deleted"><i class="fa-regular fa-calendar"></i> ${formattedDate}</span>`
      : '';

    taskDiv.innerHTML = `
      <h3 class="deleted-title">${selectionCheckbox} ${escapeHtml(task.title)}
        <div class="deleted-task-actions-container">${actionButtons}</div>
      </h3>
      <p class="deleted-desc">${escapeHtml(task.description || '')}</p>
      <div class="task-priority-container">
         ${task.priority ? `<span class="priority-badge faded"><i class="fa-regular fa-flag" style="color: ${getPriorityColor(task.priority)};"></i> ${task.priority}</span>` : ''}
         ${dateHtml}
      </div>
      <div class="line"></div>
    `;
    contentDiv.appendChild(taskDiv);

    if (!selectionMode) {
      taskDiv.querySelector('.restore-button')?.addEventListener('click', () => onRestoreTask(actualIndex));
      taskDiv.querySelector('.permanent-delete-button')?.addEventListener('click', () => onPermDeleteTask(actualIndex));
    }
  });
}


// --- TASK ACTION HANDLERS ---
export async function onCompleteTask(index) {
  await store.completeTask(index); 
  // DO NOT call store.saveTasks() here!
  render();
}

export async function onDeleteTask(index, fromCompleted = false) {
  await store.deleteTask(index, fromCompleted);
  render();
}

export async function onRevertTask(index) {
  await store.revertTask(index); // This now works because we added it to taskStore.js
  render();
}

export async function onRestoreTask(index) {
  await store.restoreTask(index);
  render();
}

export async function onPermDeleteTask(index) {
  if (confirm('Are you sure you want to permanently delete this task?')) {
    await store.permanentlyDeleteTask(index);
    render();
  }
}

// --- MODAL ---
export function resetForm() {
  if (titleInput) titleInput.value = '';
  if (descInput) descInput.value = '';
  if (fp) fp.clear();
  if (dateInput) dateInput.value = '';
  if (dateBtn) dateBtn.innerHTML = '<i class="fa-regular fa-calendar"></i> Due Date';
  if (hiddenPriority) hiddenPriority.value = '';
  if (priorityBtn) priorityBtn.innerHTML = '<i class="fa-regular fa-flag"></i> Priority';
  if (saveTaskBtn) {
    delete saveTaskBtn.dataset.editIndex;
  }
}

export function closeAllPopups() {
  dateDropdown?.classList.remove('active');
  priorityMenu?.classList.remove('show');
  document.getElementById('filter-menu')?.classList.remove('show');
}

function updateSaveButtonState() {
  if (!saveTaskBtn || !titleInput) return;
  const disabled = titleInput.value.trim() === '';
  saveTaskBtn.disabled = disabled;
  saveTaskBtn.style.opacity = disabled ? '0.6' : '1';
  saveTaskBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
}

export function openModalForTask(task = null, taskIndex = null) {
  if (!modal) return;
  modal.classList.add('show');
  modal.hidden = false;

  if (task && taskIndex !== null) {
    // --- EDITING A TASK ---
    if (titleInput) titleInput.value = task.title || '';
    if (descInput) descInput.value = task.description || '';
    
    const formattedDate = formatDate(task.date);
    if (formattedDate !== 'Invalid Date') {
      if (dateInput) dateInput.value = task.date;
      if (fp) fp.setDate(task.date, false);
      if (dateBtn) dateBtn.innerHTML = `<i class="fa-regular fa-calendar"></i> ${formattedDate}`;
    } else {
      if (dateInput) dateInput.value = '';
      if (fp) fp.clear();
      if (dateBtn) dateBtn.innerHTML = '<i class="fa-regular fa-calendar"></i> Due Date';
    }

    if (hiddenPriority) hiddenPriority.value = task.priority || '';
    if (task.priority && priorityBtn) {
      let color = '#93E1FF';
      if (task.priority === 'High') color = '#F75A5A';
      else if (task.priority === 'Mid') color = '#F8E067';
      priorityBtn.innerHTML = `<i class="fa-regular fa-flag" style="color: ${color};"></i> ${task.priority}`;
    }
    
    if (saveTaskBtn) {
      saveTaskBtn.textContent = 'Save Task';
      saveTaskBtn.dataset.editIndex = taskIndex;
    }
  } else {
    // --- CREATING A NEW TASK ---
    resetForm();
    if (saveTaskBtn) {
      saveTaskBtn.textContent = 'Add Task';
    }
  }
  updateSaveButtonState();
}

export async function onSaveTask() {
  const title = titleInput?.value.trim();
  if (!title) return;

  const task = {
    title,
    description: descInput?.value.trim(),
    date: dateInput?.value || null,
    priority: hiddenPriority?.value,
  };

  const editIndex = saveTaskBtn.dataset.editIndex;
  
  // FIX 1: Add 'await' to these calls so the code pauses until the DB confirms success
  if (editIndex !== undefined) {
    await store.updateTask(parseInt(editIndex, 10), task); // <--- Add await
  } else {
    await store.addTask(task); // <--- Add await
  }

  render();
  
  modal.classList.remove('show');
  modal.hidden = true;
  closeAllPopups();
  resetForm();
}


// --- FILTER ---
export function filterTasks(list) {
  if (!list) return [];
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
        if (currentFilter.value === 'no-date') return !task.date;
        if (!task.date) return false;
        const taskDate = new Date(task.date);
        if (isNaN(taskDate.getTime())) return false;
        switch (currentFilter.value) {
          case 'today': return taskDate.toDateString() === today.toDateString();
          case 'overdue': return taskDate < today;
          case 'week': return taskDate >= startOfWeek && taskDate <= endOfWeek;
          default: return true;
        }
      });
      break;
    }
    case 'sort':
      if (currentFilter.value === 'newest') {
        filtered = filtered.reverse();
      }
      break;
  }
  return filtered;
}

function applyFilter(type, value) {
  currentFilter = { type, value };
  if (type === 'none') {
    filterBtn.style.color = '#6B6C7E';
    filterBtn.title = 'Filter tasks';
  } else {
    filterBtn.style.color = '#fb5a04';
    filterBtn.title = `Filtered by ${type}: ${value}`;
  }
  render();
}

function clearFilter() {
  applyFilter('none', '');
}
window.clearFilter = clearFilter; // For HTML onclick

function createFilterMenu() {
  const filterMenu = document.createElement('div');
  filterMenu.id = 'filter-menu';
  filterMenu.className = 'filter-menu';
  filterMenu.innerHTML = `
    <div class="filter-section">
      <h4>Filter by Priority</h4>
      <button data-filter="priority" data-value="High"><i class="fa-regular fa-flag" style="color: #F75A5A;"></i> High</button>
      <button data-filter="priority" data-value="Mid"><i class="fa-regular fa-flag" style="color: #F8E067;"></i> Mid</button>
      <button data-filter="priority" data-value="Low"><i class="fa-regular fa-flag" style="color: #93E1FF;"></i> Low</button>
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
  
  if (filterBtn) {
    filterBtn.parentNode.appendChild(filterMenu);
  }
  
  filterMenu.querySelectorAll('button[data-filter]').forEach(option => {
    option.addEventListener('click', function () {
      applyFilter(this.getAttribute('data-filter'), this.getAttribute('data-value'));
      filterMenu.classList.remove('show');
    });
  });
  filterMenu.querySelector('.clear-filter-btn').addEventListener('click', () => {
    clearFilter();
    filterMenu.classList.remove('show');
  });
  
  return filterMenu;
}

// --- SELECTION ---
function enterSelectionMode() {
  selectionMode = true;
  selectedTasks.clear();
  if (selectBtn) {
    selectBtn.style.color = '#fb5a04';
    selectBtn.innerHTML = '<i class="fa-solid fa-circle-check fa-lg" style="color: #fb5a04;"></i>';
    selectBtn.title = 'Exit selection mode';
  }
  showSelectionToolbar();
  render();
}

export function exitSelectionMode() {
  selectionMode = false;
  selectedTasks.clear();
  if (selectBtn) {
    selectBtn.style.color = '#6B6C7E';
    selectBtn.innerHTML = '<i class="fa-regular fa-circle fa-lg" style="color: #6B6C7E;"></i>';
    selectBtn.title = 'Select tasks';
  }
  hideSelectionToolbar();
  render();
}

function toggleTaskSelection(index) {
  if (selectedTasks.has(index)) {
    selectedTasks.delete(index);
  } else {
    selectedTasks.add(index);
  }
  updateSelectionCount();
  const checkbox = document.querySelector(`[data-task-index="${index}"] .task-checkbox i`);
  if (checkbox) {
    checkbox.classList.toggle('fa-square', !selectedTasks.has(index));
    checkbox.classList.toggle('fa-check-square', selectedTasks.has(index));
  }
}
window.toggleTaskSelection = toggleTaskSelection; // For HTML onclick

function showSelectionToolbar() {
  const existingToolbar = document.getElementById('selection-toolbar');
  if (existingToolbar) existingToolbar.remove();

  const toolbar = document.createElement('div');
  toolbar.id = 'selection-toolbar';
  toolbar.className = 'selection-toolbar';

  let actions = [];
  
  if (currentSection === 'inbox') {
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
  if (settingsDisplay) {
    settingsDisplay.insertAdjacentElement('afterend', toolbar);
  }
  
  addSelectionToolbarListeners(toolbar);
  updateSelectionCount();
}

function hideSelectionToolbar() {
  const toolbar = document.getElementById('selection-toolbar');
  if (toolbar) toolbar.remove();
}

function updateSelectionCount() {
  const countElement = document.getElementById('selection-count');
  const count = selectedTasks.size;
  if (countElement) {
    countElement.textContent = `(${count} selected)`;
  }
  const actionButtons = document.querySelectorAll('.selection-toolbar .selection-actions button:not(.cancel-selection)');
  actionButtons.forEach(btn => {
    btn.disabled = (count === 0);
    btn.style.opacity = (count === 0) ? '0.5' : '1';
  });
}

function addSelectionToolbarListeners(toolbar) {
  toolbar.querySelector('.cancel-selection').addEventListener('click', exitSelectionMode);

  toolbar.querySelector('.complete-selected')?.addEventListener('click', async () => {
    const indices = Array.from(selectedTasks).sort((a, b) => b - a);
    for (const index of indices) {
      store.completeTask(index);
    }
    await store.saveTasks();
    exitSelectionMode();
  });
  
  toolbar.querySelector('.delete-selected')?.addEventListener('click', async () => {
    const fromCompleted = (currentSection === 'completed-tasks');
    const indices = Array.from(selectedTasks).sort((a, b) => b - a);
    for (const index of indices) {
      store.deleteTask(index, fromCompleted);
    }
    await store.saveTasks();
    exitSelectionMode();
  });

  toolbar.querySelector('.revert-selected')?.addEventListener('click', async () => {
    const indices = Array.from(selectedTasks).sort((a, b) => b - a);
    for (const index of indices) {
      if (index >= 0 && index < store.completed_tasks.length) {
        store.addTask(store.completed_tasks.splice(index, 1)[0]);
      }
    }
    await store.saveTasks();
    exitSelectionMode();
  });

  toolbar.querySelector('.recover-selected')?.addEventListener('click', async () => {
    const indices = Array.from(selectedTasks).sort((a, b) => b - a);
    for (const index of indices) store.restoreTask(index);
    await store.saveTasks();
    exitSelectionMode();
  });

  toolbar.querySelector('.permanent-delete-selected')?.addEventListener('click', async () => {
    if (confirm(`Are you sure you want to permanently delete ${selectedTasks.size} task(s)?`)) {
      const indices = Array.from(selectedTasks).sort((a, b) => b - a);
      for (const index of indices) store.permanentlyDeleteTask(index);
      await store.saveTasks();
      exitSelectionMode();
    }
  });
}


// --- INITIALIZATION ---
export function initUI() {
  // 1. Cache HTML
  document.querySelectorAll('.content-section').forEach(sec => {
    const contentDiv = sec.querySelector('.inbox-content, .completed-tasks-content, .deleted-tasks-content, .collab-detail-content');
    if (contentDiv) sectionOriginalHTML[sec.id] = contentDiv.innerHTML;
  });

  // 2. Init flatpickr
  if (window.flatpickr) {
    fp = flatpickr('#task-date', {
      enableTime: true,
      dateFormat: "Z", // Use ISO 8601 format
      time_24hr: false,
      inline: true,
      appendTo: document.getElementById('date-picker-dropdown')
    });
  }

  // 3. Query all DOM elements
  modal = document.getElementById('taskModal');
  saveTaskBtn = document.querySelector('.save-task-btn');
  titleInput = document.getElementById('task-title');
  descInput = document.getElementById('task-desc');
  dateInput = document.getElementById('task-date');
  hiddenPriority = document.getElementById('task-priority');
  dateBtn = document.getElementById('task-date-btn');
  dateDropdown = document.getElementById('date-picker-dropdown');
  priorityBtn = document.getElementById('task-priority-btn');
  priorityMenu = document.getElementById('priority-menu');
  cancelBtn = document.querySelector('.cancel-btn');
  filterBtn = document.querySelector('.settings-display button:first-child');
  selectBtn = document.querySelector('.settings-display button:nth-child(2)');

  // 4. Add ALL event listeners
  document.querySelectorAll('.add-task-btn1, .add-task-btn2').forEach(btn => btn.addEventListener('click', () => openModalForTask()));
  cancelBtn?.addEventListener('click', () => {
    modal.classList.remove('show');
    modal.hidden = true;
    resetForm();
    closeAllPopups();
    saveTaskBtn.onclick = onSaveTask; // Reset to default save
  });
  saveTaskBtn?.addEventListener('click', onSaveTask); // Default save action
  titleInput?.addEventListener('input', updateSaveButtonState);
  
  dateBtn?.addEventListener('click', (e) => { e.stopPropagation(); dateDropdown.classList.toggle('active'); });
  document.getElementById('confirm-date')?.addEventListener('click', () => {
    if (fp && fp.selectedDates.length > 0) {
      const selectedDate = fp.selectedDates[0];
      dateBtn.innerHTML = `<i class="fa-regular fa-calendar"></i> ${formatDate(selectedDate)}`;
      dateInput.value = selectedDate.toISOString(); // Save as ISO string
    }
    dateDropdown.classList.remove('active');
  });
  document.getElementById('cancel-date')?.addEventListener('click', () => {
    if (fp) fp.clear();
    dateInput.value = ''; // Clear hidden input
    dateBtn.innerHTML = '<i class="fa-regular fa-calendar"></i> Due Date';
    dateDropdown.classList.remove('active');
  });
  
  priorityBtn?.addEventListener('click', (e) => { e.stopPropagation(); priorityMenu.classList.toggle('show'); });
  document.querySelectorAll('#priority-menu button').forEach(btn => btn.addEventListener('click', function() {
    hiddenPriority.value = this.getAttribute('data-value');
    priorityBtn.innerHTML = `<i class="fa-regular fa-flag" style="color: ${this.querySelector('i').style.color};"></i> ${this.getAttribute('data-value')}`;
    priorityMenu.classList.remove('show');
  }));

  document.addEventListener('click', (e) => {
    if (dateDropdown && !dateDropdown.contains(e.target) && e.target !== dateBtn) dateDropdown.classList.remove('active');
    if (priorityMenu && !priorityMenu.contains(e.target) && e.target !== priorityBtn) priorityMenu.classList.remove('show');
    if (filterBtn && !document.getElementById('filter-menu')?.contains(e.target) && e.target !== filterBtn) {
      document.getElementById('filter-menu')?.classList.remove('show');
    }
  });
  
  if (filterBtn) {
    createFilterMenu();
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('filter-menu').classList.toggle('show');
    });
  }

  selectBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectionMode ? exitSelectionMode() : enterSelectionMode();
  });
}