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

# Load environment variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./expense_tracker.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Database
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    category = Column(String)
    description = Column(String)
    date = Column(Date)
    type = Column(String)


class PendingTransaction(Base):
    __tablename__ = "pending_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    amount = Column(Float, nullable=True)
    note = Column(String, nullable=True)
    created_at = Column(Date)
    status = Column(String, default="pending")


Base.metadata.create_all(bind=engine)

# Schemas
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
    date: str
    type: str


class ExpenseUpdate(BaseModel):
    amount: Optional[float]
    category: Optional[str]
    description: Optional[str]
    date: Optional[str]
    type: Optional[str]


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


# FastAPI app setup
app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://webapp-expense.vercel.app",
    "https://*.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Utility
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_password_hash(password):
    sha = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(sha)


def verify_password(plain, hashed):
    sha = hashlib.sha256(plain.encode()).hexdigest()
    return pwd_context.verify(sha, hashed)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# Routes
@app.get("/")
def root():
    return {"status": "ok", "message": "Expense Tracker API running"}


@app.post("/signup", response_model=Token)
@app.post("/api/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_pw = get_password_hash(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_pw)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    token = create_access_token({"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/login", response_model=Token)
@app.post("/api/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}


# Expense CRUD
@app.get("/api/expenses", response_model=List[ExpenseResponse])
def get_expenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).order_by(Expense.date.desc()).all()
    return [
        ExpenseResponse(
            id=e.id,
            user_id=e.user_id,
            amount=e.amount,
            category=e.category,
            description=e.description,
            date=e.date.strftime("%Y-%m-%d"),
            type=e.type,
        )
        for e in expenses
    ]


@app.post("/api/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    date_obj = datetime.strptime(expense.date, "%Y-%m-%d").date()
    new_expense = Expense(
        user_id=current_user.id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=date_obj,
        type=expense.type,
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense


@app.put("/api/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, updated: ExpenseUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if updated.amount: expense.amount = updated.amount
    if updated.category: expense.category = updated.category
    if updated.description: expense.description = updated.description
    if updated.date: expense.date = datetime.strptime(updated.date, "%Y-%m-%d").date()
    if updated.type: expense.type = updated.type

    db.commit()
    db.refresh(expense)
    return expense


@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted"}


# Pending Transactions
@app.post("/api/generate-url")
def generate_payment_url(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = token_urlsafe(16)
    pending = PendingTransaction(user_id=current_user.id, token=token, created_at=datetime.utcnow().date())
    db.add(pending)
    db.commit()
    db.refresh(pending)
    base_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return {"url": f"{base_url}/add-expense/{token}", "token": token}


@app.get("/api/pending-transaction/{token}", response_model=PendingTransactionResponse)
def get_pending_transaction(token: str, db: Session = Depends(get_db)):
    pending = db.query(PendingTransaction).filter(PendingTransaction.token == token).first()
    if not pending:
        raise HTTPException(status_code=404, detail="Invalid token")
    return pending


@app.post("/api/confirm-pending/{token}")
def confirm_pending_transaction(token: str, expense: ExpenseCreate, db: Session = Depends(get_db)):
    pending = db.query(PendingTransaction).filter(PendingTransaction.token == token).first()
    if not pending or pending.status != "pending":
        raise HTTPException(status_code=400, detail="Invalid or already processed token")

    expense_date = datetime.strptime(expense.date, "%Y-%m-%d").date()
    new_expense = Expense(
        user_id=pending.user_id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=expense_date,
        type=expense.type,
    )
    db.add(new_expense)
    pending.status = "confirmed"
    db.commit()
    return {"message": "Transaction confirmed"}


@app.delete("/api/cancel-pending/{token}")
def cancel_pending_transaction(token: str, db: Session = Depends(get_db)):
    pending = db.query(PendingTransaction).filter(PendingTransaction.token == token).first()
    if not pending:
        raise HTTPException(status_code=404, detail="Invalid token")
    pending.status = "cancelled"
    db.commit()
    return {"message": "Transaction cancelled"}
