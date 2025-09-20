document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".menu-content li a");
    const sections = document.querySelectorAll(".content-section");
    const addTaskBtns = document.querySelectorAll(".add-task-btn1, .add-task-btn2");

    const modal = document.getElementById("taskModal");
    const cancelBtn = document.querySelector(".cancel-btn");
    const saveTaskBtn = document.querySelector(".save-task-btn");

    // Hidden inputs
    const dateInput = document.getElementById("task-date");
    const priorityMenu = document.getElementById("priority-menu");
    const hiddenPriority = document.getElementById("task-priority");

    // Buttons
    const dateBtn = document.getElementById("task-date-btn");
    const priorityBtn = document.getElementById("task-priority-btn");

    // Helper: show a section by id
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

    // Click events for menu
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();

            menuItems.forEach(link => link.parentElement.classList.remove("active"));
            item.parentElement.classList.add("active");

            const targetId = item.getAttribute("data-target");
            showSection(targetId);
        });
    });

    // Open modal when any Add Task button is clicked
    addTaskBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            modal.classList.add("show");
        });
    });

    // Close modal
      cancelBtn.addEventListener("click", () => {
        // Reset form fields
        document.getElementById("task-title").value = "";
        document.getElementById("task-desc").value = "";
        dateInput.value = "";
        hiddenPriority.value = ""; 
        priorityBtn.innerHTML = `<i class="fa-regular fa-flag"></i> Priority`;
        modal.classList.remove("show");
    });

    // Optional: close modal when clicking outside the modal box
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            document.getElementById("task-title").value = "";
            document.getElementById("task-desc").value = "";
            dateInput.value = "";
            hiddenPriority.value = ""; 
            priorityBtn.innerHTML = `<i class="fa-regular fa-flag"></i> Priority`;
            modal.classList.remove("show");
        }
    });

    // Date button click → trigger hidden input
    dateBtn.addEventListener("click", () => {
        dateInput.click();
    });

    // Date button click → open native picker
    dateBtn.addEventListener("click", () => {
        if (dateInput.showPicker) {
            dateInput.showPicker(); // Modern browsers support this
        } else {
            dateInput.click(); // fallback
        }
    });

    // Priority button click → open dropdown
    priorityBtn.addEventListener("click", () => {
        priorityMenu.style.display =
            priorityMenu.style.display === "block" ? "none" : "block";
    });

    priorityMenu.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const value = btn.dataset.value;
            hiddenPriority.value = value;
            priorityBtn.textContent = `Priority: ${value}`;
            priorityMenu.style.display = "none";
        });
    });
    
    // Save task
    saveTaskBtn.addEventListener("click", () => {
        const title = document.getElementById("task-title").value.trim();
        const desc = document.getElementById("task-desc").value.trim();
        const date = dateInput.value;
        const priority = prioritySelect.value;

        const activeSection = document.querySelector(".content-section.active");

        if (activeSection && title !== "") {
            const taskDiv = document.createElement("div");
            taskDiv.classList.add("task-item");
            taskDiv.innerHTML = `
                <h3>${title}</h3>
                <p>${desc}</p>
                <p><strong>Due:</strong> ${date ? new Date(date).toLocaleString() : "None"}</p>
                <p><strong>Priority:</strong> ${priority}</p>
            `;
            activeSection.appendChild(taskDiv);
        }
    });
});
