
// ==========================================
// TASKFLOW - FRONTEND JAVASCRIPT
// FastAPI + MongoDB Integration
// ==========================================

const API_URL = "http://127.0.0.1:8000";

// 1. SELECT HTML ELEMENTS
const taskList = document.getElementById("taskList");
const taskForm = document.getElementById("taskForm");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");
const progressPercentage = document.getElementById("progressPercentage");

const taskModalElement = document.getElementById("addTaskModal");

// Use Bootstrap from the global window object
const taskModal = window.bootstrap.Modal.getOrCreateInstance(taskModalElement);

// 2. CURRENT STATE
let currentFilter = "all";
let editingTask = null;

// 3. GET ALL TASK CARDS
function getAllTasks() {
    return Array.from(taskList.querySelectorAll(".task-card"));
}

// 4. HANDLE API ERROR MESSAGES
async function getErrorMessage(response, fallbackMessage) {
    try {
        const errorData = await response.json();
        return errorData.detail || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
}

// 5. UPDATE DASHBOARD STATISTICS
function updateStatistics() {
    const tasks = getAllTasks();

    const total = tasks.length;

    const completed = tasks.filter(
        task => task.dataset.status === "completed"
    ).length;

    const pending = total - completed;

    const progress = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalTasks.textContent = String(total);
    pendingTasks.textContent = String(pending);
    completedTasks.textContent = String(completed);
    progressPercentage.textContent = `${progress}%`;

    const progressBar = document.querySelector(".progress-bar");

    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute("aria-valuenow", String(progress));
    }
}

// 6. FORMAT DATE
function formatDate(dateValue) {
    if (!dateValue) {
        return "No due date";
    }

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "No due date";
    }

    return date.toLocaleDateString();
}

// 7. CREATE TASK CARD
function createTaskCard(
    title,
    description,
    priority,
    dueDate,
    completed = false
) {
    const task = document.createElement("div");

    task.className = "task-card";

    task.dataset.status = completed ? "completed" : "pending";
    task.dataset.dueDate = dueDate || "";

    const safePriority = ["high", "medium", "low"].includes(priority)
        ? priority
        : "medium";

    const priorityLabel =
        safePriority.charAt(0).toUpperCase() + safePriority.slice(1);

    task.innerHTML = `
        <div class="task-check ${completed ? "checked" : ""}"
             role="button"
             tabindex="0"
             aria-label="Toggle task completion">

            <i class="bi ${completed ? "bi-check-circle-fill" : "bi-circle"}"></i>

        </div>

        <div class="task-details">

            <h6></h6>

            <p></p>

            <div class="task-meta">

                <span class="priority ${safePriority}">
                    <i class="bi bi-flag-fill"></i>
                    ${priorityLabel}
                </span>

                <span class="due-date-label">
                    <i class="bi bi-calendar3"></i>
                    ${formatDate(dueDate)}
                </span>

            </div>

        </div>

        <div class="task-actions">

            <button type="button" class="edit-task" aria-label="Edit task">
                <i class="bi bi-pencil"></i>
            </button>

            <button type="button" class="delete-task" aria-label="Delete task">
                <i class="bi bi-trash3"></i>
            </button>

        </div>
    `;

    // Safely insert user-provided text
    task.querySelector("h6").textContent = title || "Untitled task";

    task.querySelector(".task-details p").textContent =
        description || "No description added.";

    if (completed) {
        task.classList.add("completed-task");
    }

    return task;
}

// 8. ADD OR UPDATE TASK
taskForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const title = document.getElementById("taskTitle").value.trim();

    const description =
        document.getElementById("taskDescription").value.trim();

    const priority =
        document.getElementById("taskPriority").value;

    const dueDate =
        document.getElementById("taskDueDate").value;

    if (!title) {
        alert("Please enter a task title.");
        return;
    }

    const taskPayload = {
        title: title,
        description: description,
        priority: priority,
        due_date: dueDate || null,
        completed: editingTask
            ? editingTask.dataset.status === "completed"
            : false
    };

    try {

        // EDIT EXISTING TASK
        if (editingTask) {

            const taskId = editingTask.dataset.id;

            if (!taskId) {
                alert("Task ID missing. Please refresh the page.");
                return;
            }

            const response = await fetch(
                `${API_URL}/tasks/${encodeURIComponent(taskId)}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(taskPayload)
                }
            );

            if (!response.ok) {
                const message = await getErrorMessage(
                    response,
                    "Could not update task."
                );

                alert(message);
                return;
            }

            // Update the frontend after database success
            editingTask.querySelector("h6").textContent = title;

            editingTask.querySelector(".task-details p").textContent =
                description || "No description added.";

            const priorityElement =
                editingTask.querySelector(".priority");

            const priorityLabel =
                priority.charAt(0).toUpperCase() + priority.slice(1);

            priorityElement.className = `priority ${priority}`;

            priorityElement.innerHTML = `
                <i class="bi bi-flag-fill"></i>
                ${priorityLabel}
            `;

            editingTask.dataset.dueDate = dueDate || "";

            editingTask.querySelector(".due-date-label").innerHTML = `
                <i class="bi bi-calendar3"></i>
                ${formatDate(dueDate)}
            `;

            editingTask = null;

        }

        // ADD NEW TASK
        else {

            const response = await fetch(`${API_URL}/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(taskPayload)
            });

            if (!response.ok) {
                const message = await getErrorMessage(
                    response,
                    "Could not save task."
                );

                alert(message);
                return;
            }

            const savedTask = await response.json();

            const newTask = createTaskCard(
                title,
                description,
                priority,
                dueDate
            );

            // Store MongoDB ID in the task card
            newTask.dataset.id = savedTask.task_id;

            taskList.prepend(newTask);
        }

        taskForm.reset();
        taskModal.hide();

        updateStatistics();
        applyFilters();

    } catch (error) {

        console.error("Error saving task:", error);

        alert("Could not connect to the server. Check that FastAPI is running.");

    }

});

