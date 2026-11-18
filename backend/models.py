
from pydantic import BaseModel
from typing import Optional
from datetime import date


class Task(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "medium"
    due_date: Optional[date] = None
    completed: bool = False
