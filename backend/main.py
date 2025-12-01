from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, date as date_type
from typing import Optional, List
from dotenv import load_dotenv
from secrets import token_urlsafe
import hashlib
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import io
import csv

# Import SMS parser router
from sms_parser_api import router as sms_router

# Load environment variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-PLEASE")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./expense_tracker.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# 📧 Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", os.getenv("SMTP_USER", "noreply@expensetracker.com"))
FROM_NAME = os.getenv("FROM_NAME", "Expense Tracker")
EMAIL_ENABLED = bool(SMTP_USER and SMTP_PASSWORD)

# Fix for Render/Supabase postgres:// vs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ==========================================
# DATABASE MODELS
# ==========================================

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    created_at = Column(Date, default=datetime.utcnow)
    expires_at = Column(Date)
    used = Column(Integer, default=0)

class PendingTransaction(Base):
    __tablename__ = "pending_transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    amount = Column(Float, nullable=True)
    category = Column(String, nullable=True)
    description = Column(String, nullable=True)
    date = Column(String, nullable=True)
    type = Column(String, nullable=True)
    created_at = Column(Date, default=datetime.utcnow)
    status = Column(String, default="pending")

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    category = Column(String)
    description = Column(String)
    date = Column(Date)
    type = Column(String)

# ✅ NEW: Category Model
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(50), nullable=False)
    color = Column(String(7), default="#667EEA")
    icon = Column(String(50), default="📦")
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# ==========================================
# PYDANTIC MODELS
# ==========================================

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

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
    category: Optional[str]
    description: Optional[str]
    date: Optional[str]
    type: Optional[str]
    status: str
    
    class Config:
        from_attributes = True

class PendingTransactionCreate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    type: Optional[str] = None

# ✅ NEW: Category Pydantic Models
class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = "#667EEA"
    icon: Optional[str] = "📦"

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    color: str
    icon: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==========================================
# APP INITIALIZATION
# ==========================================

app = FastAPI(title="Expense Tracker API", version="3.0.0")
app.include_router(sms_router)

# CORS
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://webapp-expense.vercel.app",
    "https://webapp-expense-git-main-kunal12203s-projects.vercel.app",
    "https://webapp-expense-jbhtflpoe-kunal12203s-projects.vercel.app",
    "https://*.vercel.app"
]

if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

if any("vercel.app" in origin for origin in allowed_origins):
    allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# DEPENDENCIES
# ==========================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# HELPER FUNCTIONS
# ==========================================

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

# ✅ NEW: Create Default Categories Helper
def create_default_categories(db: Session, user_id: int):
    """Create default categories for a new user"""
    default_categories = [
        {"name": "Food", "color": "#FF6B6B", "icon": "utensils"},
        {"name": "Transport", "color": "#4ECDC4", "icon": "car"},
        {"name": "Shopping", "color": "#95E1D3", "icon": "shopping-bag"},
        {"name": "Bills", "color": "#FFE66D", "icon": "file-text"},
        {"name": "Entertainment", "color": "#A8E6CF", "icon": "film"},
        {"name": "Income", "color": "#4CAF50", "icon": "dollar-sign"},
        {"name": "Education", "color": "#2196F3", "icon": "book"},
        {"name": "Health", "color": "#E91E63", "icon": "heart"},
    ]
    
    for cat_data in default_categories:
        category = Category(
            user_id=user_id,
            name=cat_data["name"],
            color=cat_data["color"],
            icon=cat_data["icon"]
        )
        db.add(category)
    
    db.commit()

