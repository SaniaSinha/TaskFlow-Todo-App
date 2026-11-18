
from pymongo import MongoClient

# Connect Python to local MongoDB
client = MongoClient("mongodb://localhost:27017/")

# Select the TaskFlow database
db = client["taskflow_db"]

# Select the tasks collection
tasks_collection = db["tasks"]
