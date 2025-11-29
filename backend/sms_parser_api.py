"""
AI-Powered SMS Parser for Expense Tracking
Uses Claude AI to parse bank SMS messages and extract transaction details
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import os
import re
import json
from datetime import datetime
from urllib.parse import urlencode

# Initialize router
router = APIRouter(prefix="/api/sms-parser", tags=["SMS Parser"])

# Initialize Claude AI client
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if ANTHROPIC_API_KEY:
    import anthropic
    claude_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
else:
    claude_client = None


# ✅ CRITICAL: Define get_db FIRST before using it
def get_db():
    """Get database session - import from main.py"""
    from main import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Pydantic Models
class SMSParseRequest(BaseModel):
    sms_text: str
    account_last_four: Optional[str] = None


class SMSParseResponse(BaseModel):
    success: bool
    amount: Optional[float] = None
    merchant: Optional[str] = None
    transaction_type: str  # 'debit' or 'credit'
    category: Optional[str] = None
    date: Optional[str] = None
    confidence: float  # 0.0 to 1.0
    raw_parsing: dict


def parse_sms_with_claude(sms_text: str) -> dict:
    """
    Use Claude AI to parse bank SMS and extract transaction details
    """
    if not claude_client:
        # Fallback to regex-based parsing if no API key
        return parse_sms_regex(sms_text)
    
    try:
        # Create a structured prompt for Claude
        prompt = f"""Parse this bank SMS message and extract transaction details. Return ONLY a valid JSON object with no additional text.

SMS Message:
{sms_text}

Extract the following information:
1. amount (number): Transaction amount in INR
2. merchant (string): Merchant/shop name or transaction description
3. transaction_type (string): Either "debit" (money out) or "credit" (money in)
4. category (string): One of: Food, Transport, Shopping, Bills, Entertainment, Other
5. date (string): Transaction date in YYYY-MM-DD format (use today if not mentioned)
6. confidence (number): Your confidence in the parsing (0.0 to 1.0)

Example SMS: "Your A/c XX1234 debited by Rs.500 on 13-Nov-25 at Starbucks Cafe. Avl Bal: Rs.10000"
Example Output: {{"amount": 500, "merchant": "Starbucks Cafe", "transaction_type": "debit", "category": "Food", "date": "2025-11-13", "confidence": 0.95}}

Rules:
- If amount has decimals, include them
- For merchant, extract the actual business name, not generic terms
- For category, make your best guess based on merchant name
- Use today's date if date is not in SMS: {datetime.now().strftime("%Y-%m-%d")}
- Set confidence lower if information is ambiguous