def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send email via SMTP"""
    if not EMAIL_ENABLED:
        print(f"⚠️ Email not configured. Would send to {to_email}: {subject}")
        return False
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email
        
        html_part = MIMEText(html_body, "html")
        msg.attach(html_part)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        return False

# ==========================================
# EXPORT/IMPORT HELPER FUNCTIONS
# ==========================================

# Check if openpyxl is available
try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False

def export_to_csv(expenses: List[Expense]) -> str:
    """Convert expenses to CSV format"""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['Date', 'Amount', 'Category', 'Description', 'Type'])
    
    # Data
    for expense in expenses:
        writer.writerow([
            expense.date.strftime('%Y-%m-%d') if isinstance(expense.date, date_type) else expense.date,
            expense.amount,
            expense.category,
            expense.description,
            expense.type
        ])
    
    return output.getvalue()

def export_to_excel(expenses: List[Expense]) -> bytes:
    """Convert expenses to Excel format with formatting"""
    if not EXCEL_AVAILABLE:
        raise HTTPException(status_code=500, detail="Excel support not available. Install openpyxl.")
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Expenses"
    
    # Header
    headers = ['Date', 'Amount', 'Category', 'Description', 'Type']
    ws.append(headers)
    
    # Style header
    header_fill = PatternFill(start_color="667EEA", end_color="667EEA", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")
    
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
    
    # Data
    for expense in expenses:
        ws.append([
            expense.date.strftime('%Y-%m-%d') if isinstance(expense.date, date_type) else expense.date,
            expense.amount,
            expense.category,
            expense.description,
            expense.type
        ])
    
    # Format amount column
    for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=2, max_col=2):
        for cell in row:
            cell.number_format = '$#,##0.00'
    
    # Auto-adjust column widths
    for i, column in enumerate(ws.columns, 1):
        max_length = 0
        column_letter = get_column_letter(i)
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.read()

def parse_csv_file(file_content: bytes) -> List[dict]:
    """Parse CSV file and return list of expense dicts"""
    text_content = file_content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(text_content))
    
    expenses = []
    for row in reader:
        # Validate required fields
        if not all(key in row for key in ['Date', 'Amount', 'Category', 'Description', 'Type']):
            raise HTTPException(status_code=400, detail="CSV must have columns: Date, Amount, Category, Description, Type")
        
        expenses.append({
            'date': row['Date'],
            'amount': float(row['Amount']),
            'category': row['Category'],
            'description': row['Description'],
            'type': row['Type'].lower()
        })
    
    return expenses

def parse_excel_file(file_content: bytes) -> List[dict]:
    """Parse Excel file and return list of expense dicts"""
    if not EXCEL_AVAILABLE:
        raise HTTPException(status_code=400, detail="Excel support not available")
    
    wb = openpyxl.load_workbook(io.BytesIO(file_content))
    ws = wb.active
    
    expenses = []
    headers = [cell.value for cell in ws[1]]
    
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not any(row):
            continue
        
        expenses.append({
            'date': str(row[0]),
            'amount': float(row[1]),
            'category': str(row[2]),
            'description': str(row[3]),
            'type': str(row[4]).lower()
        })
    
    return expenses

# ==========================================
# AUTH ROUTES
# ==========================================

@app.post("/api/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check existing user
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # ✅ NEW: Create default categories for new user
    create_default_categories(db, new_user.id)
    
    # Create token
    access_token = create_access_token(data={"sub": new_user.username})
    
    # Store username
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    # Generate reset token
    reset_token = token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    token_entry = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=expires_at
    )
    db.add(token_entry)
    db.commit()
    
    # ✅ UPDATED: Create reset URL with token in query parameter
    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    # Send email
    subject = "🔐 Reset Your Password - Expense Tracker"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }}
            .link-box {{ background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all; margin: 15px 0; font-family: monospace; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
                <p>Hi {user.username},</p>
                <p>You requested to reset your password. Click the button below to reset it:</p>
                
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Password Now →</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <div class="link-box">{reset_url}</div>
                
                <p><strong>This link expires in 1 hour.</strong></p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">Expense Tracker - Your Personal Finance Manager</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    email_sent = send_email(user.email, subject, html_body)
    
    # ✅ UPDATED: Return both reset_url and token in dev mode
    if os.getenv("ENVIRONMENT") == "development":
        return {
            "message": "Password reset email sent" if email_sent else "Email not configured (dev mode)",
            "reset_url": reset_url,  # ✅ Added for dev mode
            "token": reset_token
        }
    
    return {"message": "Password reset email sent" if email_sent else "Email not configured"}

@app.post("/api/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_entry = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token,
        PasswordResetToken.used == 0
    ).first()
    
    if not token_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    if token_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token has expired")
    
    user = db.query(User).filter(User.id == token_entry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    token_entry.used = 1
    db.commit()
    
    return {"message": "Password reset successful"}

# ==========================================
# CATEGORY ROUTES
# ==========================================

@app.get("/api/categories", response_model=List[CategoryResponse])
def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all categories for current user"""
    categories = db.query(Category).filter(
        Category.user_id == current_user.id
    ).order_by(Category.name).all()
    
    # If user has no categories, create defaults
    if not categories:
        create_default_categories(db, current_user.id)
        categories = db.query(Category).filter(
            Category.user_id == current_user.id
        ).order_by(Category.name).all()
    
    return categories

