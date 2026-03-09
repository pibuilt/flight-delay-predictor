from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.services.prediction_service import predict_flight_delay
from backend.app.models.flight import FlightRequest as FlightData

app = FastAPI(title="Flight Delay Prediction API")

# CORS is set to allow all origins because the backend is not publicly
# reachable (no port mapping in docker-compose.yml). All browser requests
# go through nginx on the frontend container, which proxies them internally.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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