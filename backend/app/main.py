from fastapi import FastAPI
from backend.app.services.prediction_service import predict_flight_delay
from backend.app.models.flight import FlightRequest as FlightData

app = FastAPI(title="Flight Delay Prediction API")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict")
def predict(input_data: FlightData):
    try:
        result = predict_flight_delay(input_data.model_dump())
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}