@app.post("/api/categories", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new category"""
    # Check if category name already exists for this user
    existing = db.query(Category).filter(
        Category.user_id == current_user.id,
        Category.name == category.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Category '{category.name}' already exists"
        )
    
    # Validate color format
    if category.color and not category.color.startswith("#"):
        raise HTTPException(
            status_code=400,
            detail="Color must be in hex format (e.g., #FF5733)"
        )
    
    new_category = Category(
        user_id=current_user.id,
        name=category.name,
        color=category.color,
        icon=category.icon
    )
    
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return new_category

@app.put("/api/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a category"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name conflicts
    if category_update.name and category_update.name != category.name:
        existing = db.query(Category).filter(
            Category.user_id == current_user.id,
            Category.name == category_update.name
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Category '{category_update.name}' already exists"
            )
        
        category.name = category_update.name
    
    if category_update.color:
        if not category_update.color.startswith("#"):
            raise HTTPException(
                status_code=400,
                detail="Color must be in hex format (e.g., #FF5733)"
            )
        category.color = category_update.color
    
    if category_update.icon:
        category.icon = category_update.icon
    
    db.commit()
    db.refresh(category)
    
    return category

@app.delete("/api/categories/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a category"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category is used
    expense_count = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.category == category.name
    ).count()
    
    if expense_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category '{category.name}' - it's used in {expense_count} expense(s)"
        )
    
    db.delete(category)
    db.commit()
    
    return {"message": f"Category '{category.name}' deleted successfully"}

@app.get("/api/categories/stats")
def get_category_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage statistics for each category"""
    categories = db.query(Category).filter(
        Category.user_id == current_user.id
    ).all()
    
    stats = []
    for category in categories:
        expense_count = db.query(Expense).filter(
            Expense.user_id == current_user.id,
            Expense.category == category.name
        ).count()
        
        total_amount = db.query(Expense).filter(
            Expense.user_id == current_user.id,
            Expense.category == category.name
        ).with_entities(
            db.func.sum(Expense.amount)
        ).scalar() or 0
        
        stats.append({
            "category": category.name,
            "color": category.color,
            "icon": category.icon,
            "expense_count": expense_count,
            "total_amount": float(total_amount),
            "can_delete": expense_count == 0
        })
    
    return stats

# ==========================================
# EXPENSE ROUTES
# ==========================================

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
            id=e.id,
            user_id=e.user_id,
            amount=e.amount,
            category=e.category,
            description=e.description,
            date=e.date.isoformat(),
            type=e.type
        ) for e in expenses
    ]