Return ONLY the JSON object, nothing else."""

        # Call Claude API
        message = claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract the response
        response_text = message.content[0].text.strip()
        
        # Remove markdown code blocks if present
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        # Parse JSON
        parsed_data = json.loads(response_text)
        
        return {
            "success": True,
            "data": parsed_data,
            "method": "claude_ai"
        }
        
    except Exception as e:
        print(f"Claude AI parsing failed: {e}")
        # Fallback to regex
        return parse_sms_regex(sms_text)


def parse_sms_regex(sms_text: str) -> dict:
    """
    Fallback regex-based SMS parsing (less accurate but always available)
    """
    result = {
        "amount": None,
        "merchant": None,
        "transaction_type": "debit",
        "category": "Other",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "confidence": 0.5
    }
    
    # Convert to lowercase for easier matching
    text_lower = sms_text.lower()
    
    # Extract amount (Rs. 500, Rs 500, INR 500, 500.00, etc.)
    amount_patterns = [
        r'rs\.?\s*(\d+(?:\.\d{2})?)',
        r'inr\.?\s*(\d+(?:\.\d{2})?)',
        r'₹\s*(\d+(?:\.\d{2})?)',
        r'debited.*?(\d+(?:\.\d{2})?)',
        r'credited.*?(\d+(?:\.\d{2})?)',
    ]
    
    for pattern in amount_patterns:
        match = re.search(pattern, text_lower)
        if match:
            result["amount"] = float(match.group(1))
            break
    
    # Determine transaction type
    if any(word in text_lower for word in ['debited', 'debit', 'paid', 'purchase', 'withdrawn']):
        result["transaction_type"] = "debit"
    elif any(word in text_lower for word in ['credited', 'credit', 'received', 'deposit']):
        result["transaction_type"] = "credit"
    
    # Try to extract merchant (text after 'at' or before 'avl bal')
    merchant_patterns = [
        r'at\s+([a-z\s]+?)(?:\.|avl|available|balance|on\s+\d)',
        r'to\s+([a-z\s]+?)(?:\.|avl|available|balance)',
        r'(?:debited|credited).*?(?:at|to)\s+([a-z\s]+)',
    ]
    
    for pattern in merchant_patterns:
        match = re.search(pattern, text_lower)
        if match:
            merchant = match.group(1).strip()
            if len(merchant) > 3:  # Valid merchant name
                result["merchant"] = merchant.title()
                break
    
    # Smart category detection based on keywords
    category_keywords = {
        "Food": ["restaurant", "cafe", "starbucks", "mcdonald", "food", "swiggy", "zomato", "dining"],
        "Transport": ["uber", "ola", "fuel", "petrol", "metro", "taxi", "rapido"],
        "Shopping": ["amazon", "flipkart", "mall", "store", "shop", "myntra"],
        "Bills": ["electricity", "water", "gas", "mobile", "recharge", "jio", "airtel"],
        "Entertainment": ["movie", "netflix", "spotify", "hotstar", "pvr", "cinema"],
    }
    
    for category, keywords in category_keywords.items():
        if any(keyword in text_lower for keyword in keywords):
            result["category"] = category
            result["confidence"] = 0.7
            break
    
    return {
        "success": True,
        "data": result,
        "method": "regex"
    }


@router.post("/parse", response_model=SMSParseResponse)
async def parse_sms_message(request: SMSParseRequest):
    """
    Parse bank SMS and extract transaction details
    
    Example:
    POST /api/sms-parser/parse
    {
        "sms_text": "Your A/c XX1234 debited by Rs.500 on 13-Nov-25 at Starbucks. Avl Bal: Rs.10000",
        "account_last_four": "1234"
    }
    
    Returns:
    {
        "success": true,
        "amount": 500,
        "merchant": "Starbucks",
        "transaction_type": "debit",
        "category": "Food",
        "date": "2025-11-13",
        "confidence": 0.95,
        "raw_parsing": {...}
    }
    """
    
    # Parse SMS using Claude AI (with regex fallback)
    parse_result = parse_sms_with_claude(request.sms_text)
    
    if not parse_result.get("success"):
        raise HTTPException(status_code=400, detail="Failed to parse SMS")
    
    data = parse_result["data"]
    
    return SMSParseResponse(
        success=True,
        amount=data.get("amount"),
        merchant=data.get("merchant"),
        transaction_type=data.get("transaction_type", "debit"),
        category=data.get("category", "Other"),
        date=data.get("date", datetime.now().strftime("%Y-%m-%d")),
        confidence=data.get("confidence", 0.5),
        raw_parsing=parse_result
    )


@router.get("/generate-url/{token}")
async def generate_expense_url_from_sms(
    token: str,
    sms: str = Query(..., description="URL-encoded SMS text"),
    db: Session = Depends(get_db)
):
    """
    Generate personalized expense URL with parsed SMS data as query parameters
    
    This endpoint:
    1. Receives the URL token and SMS text
    2. Parses SMS using Claude AI
    3. Generates URL with amount, merchant, category as query params
    4. Returns redirect to that URL
    
    Example Usage from iOS Shortcut:
    GET /api/sms-parser/generate-url/AURzYl4FjOTnz9iPaKgYbw?sms=Your%20A/c%20debited%20Rs.500%20at%20Starbucks
    
    Returns redirect to:
    https://webapp-expense.vercel.app/add-expense/AURzYl4FjOTnz9iPaKgYbw?amount=500&note=Starbucks&category=Food
    """
    from main import PendingTransaction, FRONTEND_URL
    
    # Verify token exists
    pending = db.query(PendingTransaction).filter(
        PendingTransaction.token == token
    ).first()
    
    if not pending:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    # Parse the SMS
    parse_result = parse_sms_with_claude(sms)
    
    if not parse_result.get("success"):
        # If parsing fails, just redirect to basic URL
        return RedirectResponse(url=f"{FRONTEND_URL}/add-expense/{token}")
    
    data = parse_result["data"]
    
    # Build query parameters
    query_params = {}
    
    if data.get("amount"):
        query_params["amount"] = str(data["amount"])
    
    if data.get("merchant"):
        query_params["note"] = data["merchant"]
    
    if data.get("category"):
        query_params["category"] = data["category"]
    
    if data.get("transaction_type"):
        # Map to your expense types
        query_params["type"] = "income" if data["transaction_type"] == "credit" else "expense"
    
    # Generate final URL with query parameters
    base_url = f"{FRONTEND_URL}/add-expense/{token}"
    
    if query_params:
        query_string = urlencode(query_params)
        final_url = f"{base_url}?{query_string}"
    else:
        final_url = base_url
    
    # Store parsed data in pending transaction for reference
    pending.amount = data.get("amount")
    pending.note = data.get("merchant")
    db.commit()
    
    # Redirect to the final URL
    return RedirectResponse(url=final_url)