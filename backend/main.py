from fastapi import FastAPI, Depends, HTTPException
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
from dotenv import load_dotenv
from secrets import token_urlsafe
import hashlib
import os

# In main.py, add 2 lines:
from sms_parser_api import router as sms_router


# Add new file: sms_parser_api.py (copy from outputs)
# Add to requirements.txt: anthropic==0.43.0
# Set environment variable: ANTHROPIC_API_KEY
# Load environment variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-PLEASE")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./expense_tracker.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Fix for Render/Supabase postgres:// vs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine based on database type
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

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


class PendingTransaction(Base):
    __tablename__ = "pending_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    
    # ✅ NEW: Store parsed SMS data
    amount = Column(Float, nullable=True)
    category = Column(String, nullable=True)
    description = Column(String, nullable=True)  # Changed from 'note'
    date = Column(String, nullable=True)
    type = Column(String, nullable=True)  # 'expense' or 'income'
    
    created_at = Column(Date, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, confirmed, cancelled


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    category = Column(String)
    description = Column(String)
    date = Column(Date)
    type = Column(String)  # 'expense' or 'income'

class PendingTransaction(Base):
    __tablename__ = "pending_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    amount = Column(Float, nullable=True)
    note = Column(String, nullable=True)
    created_at = Column(Date)
    status = Column(String, default="pending")  # pending, confirmed, cancelled

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

class PendingTransactionResponse(BaseModel):
    id: int
    token: str
    amount: Optional[float]
    note: Optional[str]
    status: str
    
    class Config:
        from_attributes = True

class PendingTransactionCreate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    type: Optional[str] = None


# App initialization
app = FastAPI(title="Expense Tracker API", version="2.0.0")

app.include_router(sms_router)

# CORS - Allow your frontend domains
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://webapp-expense.vercel.app",
    "https://webapp-expense-git-main-kunal12203s-projects.vercel.app",
    "https://webapp-expense-jbhtflpoe-kunal12203s-projects.vercel.app",
    "https://*.vercel.app"
]


# Add production frontend URL if set
if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

# Add wildcard for Vercel preview deployments
if any("vercel.app" in origin for origin in allowed_origins):
    allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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

# Helper functions
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

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Routes
@app.get("/")
@app.get("/api")
def root():
    return {
        "message": "Expense Tracker API",
        "version": "2.0.0",
        "database": "PostgreSQL" if not DATABASE_URL.startswith("sqlite") else "SQLite",
        "status": "running"
    }

# Authentication endpoints
@app.post("/api/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check username
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check email
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/pending-transactions", response_model=List[PendingTransactionResponse])
async def get_pending_transactions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get all pending transactions for current user
    """
    user = get_current_user(credentials.credentials, db)
    
    pending_list = db.query(PendingTransaction).filter(
        PendingTransaction.user_id == user.id,
        PendingTransaction.status == "pending"
    ).order_by(PendingTransaction.created_at.desc()).all()
    
    return pending_list

@app.get("/api/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

# Expense endpoints
@app.post("/api/expenses", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        expense_date = datetime.strptime(expense.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if expense.type not in ["expense", "income"]:
        raise HTTPException(status_code=400, detail="Type must be 'expense' or 'income'")
    
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

@app.post("/api/pending-transaction", response_model=PendingTransactionResponse)
async def create_pending_transaction(
    pending_data: PendingTransactionCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Create a new pending transaction with parsed SMS data
    This is called automatically when SMS is parsed
    """
    # Verify token
    user = get_current_user(credentials.credentials, db)
    
    # Generate unique token
    token = token_urlsafe(16)
    
    # Create pending transaction
    pending = PendingTransaction(
        user_id=user.id,
        token=token,
        amount=pending_data.amount,
        category=pending_data.category,
        description=pending_data.description,
        date=pending_data.date,
        type=pending_data.type,
        status="pending"
    )
    
    db.add(pending)
    db.commit()
    db.refresh(pending)
    
    return pending



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
def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
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
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
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
            raise HTTPException(status_code=400, detail="Invalid date format")
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
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    
    return {"message": "Expense deleted successfully"}

# Pending Transaction endpoints (for personalized URL feature)
@app.post("/api/generate-url")
def generate_payment_url(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    token = token_urlsafe(16)
    pending = PendingTransaction(
        user_id=current_user.id,
        token=token,
        created_at=datetime.utcnow().date()
    )
    db.add(pending)
    db.commit()
    db.refresh(pending)
    
    return {
        "url": f"{FRONTEND_URL}/add-expense/{token}",
        "token": token
    }

@app.get("/api/pending-transaction/{token}", response_model=PendingTransactionResponse)
def get_pending_transaction(token: str, db: Session = Depends(get_db)):
    pending = db.query(PendingTransaction).filter(
        PendingTransaction.token == token
    ).first()
    
    if not pending:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    return PendingTransactionResponse(
        id=pending.id,
        token=pending.token,
        amount=pending.amount,
        note=pending.note,
        status=pending.status
    )

@app.post("/api/confirm-pending/{token}")
async def confirm_pending_transaction(
    token: str,
    data: ExpenseCreate,
    db: Session = Depends(get_db)
):
    """
    Confirm pending transaction: save to Expenses and delete from Pending
    """
    # Find pending transaction
    pending = db.query(PendingTransaction).filter(
        PendingTransaction.token == token,
        PendingTransaction.status == "pending"
    ).first()
    
    if not pending:
        raise HTTPException(status_code=404, detail="Pending transaction not found")
    
    # Create expense
    expense = Expense(
        user_id=pending.user_id,
        amount=data.amount,
        category=data.category,
        description=data.description,
        date=datetime.strptime(data.date, "%Y-%m-%d").date(),
        type=data.type
    )
    
    db.add(expense)
    
    # ✅ Delete from pending (or mark as confirmed)
    pending.status = "confirmed"
    
    db.commit()
    db.refresh(expense)
    
    return {"message": "Transaction confirmed", "expense_id": expense.id}

@app.delete("/api/cancel-pending/{token}")
async def cancel_pending_transaction(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Cancel pending transaction: delete from Pending
    """
    pending = db.query(PendingTransaction).filter(
        PendingTransaction.token == token,
        PendingTransaction.status == "pending"
    ).first()
    
    if not pending:
        raise HTTPException(status_code=404, detail="Pending transaction not found")
    
    # ✅ Mark as cancelled (or delete)
    pending.status = "cancelled"
    
    db.commit()
    
    return {"message": "Transaction cancelled"}