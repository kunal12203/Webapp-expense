"""
Voice Transaction API - Convert speech to transaction using Claude AI
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import os
from datetime import datetime, timedelta
import anthropic

router = APIRouter(prefix="/api/voice", tags=["Voice Transactions"])

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


def get_current_user(credentials, db):
    """Import from main"""
    from main import get_current_user as main_get_current_user
    return main_get_current_user(credentials, db)


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
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parse voice transcription and extract transaction details using Claude Haiku
    """
    
    if not claude_client:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    # Get user's categories
    from main import Category
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
        # Call Claude Haiku 4
        message = claude_client.messages.create(
            model="claude-haiku-4-20250514",
            max_tokens=200,
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
        import json
        transaction_data = json.loads(response_text)
        
        # Validate and normalize data
        amount = float(transaction_data.get("amount", 0))
        category = transaction_data.get("category", "Other")
        description = transaction_data.get("description", "Voice transaction")
        date_str = transaction_data.get("date", today_date)
        trans_type = transaction_data.get("type", "expense")
        
        # Ensure category is in user's list
        if category not in category_names:
            # Find closest match or use "Other"
            category = "Other" if "Other" in category_names else category_names[0]
        
        # Validate date format
        date_str = parse_relative_date(date_str)
        
        return VoiceTransactionResponse(
            success=True,
            amount=amount,
            category=category,
            description=description,
            date=date_str,
            type=trans_type
        )
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}, Response: {response_text}")
        return VoiceTransactionResponse(
            success=False,
            error=f"Failed to parse AI response"
        )
    except Exception as e:
        print(f"Voice transaction parsing error: {e}")
        return VoiceTransactionResponse(
            success=False,
            error=str(e)
        )