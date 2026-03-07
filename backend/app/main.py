from fastapi import FastAPI
from backend.app.services.prediction_service import predict_flight_delay

app = FastAPI(title="Flight Delay Prediction API")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict")
def predict(input_data: dict):
    try:
        result = predict_flight_delay(input_data)
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}