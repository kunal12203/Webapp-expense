"""
Voice Transaction API - Convert speech to transaction using Claude AI
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import os
import json
from datetime import datetime, timedelta
import anthropic

router = APIRouter(prefix="/api/voice", tags=["Voice Transactions"])

# Security
security = HTTPBearer()

# Initialize Claude AI client
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if ANTHROPIC_API_KEY:
    claude_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
else:
    claude_client = None


def get_db():
    """Get database session"""
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def authenticate_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Authenticate user from JWT token"""
    from main import User, SECRET_KEY, ALGORITHM
    from jose import jwt, JWTError
    
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
    except JWTError as e:
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
    Parse voice transcription and extract transaction details using Claude Haiku
    """
    
    # Import models here to avoid circular import
    from main import Category
    
    if not claude_client:
        raise HTTPException(status_code=500, detail="AI service not configured. Please set ANTHROPIC_API_KEY.")
    
    # Get user's categories
    user_categories = db.query(Category).filter(
        Category.user_id == current_user.id
    ).all()
    
    category_names = [cat.name for cat in user_categories]
    
    if not category_names:
        category_names = ["Food", "Transport", "Bills", "Shopping", "Other"]
    
    # Prepare prompt for Claude
    today_date = datetime.now().date().isoformat()
    
    prompt = f"""Extract transaction details from this voice input. The user may speak in English, Hindi, Hinglish, or any Indian language, but RETURN EVERYTHING IN ENGLISH.

Voice Input: "{request.text}"

User's Categories: {', '.join(category_names)}
Today's Date: {today_date}

Extract and return ONLY a JSON object with these fields:
- amount (number): The transaction amount
- category (string): Best matching category from user's list
- description (string): Brief description in English (2-5 words)
- date (string): In YYYY-MM-DD format. Parse relative dates:
  * "today" → {today_date}
  * "yesterday" → {(datetime.now().date() - timedelta(days=1)).isoformat()}
  * "last week" → {(datetime.now().date() - timedelta(days=7)).isoformat()}
  * If no date mentioned → {today_date}
- type (string): "expense" or "income"

Examples:
Input: "I spent 500 rupees on groceries"
Output: {{"amount": 500, "category": "Food", "description": "Groceries", "date": "{today_date}", "type": "expense"}}

Input: "Maine kal 200 ka petrol bharwaya"
Output: {{"amount": 200, "category": "Transport", "description": "Petrol", "date": "{(datetime.now().date() - timedelta(days=1)).isoformat()}", "type": "expense"}}

Input: "Paid 1500 for electricity bill yesterday"
Output: {{"amount": 1500, "category": "Bills", "description": "Electricity bill", "date": "{(datetime.now().date() - timedelta(days=1)).isoformat()}", "type": "expense"}}

Return ONLY the JSON object, no other text."""

    try:
        # Call Claude Haiku 4.5 (correct model name)
        message = claude_client.messages.create(
            model="claude-haiku-4-5",  # Correct Haiku 4.5 model string
            max_tokens=300,
            temperature=0.0,  # Deterministic
            messages=[{"role": "user", "content": prompt}]
        )
        
        response_text = message.content[0].text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        response_text = response_text.strip()
        
        # Parse JSON response
        transaction_data = json.loads(response_text)
        
        # Validate and normalize data - handle None values properly
        amount_raw = transaction_data.get("amount")
        
        # Check if amount is None or invalid
        if amount_raw is None or amount_raw == "":
            return VoiceTransactionResponse(
                success=False,
                error="Could not detect amount in your input. Please say the amount clearly, for example: 'I spent 500 rupees on groceries'"
            )
        
        try:
            amount = float(amount_raw)
        except (ValueError, TypeError):
            return VoiceTransactionResponse(
                success=False,
                error="Could not understand the amount. Please try again with a clear number."
            )
        
        category = transaction_data.get("category") or "Other"
        description = transaction_data.get("description") or "Voice transaction"
        date_str = transaction_data.get("date") or today_date
        trans_type = transaction_data.get("type") or "expense"
        
        # Validate amount is positive
        if amount <= 0:
            return VoiceTransactionResponse(
                success=False,
                error="Amount must be greater than zero. Please try again."
            )
        
        # Ensure category is in user's list
        if category not in category_names:
            # Find closest match or use "Other"
            category = "Other" if "Other" in category_names else category_names[0]
        
        # Validate date format
        date_str = parse_relative_date(date_str)
        
        # Create pending transaction in database
        from main import PendingTransaction
        from secrets import token_urlsafe
        
        pending = PendingTransaction(
            user_id=current_user.id,
            token=token_urlsafe(16),
            amount=amount,
            description=description,
            category=category,
            date=date_str,
            type=trans_type,
            status="pending",
            # No splitwise fields for voice transactions
        )
        
        db.add(pending)
        db.commit()
        db.refresh(pending)
        
        return VoiceTransactionResponse(
            success=True,
            amount=amount,
            category=category,
            description=description,
            date=date_str,
            type=trans_type
        )
        
    except json.JSONDecodeError as e:
        return VoiceTransactionResponse(
            success=False,
            error="Failed to understand the AI response. Please try speaking more clearly."
        )
    except anthropic.NotFoundError as e:
        return VoiceTransactionResponse(
            success=False,
            error="AI service configuration error. Please contact support."
        )
    except anthropic.APIError as e:
        return VoiceTransactionResponse(
            success=False,
            error="AI service temporarily unavailable. Please check your internet connection and try again."
        )
    except Exception as e:
        return VoiceTransactionResponse(
            success=False,
            error=f"Unable to process voice input. Please try again or check your internet connection."
        )