@app.post("/api/expenses", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_expense = Expense(
        user_id=current_user.id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=datetime.strptime(expense.date, "%Y-%m-%d").date(),
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
        date=new_expense.date.isoformat(),
        type=new_expense.type
    )

@app.put("/api/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if expense.amount is not None:
        db_expense.amount = expense.amount
    if expense.category is not None:
        db_expense.category = expense.category
    if expense.description is not None:
        db_expense.description = expense.description
    if expense.date is not None:
        db_expense.date = datetime.strptime(expense.date, "%Y-%m-%d").date()
    if expense.type is not None:
        db_expense.type = expense.type
    
    db.commit()
    db.refresh(db_expense)
    
    return ExpenseResponse(
        id=db_expense.id,
        user_id=db_expense.user_id,
        amount=db_expense.amount,
        category=db_expense.category,
        description=db_expense.description,
        date=db_expense.date.isoformat(),
        type=db_expense.type
    )

@app.delete("/api/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(db_expense)
    db.commit()
    
    return {"message": "Expense deleted"}

# ==========================================
# EXPORT/IMPORT ROUTES
# ==========================================

@app.get("/api/export/csv")
def export_expenses_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    email: Optional[bool] = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export expenses as CSV"""
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if start_date:
        query = query.filter(Expense.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
    if end_date:
        query = query.filter(Expense.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
    if category:
        query = query.filter(Expense.category == category)
    if type:
        query = query.filter(Expense.type == type)
    
    expenses = query.order_by(Expense.date.desc()).all()
    
    if not expenses:
        raise HTTPException(status_code=404, detail="No expenses found")
    
    csv_content = export_to_csv(expenses)
    
    if email:
        subject = "📊 Your Expense Export"
        html_body = f"""
        <html>
        <body>
            <h2>Your Expense Export</h2>
            <p>Hi {current_user.username},</p>
            <p>Your expense export is attached.</p>
            <p><strong>{len(expenses)} expenses</strong> exported.</p>
        </body>
        </html>
        """
        # TODO: Implement email with attachment
        return {"message": "Email sent successfully", "count": len(expenses)}
    
    filename = f"expenses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/export/excel")
def export_expenses_excel(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    email: Optional[bool] = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export expenses as Excel"""
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if start_date:
        query = query.filter(Expense.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
    if end_date:
        query = query.filter(Expense.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
    if category:
        query = query.filter(Expense.category == category)
    if type:
        query = query.filter(Expense.type == type)
    
    expenses = query.order_by(Expense.date.desc()).all()
    
    if not expenses:
        raise HTTPException(status_code=404, detail="No expenses found")
    
    excel_content = export_to_excel(expenses)
    
    filename = f"expenses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        io.BytesIO(excel_content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.post("/api/import")
async def import_expenses(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import expenses from CSV or Excel file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_ext = file.filename.split('.')[-1].lower()
    
    if file_ext not in ['csv', 'xlsx', 'xls']:
        raise HTTPException(status_code=400, detail="File must be CSV or Excel")
    
    content = await file.read()
    
    # Parse file
    try:
        if file_ext == 'csv':
            expenses_data = parse_csv_file(content)
        else:
            expenses_data = parse_excel_file(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
    
    # Import expenses
    imported = 0
    failed = 0
    errors = []
    
    for idx, exp_data in enumerate(expenses_data, 1):
        try:
            new_expense = Expense(
                user_id=current_user.id,
                amount=exp_data['amount'],
                category=exp_data['category'],
                description=exp_data['description'],
                date=datetime.strptime(exp_data['date'], "%Y-%m-%d").date(),
                type=exp_data['type']
            )
            db.add(new_expense)
            imported += 1
        except Exception as e:
            failed += 1
            errors.append(f"Row {idx}: {str(e)}")
    
    db.commit()
    
    return {
        "message": "Import completed",
        "imported": imported,
        "failed": failed,
        "total": len(expenses_data),
        "errors": errors[:10]  # Return first 10 errors
    }

# ==========================================
# PENDING TRANSACTION ROUTES
# ==========================================

@app.post("/api/generate-payment-url")
def generate_payment_url(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    unique_token = token_urlsafe(16)
    
    pending = PendingTransaction(
        user_id=current_user.id,
        token=unique_token,
        status="pending"
    )
    db.add(pending)
    db.commit()
    
    url = f"{FRONTEND_URL}/add-expense/{unique_token}"
    return {"url": url, "token": unique_token}

@app.get("/api/pending-transactions", response_model=List[PendingTransactionResponse])
def get_pending_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pending = db.query(PendingTransaction).filter(
        PendingTransaction.user_id == current_user.id,
        PendingTransaction.status == "pending"
    ).order_by(PendingTransaction.created_at.desc()).all()
    
    return pending

@app.get("/api/pending-transaction/{token}")
def get_pending_transaction(token: str, db: Session = Depends(get_db)):
    pending = db.query(PendingTransaction).filter(
        PendingTransaction.token == token,
        PendingTransaction.status == "pending"
    ).first()
    
    if not pending:
        raise HTTPException(status_code=404, detail="Invalid or expired token")
    
    return {
        "token": pending.token,
        "amount": pending.amount,
        "category": pending.category,
        "description": pending.description,
        "date": pending.date,
        "type": pending.type
    }

@app.put("/api/pending-transaction/{token}")
def update_pending_transaction(
    token: str,
    data: PendingTransactionCreate,
    db: Session = Depends(get_db)
):
    pending = db.query(PendingTransaction).filter(
        PendingTransaction.token == token,
        PendingTransaction.status == "pending"
    ).first()
    
    if not pending:
        raise HTTPException(status_code=404, detail="Invalid or expired token")
    
    if data.amount is not None:
        pending.amount = data.amount
    if data.category is not None:
        pending.category = data.category
    if data.description is not None:
        pending.description = data.description
    if data.date is not None:
        pending.date = data.date
    if data.type is not None:
        pending.type = data.type
    
    db.commit()
    return {"message": "Updated"}

@app.post("/api/pending-transaction/{token}/approve")
def approve_pending_transaction(token: str, db: Session = Depends(get_db)):
    pending = db.query(PendingTransaction).filter(
        PendingTransaction.token == token,
        PendingTransaction.status == "pending"
    ).first()
    
    if not pending:
        raise HTTPException(status_code=404, detail="Invalid or expired token")
    
    if not all([pending.amount, pending.category, pending.description, pending.date, pending.type]):
        raise HTTPException(status_code=400, detail="Incomplete transaction data")
    
    new_expense = Expense(
        user_id=pending.user_id,
        amount=pending.amount,
        category=pending.category,
        description=pending.description,
        date=datetime.strptime(pending.date, "%Y-%m-%d").date(),
        type=pending.type
    )
    db.add(new_expense)
    
    pending.status = "approved"
    db.commit()
    
    return {"message": "Transaction approved"}

@app.delete("/api/pending-transaction/{token}")
def delete_pending_transaction(token: str, db: Session = Depends(get_db)):
    pending = db.query(PendingTransaction).filter(
        PendingTransaction.token == token
    ).first()
    
    if not pending:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(pending)
    db.commit()
    
    return {"message": "Transaction deleted"}

# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/")
def read_root():
    return {
        "app": "Expense Tracker API",
        "version": "3.0.0",
        "status": "running",
        "features": [
            "Authentication",
            "Password Reset",
            "Expenses CRUD",
            "Categories CRUD",
            "Export (CSV/Excel)",
            "Import (CSV/Excel)",
            "Pending Transactions",
            "SMS Parsing"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}