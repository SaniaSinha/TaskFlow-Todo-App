
import os
from urllib.parse import urlsplit

from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables from the project root
load_dotenv()

# Read MongoDB connection string
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is missing!")

# Diagnostic: print connection details without exposing credentials
parsed_uri = urlsplit(MONGO_URI)

print("========== DATABASE DIAGNOSTIC ==========")
print("MongoDB scheme:", parsed_uri.scheme)
print("MongoDB host:", parsed_uri.hostname)
print("=========================================")

if parsed_uri.scheme not in ("mongodb", "mongodb+srv"):
    raise ValueError("Invalid MongoDB connection string format!")

# Connect to MongoDB Atlas
client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=10000
)

# Select database and collection
db = client["taskflow_db"]
tasks_collection = db["tasks"]

# Verify MongoDB connection
try:
    client.admin.command("ping")
    print("Connected to MongoDB successfully!")
except Exception as e:
    print("MongoDB connection failed:", type(e).__name__, str(e))
    raise
