// Run this code when the page is fully loaded
document.addEventListener("DOMContentLoaded", function() {

    // ------------------ ELEMENTS ------------------
    var menuItems = document.querySelectorAll(".menu-content li a");
    var sections = document.querySelectorAll(".content-section");
    var addTaskBtns = document.querySelectorAll(".add-task-btn1, .add-task-btn2");

    var modal = document.getElementById("taskModal");
    var cancelBtn = document.querySelector(".cancel-btn");
    var saveTaskBtn = document.querySelector(".save-task-btn");

    var dateInput = document.getElementById("task-date");
    var dateBtn = document.getElementById("task-date-btn");
    var dateDropdown = document.getElementById("date-picker-dropdown");
    var confirmDateBtn = document.getElementById("confirm-date");
    var cancelDateBtn = document.getElementById("cancel-date");

    var priorityBtn = document.getElementById("task-priority-btn");
    var priorityMenu = document.getElementById("priority-menu");
    var hiddenPriority = document.getElementById("task-priority");

    // Settings buttons
    var filterBtn = document.querySelector(".settings-display button:first-child");
    var selectBtn = document.querySelector(".settings-display button:nth-child(2)");

    // ------------------ SAVE ORIGINAL SECTION HTML ------------------
    var sectionOriginalHTML = {};
    document.querySelectorAll(".content-section").forEach(section => {
        var contentDiv = section.querySelector(".inbox-content, .completed-tasks-content, .deleted-tasks-content");
        if (contentDiv) {
            sectionOriginalHTML[section.id] = contentDiv.innerHTML;
        }
    });

    // ------------------ DATA STORAGE ------------------
    var tasks = [];
    var completed_tasks = [];
    var deleted_tasks = [];
    
    // Filter and selection state
    var currentFilter = { type: "none", value: "" };
    var selectionMode = false;
    var selectedTasks = new Set();
    var currentSection = "inbox";

    // ------------------ HELPER FUNCTIONS ------------------
    function resetForm() {
        var t = document.getElementById("task-title");
        var d = document.getElementById("task-desc");
        if (t) t.value = "";
        if (d) d.value = "";

        if (window.flatpickr && fp) {
            fp.clear();
        }
        if (dateBtn) {
            dateBtn.innerHTML = '<i class="fa-regular fa-calendar"></i> Due Date';
        }

        if (hiddenPriority) hiddenPriority.value = "";
        if (priorityBtn) {
            priorityBtn.innerHTML = '<i class="fa-regular fa-flag"></i> Priority';
        }
    }

    function closeAllPopups() {
        if (dateDropdown) dateDropdown.classList.remove("active");
        if (priorityMenu) priorityMenu.classList.remove("show");
        // Close filter menu
        var filterMenu = document.getElementById("filter-menu");
        if (filterMenu) filterMenu.classList.remove("show");
    }

    function escapeHtml(text) {
        if (!text) return "";
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // ------------------ NAVIGATION ------------------
    function showSection(id) {
        // Hide all sections
        for (var i = 0; i < sections.length; i++) {
            sections[i].classList.remove("active");
            sections[i].hidden = true;
        }
        
        // Show target section
        var target = document.getElementById(id);
        if (target) {
            target.classList.add("active");
            target.hidden = false;
            currentSection = id;
            // Exit selection mode when switching sections
            exitSelectionMode();
            // Render appropriate content based on section
            renderCurrentSection(id);
        }
    }

    // Initialize with inbox section
    if (sections.length > 0) {
        showSection("inbox");
        if (menuItems[0]) {
            menuItems[0].parentElement.classList.add("active");
        }
    }

    // Menu navigation
    for (var i = 0; i < menuItems.length; i++) {
        menuItems[i].addEventListener("click", function(e) {
            e.preventDefault();
            // Remove active class from all menu items
            for (var j = 0; j < menuItems.length; j++) {
                menuItems[j].parentElement.classList.remove("active");
            }
            // Add active class to clicked item
            this.parentElement.classList.add("active");
            var targetId = this.getAttribute("data-target");
            showSection(targetId);
        });
    }

    // ------------------ MODAL ------------------
    function openModalForTask(task = null, taskIndex = null) {
        if (!modal) return;
        
        modal.classList.add("show");
        modal.hidden = false;
        
        var titleInput = document.getElementById("task-title");
        
        if (task && taskIndex !== null) {
            // Edit mode
            var descInput = document.getElementById("task-desc");
            
            if (titleInput) titleInput.value = task.title || "";
            if (descInput) descInput.value = task.description || "";
            if (dateInput) dateInput.value = task.date || "";
            if (hiddenPriority) hiddenPriority.value = task.priority || "";
            
            // Update priority button display
            if (task.priority && priorityBtn) {
                let color = "#93E1FF"; // Low priority color
                if (task.priority === "High") color = "#F75A5A";
                else if (task.priority === "Mid") color = "#F8E067";
                
                priorityBtn.innerHTML = `<i class="fa-regular fa-flag" style="color: ${color};"></i> ${task.priority}`;
            }
            
            // Update date button display
            if (task.date && dateBtn) {
                try {
                    var dateObj = new Date(task.date);
                    var formatted = dateObj.toLocaleString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    });
                    dateBtn.innerHTML = '<i class="fa-regular fa-calendar"></i> ' + formatted;
                } catch (e) {
                    dateBtn.innerHTML = '<i class="fa-regular fa-calendar"></i> Due Date';
                }
            }
            
            if (saveTaskBtn) {
                saveTaskBtn.textContent = "Save Task";
                saveTaskBtn.dataset.editIndex = taskIndex;
            }
        } else {
            // Add new task mode
            resetForm();
            if (saveTaskBtn) {
                saveTaskBtn.textContent = "Add Task";
                delete saveTaskBtn.dataset.editIndex;
            }
        }
        
        updateSaveButtonState();
    }

    // Add task button listeners
    for (var i = 0; i < addTaskBtns.length; i++) {
        addTaskBtns[i].addEventListener("click", function() {
            openModalForTask();
        });
    }

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener("click", function() {
            resetForm();
            modal.classList.remove("show");
            modal.hidden = true;
            closeAllPopups();
        });
    }

    // Close modal if clicked outside
    window.addEventListener("click", function(e) {
        if (e.target === modal) {
            resetForm();
            modal.classList.remove("show");
            modal.hidden = true;
            closeAllPopups();
        }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            if (modal) {
                modal.classList.remove("show");
                modal.hidden = true;
            }
            closeAllPopups();
        }
        if (e.key === "Enter" && modal && !modal.hidden && saveTaskBtn && !saveTaskBtn.disabled) {
            saveTaskBtn.click();
        }
    });

    // ------------------ FLATPICKR (DATE PICKER) ------------------
    var fp;
    if (window.flatpickr && dateInput) {
        fp = flatpickr("#task-date", {
            enableTime: true,
            dateFormat: "Y-m-d h:i K", // 12-hour format
            time_24hr: false,
            inline: true,
            appendTo: dateDropdown
        });
    }

    // Toggle date dropdown
    if (dateBtn) {
        dateBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            if (dateDropdown) dateDropdown.classList.toggle("active");
            if (priorityMenu) priorityMenu.classList.remove("show");
        });
    }

    // Confirm date
    if (confirmDateBtn) {
        confirmDateBtn.addEventListener("click", function() {
            if (fp && fp.selectedDates.length > 0) {
                var selected = fp.selectedDates[0];
                var formatted = selected.toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
                if (dateBtn) {
                    dateBtn.innerHTML = '<i class="fa-regular fa-calendar"></i> ' + formatted;
                }
            }
            if (dateDropdown) dateDropdown.classList.remove("active");
        });
    }

    // Cancel date
    if (cancelDateBtn) {
        cancelDateBtn.addEventListener("click", function() {
            if (fp) fp.clear();
            if (dateBtn) dateBtn.innerHTML = '<i class="fa-regular fa-calendar"></i> Due Date';
            if (dateDropdown) dateDropdown.classList.remove("active");
        });
    }

    // ------------------ PRIORITY ------------------
    if (priorityBtn) {
        priorityBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            if (priorityMenu) priorityMenu.classList.toggle("show");
            if (dateDropdown) dateDropdown.classList.remove("active");
        });
    }

    var priorityButtons = document.querySelectorAll("#priority-menu button");
    for (var i = 0; i < priorityButtons.length; i++) {
        priorityButtons[i].addEventListener("click", function() {
            if (hiddenPriority) {
                hiddenPriority.value = this.getAttribute("data-value");
            }

            // Get the color of the <i> inside the clicked button
            var iconColor = this.querySelector("i").style.color;

            // Update main priority button with icon and value
            if (priorityBtn) {
                priorityBtn.innerHTML = `<i class="fa-regular fa-flag"></i> ${this.getAttribute("data-value")}`;
                
                // Apply the color to the icon
                var icon = priorityBtn.querySelector("i");
                if (icon) {
                    icon.style.color = iconColor;
                }
            }

            // Hide the priority menu
            if (priorityMenu) priorityMenu.classList.remove("show");
        });
    }

    // Close popups if clicked outside
    document.addEventListener("click", function(e) {
        if (dateDropdown && !dateDropdown.contains(e.target) && e.target !== dateBtn) {
            dateDropdown.classList.remove("active");
        }
        if (priorityMenu && !priorityMenu.contains(e.target) && e.target !== priorityBtn) {
            priorityMenu.classList.remove("show");
        }
        // Close filter menu
        var filterMenu = document.getElementById("filter-menu");
        if (filterMenu && !filterMenu.contains(e.target) && e.target !== filterBtn) {
            filterMenu.classList.remove("show");
        }
    });

    // ------------------ SAVE TASK ------------------
    var titleInput = document.getElementById("task-title");

    // Helper function to update save button state
    function updateSaveButtonState() {
        if (!saveTaskBtn || !titleInput) return;
        
        if (titleInput.value.trim() === "") {
            saveTaskBtn.disabled = true;
            saveTaskBtn.style.opacity = "0.6";
            saveTaskBtn.style.cursor = "not-allowed";
        } else {
            saveTaskBtn.disabled = false;
            saveTaskBtn.style.opacity = "1";
            saveTaskBtn.style.cursor = "pointer";
        }
    }

    // Initialize save button state
    if (titleInput) {
        updateSaveButtonState();
        titleInput.addEventListener("input", updateSaveButtonState);
    }

    if (saveTaskBtn) {
        saveTaskBtn.addEventListener("click", function() {
            var title = document.getElementById("task-title").value.trim();
            var desc = document.getElementById("task-desc").value.trim();
            var date = dateInput ? dateInput.value : "";
            var priority = hiddenPriority ? hiddenPriority.value : "";

            if (title === "") return; // safety check

            // Check if editing existing task
            if (saveTaskBtn.dataset.editIndex !== undefined) {
                var index = parseInt(saveTaskBtn.dataset.editIndex);
                if (index >= 0 && index < tasks.length) {
                    tasks[index] = { title, description: desc, date, priority };
                }
                delete saveTaskBtn.dataset.editIndex;
            } else {
                // Add new task
                tasks.push({ title, description: desc, date, priority });
            }

            // Close modal and refresh view
            modal.classList.remove("show");
            modal.hidden = true;
            closeAllPopups();
            resetForm();
            
            // Re-render current section
            var activeSection = document.querySelector(".content-section.active");
            if (activeSection) {
                renderCurrentSection(activeSection.id);
            }
        });
    }

    // ------------------ FILTER FUNCTIONALITY ------------------
    function createFilterMenu() {
        var filterMenu = document.createElement("div");
        filterMenu.id = "filter-menu";
        filterMenu.className = "filter-menu";
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
        
        // Position the menu near the filter button
        filterBtn.parentNode.appendChild(filterMenu);
        
        // Add event listeners to filter options
        var filterOptions = filterMenu.querySelectorAll("button[data-filter]");
        for (var i = 0; i < filterOptions.length; i++) {
            filterOptions[i].addEventListener("click", function() {
                applyFilter(this.getAttribute("data-filter"), this.getAttribute("data-value"));
                filterMenu.classList.remove("show");
            });
        }
        
        // Clear filter button
        var clearBtn = filterMenu.querySelector(".clear-filter-btn");
        clearBtn.addEventListener("click", function() {
            clearFilter();
            filterMenu.classList.remove("show");
        });
        
        return filterMenu;
    }

    function applyFilter(type, value) {
        currentFilter = { type: type, value: value };
        
        // Update filter button to show active filter
        if (type === "none") {
            filterBtn.style.color = "#6B6C7E";
            filterBtn.title = "Filter tasks";
        } else {
            filterBtn.style.color = "#fb5a04";
            filterBtn.title = `Filtered by ${type}: ${value}`;
        }
        
        renderCurrentSection(currentSection);
    }

    function clearFilter() {
        applyFilter("none", "");
    }

    function filterTasks(tasksArray) {
        if (currentFilter.type === "none") return tasksArray;
        
        var filtered = tasksArray.slice(); // Create a copy
        
        switch (currentFilter.type) {
            case "priority":
                filtered = filtered.filter(task => task.priority === currentFilter.value);
                break;
                
            case "due":
                var today = new Date();
                today.setHours(23, 59, 59, 999);
                var startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                var endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                
                filtered = filtered.filter(task => {
                    if (currentFilter.value === "no-date") {
                        return !task.date;
                    }
                    if (!task.date) return false;
                    
                    var taskDate = new Date(task.date);
                    
                    switch (currentFilter.value) {
                        case "today":
                            return taskDate.toDateString() === today.toDateString();
                        case "overdue":
                            return taskDate < today;
                        case "week":
                            return taskDate >= startOfWeek && taskDate <= endOfWeek;
                        default:
                            return true;
                    }
                });
                break;
                
            case "sort":
                // For sorting, we'll handle it differently since tasks don't have creation dates
                // We'll use array index as a proxy for creation order
                if (currentFilter.value === "oldest") {
                    // Keep original order (oldest first)
                } else if (currentFilter.value === "newest") {
                    filtered = filtered.reverse();
                }
                break;
        }
        
        return filtered;
    }

    // Filter button event listener
    if (filterBtn) {
        filterBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            var filterMenu = document.getElementById("filter-menu");
            
            if (!filterMenu) {
                filterMenu = createFilterMenu();
            }
            
            // Close other popups first
            if (dateDropdown) dateDropdown.classList.remove("active");
            if (priorityMenu) priorityMenu.classList.remove("show");
            
            // Then toggle filter menu
            filterMenu.classList.toggle("show");
        });
    }

    // ------------------ SELECTION FUNCTIONALITY ------------------
    function enterSelectionMode() {
        selectionMode = true;
        selectedTasks.clear();
        
        // Update select button appearance
        selectBtn.style.color = "#fb5a04";
        selectBtn.innerHTML = '<i class="fa-solid fa-circle-check fa-lg" style="color: #fb5a04;"></i>';
        selectBtn.title = "Exit selection mode";
        
        // Show selection toolbar
        showSelectionToolbar();
        
        // Re-render to show checkboxes
        renderCurrentSection(currentSection);
    }

    function exitSelectionMode() {
        selectionMode = false;
        selectedTasks.clear();
        
        // Reset select button appearance
        selectBtn.style.color = "#6B6C7E";
        selectBtn.innerHTML = '<i class="fa-regular fa-circle fa-lg" style="color: #6B6C7E;"></i>';
        selectBtn.title = "Select tasks";
        
        // Hide selection toolbar
        hideSelectionToolbar();
        
        // Re-render to hide checkboxes
        renderCurrentSection(currentSection);
    }

    function showSelectionToolbar() {
        var existingToolbar = document.getElementById("selection-toolbar");
        if (existingToolbar) {
            existingToolbar.remove();
        }
        
        var toolbar = document.createElement("div");
        toolbar.id = "selection-toolbar";
        toolbar.className = "selection-toolbar";
        
        var actions = [];
        
        // Define actions based on current section
        if (currentSection === "inbox") {
            actions = [
                { text: "Delete", class: "delete-selected", icon: "fa-trash", color: "#f3121d" },
                { text: "Complete", class: "complete-selected", icon: "fa-circle-check", color: "#27d343" }
            ];
        } else if (currentSection === "completed-tasks") {
            actions = [
                { text: "Delete", class: "delete-selected", icon: "fa-trash", color: "#f3121d" },
                { text: "Revert", class: "revert-selected", icon: "fa-undo", color: "#4CAF50" }
            ];
        } else if (currentSection === "deleted-tasks") {
            actions = [
                { text: "Delete Forever", class: "permanent-delete-selected", icon: "fa-times", color: "#f3121d" },
                { text: "Recover", class: "recover-selected", icon: "fa-undo", color: "#4CAF50" }
            ];
        }
        
        var actionsHTML = actions.map(action => 
            `<button class="${action.class}" disabled>
                <i class="fa-solid ${action.icon}" style="color: ${action.color};"></i> 
                ${action.text}
            </button>`
        ).join("");
        
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
        
        // Insert toolbar after settings-display
        var settingsDisplay = document.querySelector(".settings-display");
        settingsDisplay.insertAdjacentElement("afterend", toolbar);
        
        // Add event listeners
        addSelectionToolbarListeners(toolbar);
    }

    function hideSelectionToolbar() {
        var toolbar = document.getElementById("selection-toolbar");
        if (toolbar) {
            toolbar.remove();
        }
    }

    function addSelectionToolbarListeners(toolbar) {
        // Cancel button
        var cancelBtn = toolbar.querySelector(".cancel-selection");
        cancelBtn.addEventListener("click", exitSelectionMode);
        
        // Action buttons
        var completeBtn = toolbar.querySelector(".complete-selected");
        if (completeBtn) {
            completeBtn.addEventListener("click", () => {
                var indices = Array.from(selectedTasks).sort((a, b) => b - a); // Sort descending to avoid index issues
                indices.forEach(index => completeTask(index));
                exitSelectionMode();
            });
        }
        
        var deleteBtn = toolbar.querySelector(".delete-selected");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => {
                var indices = Array.from(selectedTasks).sort((a, b) => b - a);
                var fromCompleted = currentSection === "completed-tasks";
                indices.forEach(index => deleteTask(index, fromCompleted));
                exitSelectionMode();
            });
        }
        
        var revertBtn = toolbar.querySelector(".revert-selected");
        if (revertBtn) {
            revertBtn.addEventListener("click", () => {
                var indices = Array.from(selectedTasks).sort((a, b) => b - a);
                indices.forEach(index => {
                    // Move from completed back to inbox
                    if (index >= 0 && index < completed_tasks.length) {
                        var task = completed_tasks[index];
                        tasks.push(task);
                        completed_tasks.splice(index, 1);
                    }
                });
                exitSelectionMode();
                renderCurrentSection(currentSection);
            });
        }
        
        var recoverBtn = toolbar.querySelector(".recover-selected");
        if (recoverBtn) {
            recoverBtn.addEventListener("click", () => {
                var indices = Array.from(selectedTasks).sort((a, b) => b - a);
                indices.forEach(index => restoreTask(index));
                exitSelectionMode();
            });
        }
        
        var permanentDeleteBtn = toolbar.querySelector(".permanent-delete-selected");
        if (permanentDeleteBtn) {
            permanentDeleteBtn.addEventListener("click", () => {
                if (confirm(`Are you sure you want to permanently delete ${selectedTasks.size} task(s)? This action cannot be undone.`)) {
                    var indices = Array.from(selectedTasks).sort((a, b) => b - a);
                    indices.forEach(index => permanentlyDeleteTask(index));
                    exitSelectionMode();
                }
            });
        }
    }

    function updateSelectionCount() {
        var countElement = document.getElementById("selection-count");
        if (countElement) {
            var count = selectedTasks.size;
            countElement.textContent = count === 0 ? "(0 selected)" : 
                                     count === 1 ? "(1 selected)" : 
                                     `(${count} selected)`;
        }
        
        // Enable/disable action buttons based on selection
        var actionButtons = document.querySelectorAll(".selection-toolbar .selection-actions button:not(.cancel-selection)");
        actionButtons.forEach(btn => {
            btn.disabled = selectedTasks.size === 0;
            btn.style.opacity = selectedTasks.size === 0 ? "0.5" : "1";
        });
    }

    function toggleTaskSelection(index) {
        if (selectedTasks.has(index)) {
            selectedTasks.delete(index);
        } else {
            selectedTasks.add(index);
        }
        updateSelectionCount();
        
        // Update checkbox appearance
        var checkbox = document.querySelector(`[data-task-index="${index}"] .task-checkbox`);
        if (checkbox) {
            if (selectedTasks.has(index)) {
                checkbox.innerHTML = '<i class="fa-solid fa-check-square" style="color: #fb5a04;"></i>';
            } else {
                checkbox.innerHTML = '<i class="fa-regular fa-square"></i>';
            }
        }
    }

    // Select button event listener
    if (selectBtn) {
        selectBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            if (selectionMode) {
                exitSelectionMode();
            } else {
                enterSelectionMode();
            }
        });
    }

    // ------------------ TASK ACTIONS ------------------
    function completeTask(index) {
        if (index >= 0 && index < tasks.length) {
            var task = tasks[index];
            completed_tasks.push(task);
            tasks.splice(index, 1);
            
            var activeSection = document.querySelector(".content-section.active");
            if (activeSection) {
                renderCurrentSection(activeSection.id);
            }
        }
    }

    function deleteTask(index, fromCompleted = false) {
        var sourceArray = fromCompleted ? completed_tasks : tasks;
        if (index >= 0 && index < sourceArray.length) {
            var task = sourceArray[index];
            deleted_tasks.push(task);
            sourceArray.splice(index, 1);
            
            var activeSection = document.querySelector(".content-section.active");
            if (activeSection) {
                renderCurrentSection(activeSection.id);
            }
        }
    }

    function restoreTask(index) {
        if (index >= 0 && index < deleted_tasks.length) {
            var task = deleted_tasks[index];
            tasks.push(task);
            deleted_tasks.splice(index, 1);
            
            var activeSection = document.querySelector(".content-section.active");
            if (activeSection) {
                renderCurrentSection(activeSection.id);
            }
        }
    }

    function permanentlyDeleteTask(index) {
        if (index >= 0 && index < deleted_tasks.length) {
            deleted_tasks.splice(index, 1);
            
            var activeSection = document.querySelector(".content-section.active");
            if (activeSection) {
                renderCurrentSection(activeSection.id);
            }
        }
    }

    // ------------------ RENDER FUNCTIONS ------------------
    function renderCurrentSection(sectionId) {
        switch(sectionId) {
            case "inbox":
                renderInboxTasks();
                break;
            case "completed-tasks":
                renderCompletedTasks();
                break;
            case "deleted-tasks":
                renderDeletedTasks();
                break;
            default:
                renderInboxTasks();
        }
    }

    function renderInboxTasks() {
        var section = document.getElementById("inbox");
        if (!section) return;
        
        var contentDiv = section.querySelector(".inbox-content");
        if (!contentDiv) return;

        // Clear content
        contentDiv.innerHTML = "";

        // Apply filters
        var filteredTasks = filterTasks(tasks);

        if (filteredTasks.length === 0) {
            if (currentFilter.type !== "none") {
                // Show "no results" message for filtered view
                contentDiv.innerHTML = `
                    <div class="no-results">
                        <p>No tasks match the current filter.</p>
                        <button onclick="clearFilter()">Clear Filter</button>
                    </div>
                `;
            } else {
                // Restore original content when no tasks
                contentDiv.innerHTML = sectionOriginalHTML["inbox"] || "";
                
                // Reattach Add Task button listeners
                var addTaskBtns = contentDiv.querySelectorAll(".add-task-btn2, .add-task-btn3");
                addTaskBtns.forEach(btn => {
                    btn.addEventListener("click", () => openModalForTask());
                });
            }
            return;
        }

        // Render tasks
        filteredTasks.forEach((task, displayIndex) => {
            var actualIndex = tasks.indexOf(task); // Get actual index in original array
            var taskDiv = document.createElement("div");
            taskDiv.className = "task-item";
            taskDiv.setAttribute("data-task-index", actualIndex);
            
            var selectionCheckbox = selectionMode ? `
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
            ` : "";
            
            var actionButtons = selectionMode ? "" : `
                <button class="edit-button" data-index="${actualIndex}">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="confirm-complete-btn" data-index="${actualIndex}">
                    <i class="fa-regular fa-circle-check"></i>
                </button>
            `;
            
            taskDiv.innerHTML = `
                <h3>${selectionCheckbox} ${escapeHtml(task.title)} ${actionButtons}</h3>
                <p>${escapeHtml(task.description || "")}</p>
                <div class="task-priority-container">
                    ${task.priority ? `<span class="priority-badge priority-${task.priority.toLowerCase()}">
                        <i class="fa-regular fa-flag" style="color: ${getPriorityColor(task.priority)};"></i> 
                        ${task.priority}
                    </span>` : ""}
                    ${task.date ? `<span class="due-date">
                        <i class="fa-regular fa-calendar"></i> 
                        ${formatDate(task.date)}
                    </span>` : ""}
                </div>
                <div class="line"></div>
            `;
            contentDiv.appendChild(taskDiv);

            if (!selectionMode) {
                // Edit button
                var editBtn = taskDiv.querySelector(".edit-button");
                if (editBtn) {
                    editBtn.addEventListener("click", () => {
                        openModalForTask(task, actualIndex);
                    });
                }

                // Complete button
                var completeBtn = taskDiv.querySelector(".confirm-complete-btn");
                if (completeBtn) {
                    completeBtn.addEventListener("click", () => {
                        completeTask(actualIndex);
                    });
                }
            }
        });

        // Add dynamic Add Task button (only when not in selection mode)
        if (!selectionMode) {
            var addTaskBtn = document.createElement("button");
            addTaskBtn.className = "add-task-btn3";
            addTaskBtn.innerHTML = '<i class="fa-solid fa-plus" style="color: #FF621C;"></i> Add Task';
            addTaskBtn.addEventListener("click", () => openModalForTask());
            contentDiv.appendChild(addTaskBtn);
        }
    }

    function renderCompletedTasks() {
        var section = document.getElementById("completed-tasks");
        if (!section) return;
        
        var contentDiv = section.querySelector(".completed-tasks-content");
        if (!contentDiv) return;

        // Clear content
        contentDiv.innerHTML = "";

        // Apply filters
        var filteredTasks = filterTasks(completed_tasks);

        if (filteredTasks.length === 0) {
            if (currentFilter.type !== "none") {
                contentDiv.innerHTML = `
                    <div class="no-results">
                        <p>No completed tasks match the current filter.</p>
                        <button onclick="clearFilter()">Clear Filter</button>
                    </div>
                `;
            } else {
                contentDiv.innerHTML = sectionOriginalHTML["completed-tasks"] || "";
            }
            return;
        }

        // Render completed tasks
        filteredTasks.forEach((task, displayIndex) => {
            var actualIndex = completed_tasks.indexOf(task);
            var taskDiv = document.createElement("div");
            taskDiv.className = "task-item completed";
            taskDiv.setAttribute("data-task-index", actualIndex);
            
            var selectionCheckbox = selectionMode ? `
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
            ` : "";
            
            var actionButtons = selectionMode ? "" : `
                <div class="completed-task-actions">
                    <button class="delete-button" data-index="${actualIndex}" title="Move to deleted tasks">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;

            var restoreBtn = taskDiv.querySelector(".restore-button");
            if (restoreBtn) {
                restoreBtn.addEventListener("click", () => {
                    // Move from completed_tasks to inbox (tasks)
                    if (actualIndex >= 0 && actualIndex < completed_tasks.length) {
                        var task = completed_tasks[actualIndex];
                        tasks.push(task);
                        completed_tasks.splice(actualIndex, 1);
                        renderCurrentSection("completed-tasks");
                    }
                });
            }
            
            taskDiv.innerHTML = `
                <h3 class="completed-title">${selectionCheckbox} ${escapeHtml(task.title)} ${actionButtons}</h3>
                <p class="completed-desc">${escapeHtml(task.description || "")}</p>
                <div class="task-priority-container">
                    ${task.priority ? `<span class="priority-badge priority-${task.priority.toLowerCase()}">
                        <i class="fa-regular fa-flag" style="color: ${getPriorityColor(task.priority)};"></i> 
                        ${task.priority}
                    </span>` : ""}
                    ${task.date ? `<span class="due-date completed">
                        <i class="fa-regular fa-calendar"></i> 
                        ${formatDate(task.date)}
                    </span>` : ""}
                </div>
                <div class="line"></div>
            `;
            contentDiv.appendChild(taskDiv);

            if (!selectionMode) {
                // Delete button
                var deleteBtn = taskDiv.querySelector(".delete-button");
                if (deleteBtn) {
                    deleteBtn.addEventListener("click", () => {
                        deleteTask(actualIndex, true);
                    });
                }
            }
        });
    }

    function renderDeletedTasks() {
        var section = document.getElementById("deleted-tasks");
        if (!section) return;
        
        var contentDiv = section.querySelector(".deleted-tasks-content");
        if (!contentDiv) return;

        // Clear content
        contentDiv.innerHTML = "";

        // Apply filters
        var filteredTasks = filterTasks(deleted_tasks);

        if (filteredTasks.length === 0) {
            if (currentFilter.type !== "none") {
                contentDiv.innerHTML = `
                    <div class="no-results">
                        <p>No deleted tasks match the current filter.</p>
                        <button onclick="clearFilter()">Clear Filter</button>
                    </div>
                `;
            } else {
                contentDiv.innerHTML = sectionOriginalHTML["deleted-tasks"] || "";
            }
            return;
        }

        // Render deleted tasks
        filteredTasks.forEach((task, displayIndex) => {
            var actualIndex = deleted_tasks.indexOf(task);
            var taskDiv = document.createElement("div");
            taskDiv.className = "task-item deleted";
            taskDiv.setAttribute("data-task-index", actualIndex);
            
            var selectionCheckbox = selectionMode ? `
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
            ` : "";
            
            var actionButtons = selectionMode ? "" : `
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
                <h3 class="deleted-title">${selectionCheckbox} ${escapeHtml(task.title)}
                    <div class="deleted-task-actions-container">
                        ${actionButtons}
                    </div>
                </h3>
                <p class="deleted-desc">${escapeHtml(task.description || "")}</p>
                <div class="task-priority-container">
                    ${task.priority ? `<span class="priority-badge priority-${task.priority.toLowerCase()} faded">
                        <i class="fa-regular fa-flag" style="color: ${getPriorityColor(task.priority)};"></i> 
                        ${task.priority}
                    </span>` : ""}
                    ${task.date ? `<span class="due-date deleted">
                        <i class="fa-regular fa-calendar"></i> 
                        ${formatDate(task.date)}
                    </span>` : ""}
                </div>
                <div class="line"></div>
            `;
            contentDiv.appendChild(taskDiv);

            if (!selectionMode) {
                // Restore button
                var restoreBtn = taskDiv.querySelector(".restore-button");
                if (restoreBtn) {
                    restoreBtn.addEventListener("click", () => {
                        restoreTask(actualIndex);
                    });
                }

                // Permanent delete button
                var permDeleteBtn = taskDiv.querySelector(".permanent-delete-button");
                if (permDeleteBtn) {
                    permDeleteBtn.addEventListener("click", () => {
                        if (confirm("Are you sure you want to permanently delete this task? This action cannot be undone.")) {
                            permanentlyDeleteTask(actualIndex);
                        }
                    });
                }
            }
        });
    }

    // ------------------ UTILITY FUNCTIONS ------------------
    function getPriorityColor(priority) {
        switch(priority) {
            case "High": return "#F75A5A";
            case "Mid": return "#F8E067";
            case "Low": return "#93E1FF";
            default: return "#93E1FF";
        }
    }

    function formatDate(dateString) {
        if (!dateString) return "";
        try {
            var date = new Date(dateString);
            return date.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch (e) {
            return dateString;
        }
    }

    // Make functions global so they can be called from onclick attributes
    window.toggleTaskSelection = toggleTaskSelection;
    window.clearFilter = clearFilter;

});