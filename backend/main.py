from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from datetime import datetime, timedelta
from bson import ObjectId
import logging
import os

from models import (
    User, UserCreate, UserUpdate, UserInDB,
    Token, ShoppingItem, AddItemRequest, 
    ShoppingList, CreateListRequest
)
from auth import (
    get_password_hash, authenticate_user, 
    create_access_token, get_current_user, 
    get_current_admin, ACCESS_TOKEN_EXPIRE_MINUTES
)
from database import MongoDB

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Shopping List API with Authentication",
    description="A shopping list API with MongoDB and JWT authentication",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5183",
        "*"  # For development - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize MongoDB connection and create default admin user"""
    try:
        MongoDB.connect()
        db = MongoDB.get_database()
        
        # Create default admin user if no users exist
        if db.users.count_documents({}) == 0:
            admin_username = os.getenv("ADMIN_USERNAME", "mjshp")
            admin_password = os.getenv("ADMIN_PASSWORD", "125C4A$A978#D1D502041A551ED7FCA7BAEF")
            
            admin_user = {
                "username": admin_username,
                "hashed_password": get_password_hash(admin_password),
                "is_admin": True,
                "created_at": datetime.utcnow()
            }
            db.users.insert_one(admin_user)
            logger.info(f"Created default admin user (username: {admin_username})")
        
        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection"""
    MongoDB.close()
    logger.info("Application shutdown complete")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Shopping List API with Authentication",
        "version": "2.0.0",
        "docs": "/docs",
        "authentication": {
            "login": "/auth/login",
            "me": "/auth/me"
        },
        "endpoints": {
            "lists": "/api/lists",
            "list": "/api/list",
            "add_item": "/api/add",
            "remove_item": "/api/remove/{item_id}",
            "toggle_item": "/api/toggle/{item_id}",
            "defaults": "/api/defaults"
        },
        "admin": {
            "users": "/admin/users"
        }
    }

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        db = MongoDB.get_database()
        db.command('ping')
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

# ==================== Authentication Endpoints ====================

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """User login endpoint"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# ==================== Admin Endpoints ====================

@app.get("/admin/users", response_model=List[User])
async def list_users(current_user: User = Depends(get_current_admin)):
    """List all users (admin only)"""
    db = MongoDB.get_database()
    users = []
    for user_data in db.users.find():
        user_data["_id"] = str(user_data["_id"])
        users.append(User(**user_data))
    return users