// 9. COMPLETE, DELETE AND EDIT TASKS
taskList.addEventListener("click", async function(event) {

    const target = event.target;

    const task = target.closest(".task-card");

    if (!task) {
        return;
    }

    const taskId = task.dataset.id;

    // COMPLETE / UNCOMPLETE TASK
    const checkButton = target.closest(".task-check");

    if (checkButton) {

        if (!taskId) {
            alert("Task ID missing. Please refresh the page.");
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/tasks/${encodeURIComponent(taskId)}/complete`,
                {
                    method: "PATCH"
                }
            );

            if (!response.ok) {
                const message = await getErrorMessage(
                    response,
                    "Could not update task status."
                );

                alert(message);
                return;
            }

            const result = await response.json();

            task.dataset.status =
                result.completed ? "completed" : "pending";

            task.classList.toggle(
                "completed-task",
                result.completed
            );

            checkButton.classList.toggle(
                "checked",
                result.completed
            );

            checkButton.innerHTML = result.completed
                ? '<i class="bi bi-check-circle-fill"></i>'
                : '<i class="bi bi-circle"></i>';

            updateStatistics();
            applyFilters();

        } catch (error) {

            console.error("Error updating task:", error);

            alert("Could not connect to the server.");

        }

        return;
    }

    // DELETE TASK
    const deleteButton = target.closest(".delete-task");

    if (deleteButton) {

        const confirmed = confirm(
            "Are you sure you want to delete this task?"
        );

        if (!confirmed) {
            return;
        }

        if (!taskId) {
            alert("Task ID missing. Please refresh the page.");
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/tasks/${encodeURIComponent(taskId)}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                const message = await getErrorMessage(
                    response,
                    "Could not delete task."
                );

                alert(message);
                return;
            }

            task.remove();

            updateStatistics();
            applyFilters();

        } catch (error) {

            console.error("Error deleting task:", error);

            alert("Could not connect to the server.");

        }

        return;
    }

    // EDIT TASK
    const editButton = target.closest(".edit-task");

    if (editButton) {

        editingTask = task;

        document.getElementById("taskTitle").value =
            task.querySelector("h6").textContent;

        const description =
            task.querySelector(".task-details p").textContent;

        document.getElementById("taskDescription").value =
            description === "No description added."
                ? ""
                : description;

        const priorityElement =
            task.querySelector(".priority");

        const priority = ["high", "medium", "low"].find(
            value => priorityElement.classList.contains(value)
        );

        document.getElementById("taskPriority").value =
            priority || "medium";

        // Restore existing due date
        document.getElementById("taskDueDate").value =
            task.dataset.dueDate || "";

        taskModal.show();
    }

});

// 10. FILTER TASKS
function applyFilters() {

    const tasks = getAllTasks();

    const searchTerm = searchInput.value.toLowerCase().trim();

    let visibleCount = 0;

    tasks.forEach(function(task) {

        const status = task.dataset.status;

        const title =
            task.querySelector("h6").textContent.toLowerCase();

        const description =
            task.querySelector(".task-details p").textContent.toLowerCase();

        const matchesFilter =
            currentFilter === "all" || currentFilter === status;

        const matchesSearch =
            title.includes(searchTerm) ||
            description.includes(searchTerm);

        const shouldDisplay = matchesFilter && matchesSearch;

        task.classList.toggle("d-none", !shouldDisplay);

        if (shouldDisplay) {
            visibleCount++;
        }

    });

    emptyState.classList.toggle("d-none", visibleCount !== 0);

}

// 11. FILTER BUTTON EVENTS
document.querySelectorAll(".filter-btn").forEach(function(button) {

    button.addEventListener("click", function() {

        const activeButton = document.querySelector(".filter-btn.active");

        if (activeButton) {
            activeButton.classList.remove("active");
        }

        button.classList.add("active");

        currentFilter = button.dataset.filter || "all";

        applyFilters();

    });

});

// 12. SEARCH TASKS
searchInput.addEventListener("input", applyFilters);

// 13. RESET FORM WHEN MODAL CLOSES
taskModalElement.addEventListener("hidden.bs.modal", function() {

    taskForm.reset();

    editingTask = null;

});

// 14. LOAD TASKS FROM MONGODB
async function loadTasks() {

    try {

        const response = await fetch(`${API_URL}/tasks`);

        if (!response.ok) {

            const message = await getErrorMessage(
                response,
                "Failed to fetch tasks."
            );

            alert(message);
            return;
        }

        const tasks = await response.json();

        // Remove existing sample cards
        taskList.innerHTML = "";

        // Display tasks retrieved from MongoDB
        tasks.forEach(function(taskData) {

            const task = createTaskCard(
                taskData.title,
                taskData.description,
                taskData.priority,
                taskData.due_date || "",
                Boolean(taskData.completed)
            );

            // Store MongoDB ID
            task.dataset.id = taskData._id;

            taskList.appendChild(task);

        });

        updateStatistics();
        applyFilters();

    } catch (error) {

        console.error("Error loading tasks:", error);

        alert(
            "Could not load tasks. Make sure the FastAPI server is running."
        );

    }

}

// 15. LOAD DATA WHEN PAGE OPENS
loadTasks();

console.log("TaskFlow JavaScript loaded successfully!");
