document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".menu-content li a");
    const sections = document.querySelectorAll(".content-section");
    const addTaskBtns = document.querySelectorAll(".add-task-btn1, .add-task-btn2");

    const modal = document.getElementById("taskModal");
    const cancelBtn = document.querySelector(".cancel-btn");
    const saveTaskBtn = document.querySelector(".save-task-btn");

    const dateInput = document.getElementById("task-date");
    const priorityMenu = document.getElementById("priority-menu");
    const hiddenPriority = document.getElementById("task-priority");
    const dateBtn = document.getElementById("task-date-btn");
    const priorityBtn = document.getElementById("task-priority-btn");

    function showSection(id) {
        sections.forEach(section => {
            section.classList.remove("active");
            section.hidden = true;
        });
        const target = document.getElementById(id);
        if (target) {
            target.classList.add("active");
            target.hidden = false;
        }
    }

    // Default: show Inbox
    if (sections.length > 0) {
        showSection("inbox");
        menuItems[0].parentElement.classList.add("active");
    }

    // Menu click
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            menuItems.forEach(link => link.parentElement.classList.remove("active"));
            item.parentElement.classList.add("active");
            showSection(item.getAttribute("data-target"));
        });
    });

    // Open modal
    addTaskBtns.forEach(btn => {
        btn.addEventListener("click", () => modal.classList.add("show"));
    });

    // Close modal
    function resetModal() {
        document.getElementById("task-title").value = "";
        document.getElementById("task-desc").value = "";
        dateInput.value = "";
        hiddenPriority.value = "";
        priorityBtn.innerHTML = `<i class="fa-regular fa-flag"></i> Priority`;
        modal.classList.remove("show");
    }

    cancelBtn.addEventListener("click", resetModal);
    window.addEventListener("click", (e) => {
        if (e.target === modal) resetModal();
    });

    // Date and priority buttons
    dateBtn.addEventListener("click", () => {
        if (dateInput.showPicker) dateInput.showPicker();
        else dateInput.click();
    });

    priorityBtn.addEventListener("click", () => {
        priorityMenu.style.display = priorityMenu.style.display === "block" ? "none" : "block";
    });

    priorityMenu.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            hiddenPriority.value = btn.dataset.value;
            priorityBtn.textContent = `Priority: ${btn.dataset.value}`;
            priorityMenu.style.display = "none";
        });
    });

    // Helper: create task element
    function createTaskElement(task) {
        const taskDiv = document.createElement("div");
        taskDiv.classList.add("task-item");
        if (task.done) taskDiv.classList.add("done");

        taskDiv.innerHTML = `
            <h3>${task.title}</h3>
            ${task.desc ? `<p>${task.desc}</p>` : ""}
            <p><strong>Due:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "None"}</p>
            <p><strong>Priority:</strong> ${task.priority}</p>
            <button class="done-btn">${task.done ? "Undo" : "Done"}</button>
            <button class="delete-btn">Delete</button>
        `;

        // Done button
        taskDiv.querySelector(".done-btn").addEventListener("click", async () => {
            try {
                const response = await fetch(`https://cmsc128-indivproject-dearroz-yap.onrender.com/tasks/${task._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ done: !task.done })
                });
                const updatedTask = await response.json();
                taskDiv.classList.toggle("done", updatedTask.done);
                taskDiv.querySelector(".done-btn").textContent = updatedTask.done ? "Undo" : "Done";
                task.done = updatedTask.done;
            } catch (err) {
                console.error("Error updating task:", err);
            }
        });

        // Delete button
        taskDiv.querySelector(".delete-btn").addEventListener("click", async () => {
            if (!confirm("Delete this task?")) return;
            try {
                await fetch(`https://cmsc128-indivproject-dearroz-yap.onrender.com/tasks/${task._id}`, {
                    method: "DELETE"
                });
                taskDiv.remove();
            } catch (err) {
                console.error("Error deleting task:", err);
            }
        });

        return taskDiv;
    }

    // Save task
    saveTaskBtn.addEventListener("click", async () => {
        const title = document.getElementById("task-title").value.trim();
        const desc = document.getElementById("task-desc").value.trim();
        const date = dateInput.value;
        const priority = hiddenPriority.value;

        if (title === "") return alert("Task title cannot be empty.");

        try {
            const response = await fetch("https://cmsc128-indivproject-dearroz-yap.onrender.com/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, dueDate: date, done: false, priority, desc })
            });
            const savedTask = await response.json();

            const activeSection = document.querySelector(".content-section.active");
            if (activeSection) {
                activeSection.appendChild(createTaskElement(savedTask));
            }

            resetModal();
        } catch (err) {
            console.error("Error saving task:", err);
            alert("Failed to save task. Try again.");
        }
    });

    // Load existing tasks
    async function loadTasks() {
        try {
            const response = await fetch("https://cmsc128-indivproject-dearroz-yap.onrender.com/tasks");
            const tasks = await response.json();
            const inbox = document.getElementById("inbox");
            tasks.forEach(task => inbox.appendChild(createTaskElement(task)));
        } catch (err) {
            console.error("Error loading tasks:", err);
        }
    }

    loadTasks();
});
