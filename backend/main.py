
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.models import Task
from backend.database import tasks_collection
from bson import ObjectId

app = FastAPI(title="TaskFlow API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:63342",
        "http://127.0.0.1:63342"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)






@app.get("/")
def home():
    return {"message": "Welcome to TaskFlow API!"}


@app.post("/tasks")
def create_task(task: Task):
    task_data = task.model_dump(mode="json")

    result = tasks_collection.insert_one(task_data)

    return {
        "message": "Task created successfully",
        "task_id": str(result.inserted_id)
    }


# Get all tasks
@app.get("/tasks")
def get_tasks():

    tasks = list(tasks_collection.find())

    for task in tasks:
        task["_id"] = str(task["_id"])

    return tasks



from bson import ObjectId
from fastapi import HTTPException


# Update an existing task
@app.put("/tasks/{task_id}")
def update_task(task_id: str, task: Task):

    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")

    task_data = task.model_dump(mode="json")

    result = tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": task_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task updated successfully"}


from bson import ObjectId
from fastapi import HTTPException


# Delete a task
@app.delete("/tasks/{task_id}")
def delete_task(task_id: str):

    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")

    result = tasks_collection.delete_one(
        {"_id": ObjectId(task_id)}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted successfully"}



# Toggle task completion status
@app.patch("/tasks/{task_id}/complete")
def toggle_task_completion(task_id: str):

    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task ID")

    task = tasks_collection.find_one(
        {"_id": ObjectId(task_id)}
    )

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    new_status = not task.get("completed", False)

    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"completed": new_status}}
    )

    return {
        "message": "Task status updated",
        "completed": new_status
    }