@app.post("/admin/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_create: UserCreate,
    current_user: User = Depends(get_current_admin)
):
    """Create a new user (admin only)"""
    db = MongoDB.get_database()
    
    # Check if username already exists
    if db.users.find_one({"username": user_create.username}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create new user
    user_dict = {
        "username": user_create.username,
        "hashed_password": get_password_hash(user_create.password),
        "is_admin": user_create.is_admin,
        "created_at": datetime.utcnow()
    }
    
    result = db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    return User(**user_dict)

@app.put("/admin/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_admin)
):
    """Update a user (admin only)"""
    db = MongoDB.get_database()
    
    try:
        object_id = ObjectId(user_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    # Build update document
    update_dict = {}
    if user_update.password is not None:
        update_dict["hashed_password"] = get_password_hash(user_update.password)
    if user_update.is_admin is not None:
        update_dict["is_admin"] = user_update.is_admin
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Update user
    result = db.users.find_one_and_update(
        {"_id": object_id},
        {"$set": update_dict},
        return_document=True
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    result["_id"] = str(result["_id"])
    return User(**result)

@app.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_admin)
):
    """Delete a user (admin only)"""
    db = MongoDB.get_database()
    
    # Prevent deleting yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    try:
        object_id = ObjectId(user_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    result = db.users.delete_one({"_id": object_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Also delete all user's shopping lists
    db.shopping_lists.delete_many({"user_id": user_id})
    
    return {"message": f"User {user_id} deleted successfully"}

# ==================== Shopping List Endpoints ====================

DEFAULT_LIST_ID = "default"

@app.get("/api/lists", response_model=List[ShoppingList])
async def get_all_lists(current_user: User = Depends(get_current_user)):
    """Get all shopping lists for current user"""
    db = MongoDB.get_database()
    lists = []
    
    for list_data in db.shopping_lists.find({"user_id": current_user.id}):
        list_data["id"] = str(list_data["_id"])
        lists.append(ShoppingList(**list_data))
    
    # If no lists exist, create a default one
    if not lists:
        default_list = {
            "name": "My Shopping List",
            "user_id": current_user.id,
            "created_at": datetime.utcnow().isoformat(),
            "items": []
        }
        result = db.shopping_lists.insert_one(default_list)
        default_list["id"] = str(result.inserted_id)
        lists.append(ShoppingList(**default_list))
    
    return lists

@app.post("/api/lists", response_model=ShoppingList)
async def create_list(
    request: CreateListRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new shopping list"""
    db = MongoDB.get_database()
    
    new_list = {
        "name": request.name,
        "user_id": current_user.id,
        "created_at": datetime.utcnow().isoformat(),
        "items": []
    }
    
    result = db.shopping_lists.insert_one(new_list)
    new_list["id"] = str(result.inserted_id)
    
    return ShoppingList(**new_list)

@app.delete("/api/lists/{list_id}")
async def delete_list(
    list_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a shopping list"""
    db = MongoDB.get_database()
    
    try:
        object_id = ObjectId(list_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid list ID")
    
    # Check if list exists and belongs to user
    list_data = db.shopping_lists.find_one({
        "_id": object_id,
        "user_id": current_user.id
    })
    
    if not list_data:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Delete the list
    db.shopping_lists.delete_one({
        "_id": object_id,
        "user_id": current_user.id
    })
    
    return {"message": "List deleted successfully"}

@app.put("/api/lists/{list_id}", response_model=ShoppingList)
async def update_list(
    list_id: str,
    request: CreateListRequest,
    current_user: User = Depends(get_current_user)
):
    """Update a shopping list name"""
    db = MongoDB.get_database()
    
    try:
        object_id = ObjectId(list_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid list ID")
    
    # Check if list exists and belongs to user
    list_data = db.shopping_lists.find_one({
        "_id": object_id,
        "user_id": current_user.id
    })
    
    if not list_data:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Update the list name
    db.shopping_lists.update_one(
        {"_id": object_id, "user_id": current_user.id},
        {"$set": {"name": request.name}}
    )
    
    # Return updated list
    updated_list = db.shopping_lists.find_one({"_id": object_id})
    updated_list["id"] = str(updated_list["_id"])
    
    return ShoppingList(**updated_list)

@app.get("/api/list", response_model=List[ShoppingItem])
async def get_shopping_list(
    list_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """Get shopping list items"""
    db = MongoDB.get_database()
    
    # If no list_id provided, list_id is "default", or list_id is "undefined", get the first list for this user
    if not list_id or list_id == "default" or list_id == "undefined":
        first_list = db.shopping_lists.find_one({"user_id": current_user.id})
        if not first_list:
            # Create default list
            default_list = {
                "name": "My Shopping List",
                "user_id": current_user.id,
                "created_at": datetime.utcnow().isoformat(),
                "items": []
            }
            result = db.shopping_lists.insert_one(default_list)
            return []
        list_id = str(first_list["_id"])
    
    try:
        object_id = ObjectId(list_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid list ID")
    
    list_data = db.shopping_lists.find_one({
        "_id": object_id,
        "user_id": current_user.id
    })
    
    if not list_data:
        raise HTTPException(status_code=404, detail="List not found")
    
    return [ShoppingItem(**item) for item in list_data.get("items", [])]

@app.post("/api/add", response_model=ShoppingItem)
async def add_item(
    item: AddItemRequest,
    list_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """Add a new item to the shopping list"""
    db = MongoDB.get_database()
    
    # Get or create list
    if not list_id or list_id == "undefined":
        first_list = db.shopping_lists.find_one({"user_id": current_user.id})
        if not first_list:
            default_list = {
                "name": "My Shopping List",
                "user_id": current_user.id,
                "created_at": datetime.utcnow().isoformat(),
                "items": []
            }
            result = db.shopping_lists.insert_one(default_list)
            list_id = str(result.inserted_id)
        else:
            list_id = str(first_list["_id"])
    
    try:
        object_id = ObjectId(list_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid list ID")
    
    # Get current items to determine new ID
    list_data = db.shopping_lists.find_one({
        "_id": object_id,
        "user_id": current_user.id
    })
    
    if not list_data:
        raise HTTPException(status_code=404, detail="List not found")
    
    items = list_data.get("items", [])
    new_id = max([i.get("id", 0) for i in items], default=0) + 1
    
    new_item = ShoppingItem(
        id=new_id,
        name=item.name,
        quantity=item.quantity,
        category=item.category,
        emoji=item.emoji,
        added_at=datetime.utcnow().isoformat(),
        completed=False
    )
    
    # Add item to list
    db.shopping_lists.update_one(
        {"_id": object_id},
        {"$push": {"items": new_item.dict()}}
    )
    
    return new_item

@app.delete("/api/remove/{item_id}")
async def remove_item(
    item_id: int,
    list_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """Remove an item from the shopping list"""
    db = MongoDB.get_database()
    
    # Get list
    if not list_id:
        first_list = db.shopping_lists.find_one({"user_id": current_user.id})
        if not first_list:
            raise HTTPException(status_code=404, detail="No lists found")
        list_id = str(first_list["_id"])
    
    try:
        object_id = ObjectId(list_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid list ID")
    
    # Remove item
    result = db.shopping_lists.update_one(
        {"_id": object_id, "user_id": current_user.id},
        {"$pull": {"items": {"id": item_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": f"Item {item_id} removed successfully"}

@app.put("/api/toggle/{item_id}")
async def toggle_item(
    item_id: int,
    list_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """Toggle completion status of an item"""
    db = MongoDB.get_database()
    
    # Get list
    if not list_id:
        first_list = db.shopping_lists.find_one({"user_id": current_user.id})
        if not first_list:
            raise HTTPException(status_code=404, detail="No lists found")
        list_id = str(first_list["_id"])
    
    try:
        object_id = ObjectId(list_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid list ID")
    
    # Get current list
    list_data = db.shopping_lists.find_one({
        "_id": object_id,
        "user_id": current_user.id
    })
    
    if not list_data:
        raise HTTPException(status_code=404, detail="List not found")
    
    # Find and toggle item
    items = list_data.get("items", [])
    item_found = False
    for item in items:
        if item.get("id") == item_id:
            item["completed"] = not item.get("completed", False)
            item_found = True
            break
    
    if not item_found:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Update list
    db.shopping_lists.update_one(
        {"_id": object_id},
        {"$set": {"items": items}}
    )
    
    # Return updated item
    for item in items:
        if item.get("id") == item_id:
            return {"message": f"Item {item_id} toggled", "completed": item["completed"]}

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

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", "8185"))
    uvicorn.run(app, host="0.0.0.0", port=port)
