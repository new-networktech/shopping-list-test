from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from datetime import datetime
import boto3
from botocore.exceptions import ClientError

app = FastAPI(
    title="Shopping List API",
    description="A simple shopping list API for DevOps test task",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://k8s-default-shopping-88aebfc02b-269189989.eu-west-1.elb.amazonaws.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class ShoppingItem(BaseModel):
    id: Optional[int] = None
    name: str
    quantity: int = 1
    category: str = "general"
    emoji: str = "🛒"
    added_at: Optional[str] = None
    completed: bool = False

class AddItemRequest(BaseModel):
    name: str
    quantity: int = 1
    category: str = "general"
    emoji: str = "🛒"

# Storage file path
STORAGE_FILE = "/app/data/shopping_list.json"
S3_BUCKET = os.getenv("S3_BUCKET", "shopping-list-backup")

# Ensure data directory exists
os.makedirs(os.path.dirname(STORAGE_FILE), exist_ok=True)

def load_shopping_list() -> List[dict]:
    """Load shopping list from file"""
    try:
        if os.path.exists(STORAGE_FILE):
            with open(STORAGE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error loading shopping list: {e}")
        return []

def save_shopping_list(items: List[dict]):
    """Save shopping list to file"""
    try:
        with open(STORAGE_FILE, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving shopping list: {e}")

def backup_to_s3():
    """Backup shopping list to S3"""
    try:
        if os.path.exists(STORAGE_FILE):
            s3_client = boto3.client('s3')
            s3_client.upload_file(
                STORAGE_FILE, 
                S3_BUCKET, 
                f"backup/shopping_list_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )
            return True
    except ClientError as e:
        print(f"Error backing up to S3: {e}")
        return False

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Shopping List API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "get_list": "/api/list",
            "add_item": "/api/add",
            "remove_item": "/api/remove/{item_id}",
            "defaults": "/api/defaults",
            "backup": "/api/backup"
        }
    }

@app.get("/api/list", response_model=List[ShoppingItem])
async def get_shopping_list():
    """Get all shopping list items"""
    items = load_shopping_list()
    return [ShoppingItem(**item) for item in items]

@app.post("/api/add", response_model=ShoppingItem)
async def add_item(item: AddItemRequest):
    """Add a new item to the shopping list"""
    items = load_shopping_list()
    
    new_item = ShoppingItem(
        id=len(items) + 1,
        name=item.name,
        quantity=item.quantity,
        category=item.category,
        emoji=item.emoji,
        added_at=datetime.now().isoformat(),
        completed=False
    )
    
    items.append(new_item.dict())
    save_shopping_list(items)
    
    return new_item

@app.delete("/api/remove/{item_id}")
async def remove_item(item_id: int):
    """Remove an item from the shopping list"""
    items = load_shopping_list()
    
    # Find and remove item
    original_length = len(items)
    items = [item for item in items if item.get('id') != item_id]
    
    if len(items) == original_length:
        raise HTTPException(status_code=404, detail="Item not found")
    
    save_shopping_list(items)
    return {"message": f"Item {item_id} removed successfully"}

@app.put("/api/toggle/{item_id}")
async def toggle_item(item_id: int):
    """Toggle completion status of an item"""
    items = load_shopping_list()
    
    for item in items:
        if item.get('id') == item_id:
            item['completed'] = not item.get('completed', False)
            save_shopping_list(items)
            return {"message": f"Item {item_id} toggled", "completed": item['completed']}
    
    raise HTTPException(status_code=404, detail="Item not found")

@app.get("/api/defaults")
async def get_default_items():
    """Get default shopping list items"""
    default_items = [
        {"name": "Milk", "quantity": 1, "category": "dairy", "emoji": "🥛"},
        {"name": "Bread", "quantity": 1, "category": "bakery", "emoji": "🍞"},
        {"name": "Eggs", "quantity": 12, "category": "dairy", "emoji": "🥚"},
        {"name": "Bananas", "quantity": 6, "category": "fruits", "emoji": "🍌"},
        {"name": "Chicken", "quantity": 1, "category": "meat", "emoji": "🍗"},
        {"name": "Rice", "quantity": 1, "category": "grains", "emoji": "🍚"},
        {"name": "Tomatoes", "quantity": 4, "category": "vegetables", "emoji": "🍅"},
        {"name": "Cheese", "quantity": 1, "category": "dairy", "emoji": "🧀"},
    ]
    return default_items

@app.post("/api/backup")
async def backup_list():
    """Backup shopping list to S3"""
    success = backup_to_s3()
    if success:
        return {"message": "Backup completed successfully"}
    else:
        raise HTTPException(status_code=500, detail="Backup failed")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 