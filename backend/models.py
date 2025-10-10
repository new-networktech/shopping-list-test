from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# User models
class UserBase(BaseModel):
    username: str
    is_admin: bool = False

class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False

class UserUpdate(BaseModel):
    password: Optional[str] = None
    is_admin: Optional[bool] = None

class User(UserBase):
    id: str = Field(alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class UserInDB(User):
    hashed_password: str

# Token models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Shopping item models
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

# Shopping list models
class ShoppingList(BaseModel):
    id: str
    name: str
    user_id: str
    created_at: str
    items: List[ShoppingItem] = []

class CreateListRequest(BaseModel):
    name: str

