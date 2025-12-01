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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import Query
from fastapi.responses import StreamingResponse  # ← ADD THIS TOO
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Query

from export_import import (
    export_to_csv, 
    export_to_excel, 
    send_export_email,
    parse_csv_file,
    parse_excel_file,
    EXCEL_AVAILABLE
)

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

# 📧 Email Configuration (Add these to your .env file)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")  # Your email address
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")  # App password (not your regular password)
FROM_EMAIL = os.getenv("FROM_EMAIL", os.getenv("SMTP_USER", "noreply@expensetracker.com"))
FROM_NAME = os.getenv("FROM_NAME", "Expense Tracker")
EMAIL_ENABLED = bool(SMTP_USER and SMTP_PASSWORD)  # Only send emails if configured

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


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    created_at = Column(Date, default=datetime.utcnow)
    expires_at = Column(Date)
    used = Column(Integer, default=0)  # Using Integer for SQLite compatibility (0=False, 1=True)


class PendingTransaction(Base):
    __tablename__ = "pending_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    amount = Column(Float, nullable=True)
    category = Column(String, nullable=True)
    description = Column(String, nullable=True)  # ✅ Use "description"
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

# 📧 Email Sending Function
def send_password_reset_email(to_email: str, reset_token: str, username: str) -> bool:
    """
    Send password reset email with clickable link (token in URL)
    Returns True if sent successfully, False otherwise
    """
    if not EMAIL_ENABLED:
        print(f"⚠️  Email not configured. Reset token for {to_email}: {reset_token}")
        return False
    
    try:
        # Create email message
        message = MIMEMultipart("alternative")
        message["Subject"] = "Password Reset Request - Expense Tracker"
        message["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        message["To"] = to_email
        
        # Reset URL with token (clickable link!)
        reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        
        # HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4); }}
                .button:hover {{ box-shadow: 0 6px 8px rgba(102, 126, 234, 0.6); }}
                .link-box {{ background: white; border: 2px solid #e0e0e0; padding: 15px; margin: 20px 0; border-radius: 8px; word-break: break-all; }}
                .link {{ font-family: 'Courier New', monospace; font-size: 13px; color: #667eea; }}
                .warning {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hi <strong>{username}</strong>,</p>
                    <p>You requested to reset your password for your Expense Tracker account.</p>
                    
                    <p><strong>Click the button below to reset your password:</strong></p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password Now →</a>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
                    <div class="link-box">
                        <p class="link">{reset_url}</p>
                    </div>
                    
                    <div class="warning">
                        <strong>⏰ Important:</strong> This link expires in <strong>1 hour</strong> and can only be used once.
                    </div>
                    
                    <p style="font-size: 14px; color: #666;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                </div>
                <div class="footer">
                    <p>This is an automated email from Expense Tracker. Please do not reply.</p>
                    <p>&copy; 2024 Expense Tracker. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text alternative
        text_body = f"""
        Password Reset Request - Expense Tracker
        
        Hi {username},
        
        You requested to reset your password for your Expense Tracker account.
        
        Click this link to reset your password:
        {reset_url}
        
        Or copy and paste the link above into your browser.
        
        ⏰ Important: This link expires in 1 hour and can only be used once.
        
        If you didn't request this password reset, please ignore this email.
        
        ---
        Expense Tracker Team
        """
        
        # Attach both HTML and plain text versions
        part1 = MIMEText(text_body, "plain")
        part2 = MIMEText(html_body, "html")
        message.attach(part1)
        message.attach(part2)
        
        # Send email via SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()  # Secure the connection
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
        
        print(f"✅ Password reset email sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {str(e)}")
        return False

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


@app.get("/api/export/csv")
def export_expenses_csv(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    type: Optional[str] = Query(None, description="Filter by type (expense/income)"),
    email: bool = Query(False, description="Send via email instead of download"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export expenses to CSV format
    
    Options:
    - Direct download (default): email=false
    - Email delivery: email=true
    - Filters: start_date, end_date, category, type
    """
    # Build query
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    # Apply filters
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(Expense.date >= start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(Expense.date <= end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    if category:
        query = query.filter(Expense.category == category)
    
    if type:
        if type not in ["expense", "income"]:
            raise HTTPException(status_code=400, detail="Type must be 'expense' or 'income'")
        query = query.filter(Expense.type == type)
    
    # Get expenses
    expenses = query.order_by(Expense.date.desc()).all()
    
    if not expenses:
        raise HTTPException(status_code=404, detail="No expenses found")
    
    # Generate CSV
    csv_output = export_to_csv(expenses)
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"expenses_{timestamp}.csv"
    
    # Email delivery
    if email:
        csv_bytes = csv_output.getvalue().encode('utf-8')
        email_sent = send_export_email(
            to_email=current_user.email,
            username=current_user.username,
            file_content=csv_bytes,
            filename=filename,
            file_type='csv'
        )
        
        if email_sent:
            return {
                "message": f"Export sent to {current_user.email}",
                "filename": filename,
                "count": len(expenses),
                "format": "csv"
            }
        else:
            raise HTTPException(status_code=500, detail="Email not configured or failed to send")
    
    # Direct download
    return StreamingResponse(
        iter([csv_output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@app.get("/api/export/excel")
def export_expenses_excel(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    type: Optional[str] = Query(None, description="Filter by type (expense/income)"),
    email: bool = Query(False, description="Send via email instead of download"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export expenses to Excel format (XLSX)
    
    Options:
    - Direct download (default): email=false
    - Email delivery: email=true
    - Filters: start_date, end_date, category, type
    """
    if not EXCEL_AVAILABLE:
        raise HTTPException(
            status_code=500, 
            detail="Excel export not available. Install openpyxl: pip install openpyxl"
        )
    
    # Build query (same as CSV)
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    # Apply filters (same as CSV)
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(Expense.date >= start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(Expense.date <= end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    if category:
        query = query.filter(Expense.category == category)
    
    if type:
        if type not in ["expense", "income"]:
            raise HTTPException(status_code=400, detail="Type must be 'expense' or 'income'")
        query = query.filter(Expense.type == type)
    
    # Get expenses
    expenses = query.order_by(Expense.date.desc()).all()
    
    if not expenses:
        raise HTTPException(status_code=404, detail="No expenses found")
    
    # Generate Excel
    excel_output = export_to_excel(expenses)
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"expenses_{timestamp}.xlsx"
    
    # Email delivery
    if email:
        email_sent = send_export_email(
            to_email=current_user.email,
            username=current_user.username,
            file_content=excel_output.getvalue(),
            filename=filename,
            file_type='excel'
        )
        
        if email_sent:
            return {
                "message": f"Export sent to {current_user.email}",
                "filename": filename,
                "count": len(expenses),
                "format": "excel"
            }
        else:
            raise HTTPException(status_code=500, detail="Email not configured or failed to send")
    
    # Direct download
    return StreamingResponse(
        excel_output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

# ==========================================
# IMPORT ENDPOINTS
# ==========================================

@app.post("/api/import")
async def import_expenses(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import expenses from CSV or Excel file
    
    Supported formats:
    - CSV (.csv)
    - Excel (.xlsx, .xls)
    
    Required columns:
    - Date (YYYY-MM-DD format)
    - Amount (number)
    - Category (text)
    - Description (text)
    - Type (expense/income)
    """
    # Validate file type
    file_extension = file.filename.split('.')[-1].lower()
    
    if file_extension not in ['csv', 'xlsx', 'xls']:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Supported formats: CSV, XLSX"
        )
    
    # Read file content
    content = await file.read()
    
    # Parse file based on type
    try:
        if file_extension == 'csv':
            expenses_data = parse_csv_file(content.decode('utf-8'))
        else:  # xlsx or xls
            if not EXCEL_AVAILABLE:
                raise HTTPException(
                    status_code=500,
                    detail="Excel import not available. Install openpyxl: pip install openpyxl"
                )
            expenses_data = parse_excel_file(content)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse file: {str(e)}"
        )
    
    if not expenses_data:
        raise HTTPException(
            status_code=400,
            detail="No valid expenses found in file"
        )
    
    # Import expenses to database
    imported_count = 0
    failed_count = 0
    errors = []
    
    for expense_data in expenses_data:
        try:
            # Parse date
            try:
                expense_date = datetime.strptime(expense_data['date'], "%Y-%m-%d").date()
            except ValueError:
                # Try other common formats
                for fmt in ["%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"]:
                    try:
                        expense_date = datetime.strptime(expense_data['date'], fmt).date()
                        break
                    except ValueError:
                        continue
                else:
                    raise ValueError(f"Invalid date format: {expense_data['date']}")
            
            # Create expense
            new_expense = Expense(
                user_id=current_user.id,
                amount=expense_data['amount'],
                category=expense_data['category'],
                description=expense_data['description'],
                date=expense_date,
                type=expense_data['type']
            )
            
            db.add(new_expense)
            imported_count += 1
            
        except Exception as e:
            failed_count += 1
            errors.append(f"Row: {expense_data} - Error: {str(e)}")
    
    # Commit all imports
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save expenses: {str(e)}"
        )
    
    return {
        "message": "Import completed",
        "imported": imported_count,
        "failed": failed_count,
        "total": len(expenses_data),
        "errors": errors[:10] if errors else []  # Limit error messages to 10
    }

@app.get("/api/export/info")
def get_export_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get export information and capabilities
    """
    expense_count = db.query(Expense).filter(Expense.user_id == current_user.id).count()
    
    return {
        "total_expenses": expense_count,
        "formats": {
            "csv": {
                "available": True,
                "description": "Universal format, works with Excel/Sheets"
            },
            "excel": {
                "available": EXCEL_AVAILABLE,
                "description": "Excel format with formatting"
            }
        },
        "delivery": {
            "download": {
                "available": True,
                "description": "Direct download to your device"
            },
            "email": {
                "available": EMAIL_ENABLED,
                "description": f"Send to {current_user.email}"
            }
        }
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

@app.post("/api/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Secure password reset with email delivery
    - Sends reset token via email if configured
    - Falls back to returning token if email not set up
    - Token expires in 1 hour and is single-use
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        # For security, don't reveal if email exists
        # Always return success message
        return {
            "message": "If that email exists, a reset link has been sent",
            "email_sent": False
        }
    
    # Generate secure token (32 bytes = 43 characters URL-safe)
    reset_token = token_urlsafe(32)
    
    # Create password reset token (expires in 1 hour)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    password_reset = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=expires_at.date(),
        used=0
    )
    
    db.add(password_reset)
    db.commit()
    
    # 📧 Try to send email
    email_sent = send_password_reset_email(user.email, reset_token, user.username)
    
    if email_sent:
        # Email sent successfully - don't return token
        return {
            "message": f"Password reset instructions sent to {user.email}",
            "email_sent": True
        }
    else:
        # Email not configured - return reset URL (dev mode)
        reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        return {
            "message": "Password reset link generated (Email not configured - showing link)",
            "reset_url": reset_url,
            "token": reset_token,
            "expires_in": "1 hour",
            "email_sent": False,
            "note": "In production, this would be sent via email. Add SMTP credentials to .env file."
        }

@app.post("/api/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using the token
    """
    # Find valid token
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token,
        PasswordResetToken.used == 0
    ).first()
    
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check if token is expired (compare dates)
    if reset_token.expires_at < datetime.utcnow().date():
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Get user
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    
    # Mark token as used
    reset_token.used = 1
    
    db.commit()
    
    return {"message": "Password successfully reset"}

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
        category=pending.category,
        description=pending.description,
        date=pending.date,
        type=pending.type,
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