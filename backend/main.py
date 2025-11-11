from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi.middleware.cors import CORSMiddleware
import hashlib

origins = [
    "http://localhost",
    "http://localhost:5173",  # Vite frontend
    "http://127.0.0.1:5173",  # Sometimes browsers use 127.0.0.1
    "http://localhost:3000",  # React default
    "http://127.0.0.1:3000"
]

# Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./expense_tracker.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Database Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    category = Column(String)
    description = Column(String)
    date = Column(Date)
    type = Column(String)  # 'expense' or 'income'

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: str
    date: str  # YYYY-MM-DD format
    type: str  # 'expense' or 'income'

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    type: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    category: str
    description: str
    date: str
    type: str

    class Config:
        from_attributes = True

# App initialization
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://webapp-expense.onrender.com"  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    sha256 = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return pwd_context.verify(sha256, hashed_password)

def get_password_hash(password: str) -> str:
    sha256 = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(sha256)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Authentication endpoints
@app.post("/api/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "email": current_user.email}

# Expense endpoints
@app.post("/api/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Parse date
    try:
        expense_date = datetime.strptime(expense.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Validate type
    if expense.type not in ["expense", "income"]:
        raise HTTPException(status_code=400, detail="Type must be 'expense' or 'income'")
    
    # Create expense
    new_expense = Expense(
        user_id=current_user.id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=expense_date,
        type=expense.type
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    return ExpenseResponse(
        id=new_expense.id,
        user_id=new_expense.user_id,
        amount=new_expense.amount,
        category=new_expense.category,
        description=new_expense.description,
        date=new_expense.date.strftime("%Y-%m-%d"),
        type=new_expense.type
    )

@app.get("/api/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    category: Optional[str] = None,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if category:
        query = query.filter(Expense.category == category)
    if type:
        query = query.filter(Expense.type == type)
    
    expenses = query.order_by(Expense.date.desc()).all()
    
    return [
        ExpenseResponse(
            id=exp.id,
            user_id=exp.user_id,
            amount=exp.amount,
            category=exp.category,
            description=exp.description,
            date=exp.date.strftime("%Y-%m-%d"),
            type=exp.type
        )
        for exp in expenses
    ]

@app.get("/api/expenses/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return ExpenseResponse(
        id=expense.id,
        user_id=expense.user_id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=expense.date.strftime("%Y-%m-%d"),
        type=expense.type
    )

@app.put("/api/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Update fields
    if expense_update.amount is not None:
        expense.amount = expense_update.amount
    if expense_update.category is not None:
        expense.category = expense_update.category
    if expense_update.description is not None:
        expense.description = expense_update.description
    if expense_update.date is not None:
        try:
            expense.date = datetime.strptime(expense_update.date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    if expense_update.type is not None:
        if expense_update.type not in ["expense", "income"]:
            raise HTTPException(status_code=400, detail="Type must be 'expense' or 'income'")
        expense.type = expense_update.type
    
    db.commit()
    db.refresh(expense)
    
    return ExpenseResponse(
        id=expense.id,
        user_id=expense.user_id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=expense.date.strftime("%Y-%m-%d"),
        type=expense.type
    )

@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    
    return {"message": "Expense deleted successfully"}

@app.get("/")
def root():
    return {"message": "Expense Tracker API"}