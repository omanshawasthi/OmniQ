from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import os
import logging

app = FastAPI(title="QueueLess Wait Time ML API", version="1.0")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables to hold model and encoders
model = None
encoders = None

# Model Configuration
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'wait_time_model.joblib')
ENCODERS_PATH = os.path.join(MODEL_DIR, 'label_encoders.joblib')

FEATURE_ORDER = [
    'sameDepartmentPeopleAhead', 
    'hourOfDay', 
    'dayOfWeek', 
    'branchId', 
    'departmentId', 
    'serviceType'
]

@app.on_event("startup")
async def startup_event():
    global model, encoders
    
    try:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODERS_PATH):
            logger.warning("Model files not found! Make sure to train the model first.")
            return
            
        model = joblib.load(MODEL_PATH)
        encoders = joblib.load(ENCODERS_PATH)
        logger.info("✅ ML Model & Encoders loaded successfully.")
    except Exception as e:
        logger.error(f"❌ Failed to load ML model: {e}")

# Request Validation Schema
class WaitTimeRequest(BaseModel):
    branchId: str
    departmentId: str
    serviceType: str
    sameDepartmentPeopleAhead: int = Field(..., ge=0, description="Number of people waiting before this token in the exact same department")
    # branchStaffCountAtJoin HAS BEEN REMOVED to prevent misleading branch-wide assumptions
    dayOfWeek: int = Field(..., ge=0, le=6, description="0 (Sunday) to 6 (Saturday)")
    hourOfDay: int = Field(..., ge=0, le=23, description="0 to 23")

class WaitTimeResponse(BaseModel):
    predictedWaitMinutes: float

def safe_encode(encoder, value: str) -> int:
    """
    Safely encode categorical values. 
    If a completely brand new unfamiliar category appears, fallback gracefully.
    """
    val_str = str(value)
    if val_str in encoder.classes_:
        return int(encoder.transform([val_str])[0])
    
    # Fallback for unseen values
    logger.warning(f"Unseen categorical value encountered: '{val_str}'. Using default fallback mapping.")
    # Map to the 0th class to prevent application crashing. 
    # (Since RF is a tree model, this treats unknown values as the 'first' category).
    return 0

@app.post("/predict", response_model=WaitTimeResponse)
async def predict_wait_time(request: WaitTimeRequest):
    if model is None or encoders is None:
        raise HTTPException(status_code=503, detail="ML Model is currently unavailable/not trained.")
    
    # Optional logic: If available staff is 0, the wait time is theoretically infinite or severely bottlenecked.
    # We can cap the math or alter it. The tree will just see '0' and guess based on its training.
    
    try:
        # Encode inputs safely
        encoded_branch = safe_encode(encoders['branchId'], request.branchId)
        encoded_dept = safe_encode(encoders['departmentId'], request.departmentId)
        encoded_service = safe_encode(encoders['serviceType'], request.serviceType)
        
        # Build strict feature payload matching pandas DataFrame expectations during training
        input_data = pd.DataFrame([{
            'sameDepartmentPeopleAhead': request.sameDepartmentPeopleAhead,
            'hourOfDay': request.hourOfDay,
            'dayOfWeek': request.dayOfWeek,
            'branchId': encoded_branch,
            'departmentId': encoded_dept,
            'serviceType': encoded_service
        }])[FEATURE_ORDER] # Enforce strict column order
        
        # Inference
        prediction = model.predict(input_data)[0]
        
        # Formatting & Safety checks
        prediction = float(prediction)
        predicted_wait = max(0.0, prediction) # Never predict negatives
        
        return {"predictedWaitMinutes": round(predicted_wait, 2)}
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server prediction error")

@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": model is not None}
