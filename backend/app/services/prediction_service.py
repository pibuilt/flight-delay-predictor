import os
import joblib
import pandas as pd


def load_model():
    current_dir = os.path.dirname(__file__)
    project_root = os.path.abspath(os.path.join(current_dir, "../../../"))
    model_path = os.path.join(project_root, "models", "flight_delay_model.joblib")
    return joblib.load(model_path)


def predict_flight_delay(input_data: dict, model):
    df = pd.DataFrame([input_data])
    prediction = model.predict(df)[0]
    probability = model.predict_proba(df)[0][1]
    return {
        "prediction": int(prediction),
        "delay_probability": float(probability)
    }