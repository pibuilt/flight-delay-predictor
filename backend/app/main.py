from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.app.services.prediction_service import load_model, predict_flight_delay
from backend.app.models.flight import FlightRequest as FlightData


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_model()
    yield


app = FastAPI(title="Flight Delay Prediction API", lifespan=lifespan)

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
def predict(input_data: FlightData, request: Request):
    try:
        result = predict_flight_delay(input_data.model_dump(), request.app.state.model)
        return {"success": True, "data": result}
    except Exception:
        raise HTTPException(status_code=500, detail="Prediction failed")