"""
Voice Transaction API - Convert speech to transaction using Claude AI
ROOT FIX: Proper FastAPI router structure with HTTPBearer authentication
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import os
from datetime import datetime, timedelta
import anthropic
from secrets import token_urlsafe

# Create router (NOT app!)
router = APIRouter(prefix="/api/voice", tags=["Voice Transactions"])

# Security
security = HTTPBearer()

# Initialize Claude AI client
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if ANTHROPIC_API_KEY:
    claude_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
else:
    claude_client = None
    print("Warning: ANTHROPIC_API_KEY not set. Voice features will not work.")


def get_db():
    """Get database session"""
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def authenticate_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    """Authenticate user from JWT token - avoids circular import"""
    from main import User
    from jose import jwt, JWTError
    
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-keep-it-secret")
    ALGORITHM = "HS256"
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


# Pydantic Models
class VoiceTransactionRequest(BaseModel):
    text: str  # Transcribed text from browser


class VoiceTransactionResponse(BaseModel):
    success: bool
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    type: str = "expense"
    error: Optional[str] = None
    pending_id: Optional[int] = None


def parse_relative_date(date_text: str) -> str:
    """Convert relative dates like 'yesterday', 'today' to YYYY-MM-DD"""
    today = datetime.now().date()
    
    date_lower = date_text.lower()
    
    if "today" in date_lower:
        return today.isoformat()
    elif "yesterday" in date_lower:
        return (today - timedelta(days=1)).isoformat()
    elif "day before yesterday" in date_lower:
        return (today - timedelta(days=2)).isoformat()
    elif "last week" in date_lower:
        return (today - timedelta(days=7)).isoformat()
    else:
        # Try to parse as date, otherwise return today
        try:
            # If date_text is already in YYYY-MM-DD format
            datetime.strptime(date_text, "%Y-%m-%d")
            return date_text
        except:
            return today.isoformat()


@router.post("/parse-transaction", response_model=VoiceTransactionResponse)
def parse_voice_transaction(
    request: VoiceTransactionRequest,
    current_user = Depends(authenticate_user),
    db: Session = Depends(get_db)
):
    """
    Parse voice transcription and extract transaction details using Claude AI
    Creates a pending transaction that user can approve/edit
    """
    
    # Import models here to avoid circular import
    from main import Category, PendingTransaction
    
    if not claude_client:
        raise HTTPException(
            status_code=500, 
            detail="AI service not configured. Please set ANTHROPIC_API_KEY environment variable."
        )
    
    # Get user's categories for better matching
    user_categories = db.query(Category).filter(
        Category.user_id == current_user.id
    ).all()
    
    category_names = [cat.name for cat in user_categories]
    
    if not category_names:
        category_names = ["Food", "Transport", "Bills", "Shopping", "Health", "Entertainment", "Other"]
    
    # Prepare prompt for Claude
    today_date = datetime.now().date().isoformat()
    
    prompt = f"""Extract transaction details from this voice input. The user may speak in English, Hindi, Hinglish, or any Indian language, but RETURN EVERYTHING IN ENGLISH.

Voice Input: "{request.text}"

User's Categories: {', '.join(category_names)}
Today's Date: {today_date}

Extract and return ONLY a JSON object with these fields:
- amount (number): The transaction amount (extract numbers like 500, 1000, etc)
- category (string): Best matching category from user's list above
- description (string): Brief description in English (2-5 words max)
- date (string): In YYYY-MM-DD format. Parse relative dates:
  * "today" or no date mentioned → {today_date}
  * "yesterday" or "kal" → {(datetime.now().date() - timedelta(days=1)).isoformat()}
  * "last week" → {(datetime.now().date() - timedelta(days=7)).isoformat()}
- type (string): "expense" or "income"

Examples:
Input: "I spent 500 rupees on groceries"
Output: {{"amount": 500, "category": "Food", "description": "Groceries", "date": "{today_date}", "type": "expense"}}

Input: "Maine kal 200 ka petrol bharwaya"
Output: {{"amount": 200, "category": "Transport", "description": "Petrol", "date": "{(datetime.now().date() - timedelta(days=1)).isoformat()}", "type": "expense"}}

Input: "Paid 1500 for electricity bill yesterday"
Output: {{"amount": 1500, "category": "Bills", "description": "Electricity bill", "date": "{(datetime.now().date() - timedelta(days=1)).isoformat()}", "type": "expense"}}

Input: "Got 50000 salary"
Output: {{"amount": 50000, "category": "Income", "description": "Salary", "date": "{today_date}", "type": "income"}}

Return ONLY the JSON object, no other text."""

    try:
        # Call Claude Sonnet 4 for high quality parsing
        message = claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            temperature=0.0,  # Deterministic for consistent parsing
            messages=[{"role": "user", "content": prompt}]
        )
        
        response_text = message.content[0].text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])  # Remove first and last line
        if response_text.startswith("json"):
            response_text = response_text[4:].strip()
        
        # Parse JSON response
        import json
        parsed_data = json.loads(response_text)
        
        # Extract and validate fields
        amount = parsed_data.get("amount")
        category = parsed_data.get("category") or "Other"
        description = parsed_data.get("description") or request.text[:50]
        date_str = parsed_data.get("date")
        transaction_type = parsed_data.get("type", "expense")
        
        # Validate amount
        if not amount or amount <= 0:
            return VoiceTransactionResponse(
                success=False,
                error="Could not detect a valid amount in your input. Please try again."
            )
        
        # Parse date
        if date_str:
            final_date = parse_relative_date(date_str)
        else:
            final_date = today_date
        
        # Validate category exists in user's list
        if category not in category_names:
            # Find closest match or use Other
            category = "Other"
        
        # Create pending transaction
        pending = PendingTransaction(
            user_id=current_user.id,
            token=token_urlsafe(16),
            amount=float(amount),
            description=description,
            category=category,
            date=final_date,
            type=transaction_type,
            status="pending",
            # No Splitwise fields for voice transactions
        )
        
        db.add(pending)
        db.commit()
        db.refresh(pending)
        
        return VoiceTransactionResponse(
            success=True,
            amount=float(amount),
            category=category,
            description=description,
            date=final_date,
            type=transaction_type,
            pending_id=pending.id
        )
        
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}, response: {response_text}")
        return VoiceTransactionResponse(
            success=False,
            error=f"Could not parse AI response. Please try speaking more clearly."
        )
    except Exception as e:
        print(f"Voice parsing error: {e}")
        return VoiceTransactionResponse(
            success=False,
            error=f"Failed to process voice input: {str(e)}"
        )