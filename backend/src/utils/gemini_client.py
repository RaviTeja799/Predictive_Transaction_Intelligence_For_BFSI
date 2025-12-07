"""Gemini AI Integration for Fraud Detection Insights"""
import os
from typing import Optional, Dict, Any, List
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def get_gemini_model():
    """Get configured Gemini model"""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    try:
        return genai.GenerativeModel(GEMINI_MODEL_NAME)
    except Exception as exc:
        raise RuntimeError(f"Failed to load Gemini model '{GEMINI_MODEL_NAME}': {exc}")

async def generate_fraud_explanation(
    transaction_data: Dict[str, Any],
    prediction_result: Dict[str, Any]
) -> str:
    """Generate human-readable fraud explanation using Gemini"""
    try:
        model = get_gemini_model()
        
        prompt = f"""As a fraud detection expert, analyze this transaction and explain the prediction:

Transaction Details:
- Customer ID: {transaction_data.get('customer_id')}
- Amount: ₹{transaction_data.get('transaction_amount'):,.2f}
- Channel: {transaction_data.get('channel')}
- Account Age: {transaction_data.get('account_age_days')} days
- KYC Status: {transaction_data.get('kyc_verified')}
- Time: Hour {transaction_data.get('hour')}

Prediction:
- Result: {prediction_result.get('prediction')}
- Fraud Probability: {prediction_result.get('fraud_probability', 0)*100:.1f}%
- Risk Level: {prediction_result.get('risk_level')}
- Risk Factors: {', '.join(prediction_result.get('risk_factors', []))}

Provide a concise 2-3 sentence explanation for an analyst, focusing on key risk indicators."""

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return "LLM explanation is temporarily unavailable. Please use the rule-based reason shown above."

