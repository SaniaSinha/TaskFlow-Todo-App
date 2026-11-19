
import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables from the project's root .env file
load_dotenv()

# Get the MongoDB Atlas connection string
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not found in .env file")

# Connect to MongoDB Atlas
client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=10000
)

# Select database and collection
db = client["taskflow_db"]
tasks_collection = db["tasks"]

# Verify the connection
client.admin.command("ping")

print("Connected to MongoDB Atlas successfully!")