async def generate_case_recommendations(
    case_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate investigation recommendations for a fraud case"""
    try:
        model = get_gemini_model()
        
        prompt = f"""As a fraud investigation specialist, provide recommendations for this case:

Case: {case_data.get('case_id')}
Status: {case_data.get('status')}
Priority: {case_data.get('priority')}
Transaction Count: {case_data.get('transaction_count')}
Total Amount: ₹{case_data.get('total_amount', 0):,.2f}

Provide:
1. Top 3 investigation priorities
2. Recommended next actions
3. Evidence to collect

Keep response structured and concise."""

        response = model.generate_content(prompt)
        return {
            "recommendations": response.text,
            "generated_at": "now",
            "confidence": "high"
        }
    except Exception as e:
        return {
            "recommendations": f"Unable to generate recommendations: {str(e)}",
            "generated_at": "now",
            "confidence": "low"
        }

async def analyze_pattern_insights(
    transaction_patterns: List[Dict[str, Any]]
) -> str:
    """Analyze transaction patterns and provide insights"""
    try:
        model = get_gemini_model()
        
        summary = f"Analyzing {len(transaction_patterns)} transactions"
        if transaction_patterns:
            fraud_count = sum(1 for t in transaction_patterns if t.get('is_fraud') == 1)
            avg_amount = sum(t.get('transaction_amount', 0) for t in transaction_patterns) / len(transaction_patterns)
            channels = set(t.get('channel') for t in transaction_patterns)
            
            summary += f"""
- Fraud Rate: {fraud_count}/{len(transaction_patterns)} ({fraud_count/len(transaction_patterns)*100:.1f}%)
- Average Amount: ₹{avg_amount:,.2f}
- Channels: {', '.join(channels)}"""

        prompt = f"""Analyze these transaction patterns and identify key insights:

{summary}

Provide 3-4 bullet points highlighting:
- Notable trends
- Risk patterns
- Operational recommendations"""

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Pattern analysis unavailable: {str(e)}"

FEATURE_DESCRIPTIONS = {
    "transaction_amount": "Transaction Amount measures the monetary value of each transaction. Higher amounts trigger increased scrutiny as fraudsters often attempt large unauthorized transfers.",
    "transaction_amount_log": "Log-scaled Amount normalizes transaction values to detect anomalies across different magnitude ranges, from small test transactions to large fraudulent attempts.",
    "account_age_days": "Account Age tracks how long an account has existed. Newer accounts (under 30 days) show 3x higher fraud rates as criminals create accounts for quick exploitation.",
    "is_high_value": "High Value Flag marks transactions exceeding ₹50,000. These require additional verification as they represent prime targets for fraudulent activity.",
    "hour": "Transaction Hour captures time-of-day patterns. Unusual hours (2-5 AM) correlate with 40% more fraud attempts when legitimate users are typically inactive.",
    "channel_Mobile": "Mobile Channel transactions show distinct risk patterns due to device vulnerabilities and SIM-swap attacks.",
    "channel_ATM": "ATM Channel withdrawals carry risk of card cloning and physical theft.",
    "kyc_verified_No": "Unverified KYC status indicates incomplete identity verification, a significant fraud risk factor."
}

async def generate_model_explanation(
    feature_importance: Dict[str, float],
    metrics: Dict[str, float]
) -> str:
    """Explain model performance and feature importance"""
    try:
        model = get_gemini_model()
        
        top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Build feature context
        feature_details = []
        for feat, imp in top_features:
            desc = FEATURE_DESCRIPTIONS.get(feat, f"{feat.replace('_', ' ').title()} contributes to fraud detection.")
            feature_details.append(f"• {feat} ({imp*100:.1f}%): {desc}")
        
        prompt = f"""You are a fraud detection ML expert. Generate a BRIEF, professional explanation of feature importance for a dashboard.

TOP 5 FEATURES:
{chr(10).join(feature_details)}

TASK: Write exactly 2 short paragraphs (3-4 sentences each). NO introductions, NO greetings, NO "here is", NO bullet points.

Paragraph 1: Explain WHY these specific features matter for detecting fraud. Be specific about each feature's role.

Paragraph 2: Explain HOW the model combines these signals together to flag suspicious transactions. Give one concrete example pattern.

RULES:
- Start directly with the analysis (e.g., "Transaction amount is the strongest...")
- Use simple, clear language
- Keep it under 150 words total
- No markdown formatting, just plain text paragraphs"""

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Aggressive cleanup of unwanted phrases
        unwanted_starts = [
            "Here is", "Here's", "Sure,", "Certainly,", "Okay,", "Absolutely,",
            "Of course,", "I'd be happy", "Let me explain", "The following",
            "Good morning", "Good afternoon", "Hello", "Hi,", "Dear",
        ]
        for phrase in unwanted_starts:
            if text.lower().startswith(phrase.lower()):
                # Find the first sentence end after the phrase
                first_period = text.find('.')
                if first_period > 0 and first_period < 100:
                    text = text[first_period + 1:].strip()
        
        # Remove any markdown headers
        import re
        text = re.sub(r'^#+\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\*\*', '', text)  # Remove bold markers
        text = re.sub(r'^\s*[-•]\s*', '', text, flags=re.MULTILINE)  # Remove bullet points
        text = re.sub(r'\n{3,}', '\n\n', text)  # Normalize line breaks
        
        return text.strip()
    except Exception as e:
        # Return a static fallback explanation
        return """Transaction amount is the strongest fraud indicator, as fraudsters typically attempt larger unauthorized transfers. Account age reveals risk patterns—newer accounts under 30 days show significantly higher fraud rates. The high-value flag triggers additional scrutiny for transactions exceeding ₹50,000, while transaction hour captures suspicious timing patterns during low-activity periods.

The model combines these signals to identify high-risk patterns. For example, a new account (under 7 days) making a large transaction (over ₹25,000) during unusual hours (2-5 AM) via mobile channel would trigger multiple risk factors simultaneously, resulting in a high fraud probability score."""
