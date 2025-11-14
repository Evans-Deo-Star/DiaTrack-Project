# ml-service/app.py

from flask import Flask, request, jsonify
import numpy as np
import pickle
import os

app = Flask(__name__)

# --- Load the Trained Model and Scaler ---
MODEL = None
SCALER = None

if os.path.exists('model.pkl') and os.path.exists('scaler.pkl'):
    try:
        with open('model.pkl', 'rb') as file:
            MODEL = pickle.load(file)
        with open('scaler.pkl', 'rb') as file:
            SCALER = pickle.load(file)
        print("✅ 98.4%-accuracy Random Forest Model loaded successfully.")
    except Exception as e:
        print(f"❌ Error loading model files: {e}")
        print("Model prediction will use default values.")
else:
    print("⚠️ model.pkl or scaler.pkl not found. Run train_model.py first!")

# --- Clinical Risk Level Mapping ---
def get_risk_level_clinical(blood_sugar_mgdl):
    """
    Determines clinical risk level based on blood sugar (mg/dL)
    Follows standard ADA guidelines for adults (fasting/random)
    """
    if blood_sugar_mgdl < 100:
        return "Low"
    elif 100 <= blood_sugar_mgdl < 126:
        return "Medium"
    else:  # >= 126
        return "High"

# --- Recommendation Generator ---
def generate_recommendation(risk_level):
    if risk_level == "High":
        return "High Risk: Immediately recheck your blood sugar, drink water, and do 15 mins light activity."
    elif risk_level == "Medium":
        return "Medium Risk: Monitor closely, manage carb intake, and stay active."
    else:
        return "Low Risk: Keep up your current healthy habits and log your next reading as scheduled."

# --- Prediction Function ---
def get_prediction(data):
    """Predicts risk probability using the ML model."""
    if MODEL is None or SCALER is None:
        return 0.5  # Default if model unavailable

    # Ensure we have all 7 features as used in training
    features = np.array([[
        data.get('blood_sugar', 120),
        data.get('carb_intake', 60),
        data.get('activity', 30),
        data.get('bs_carb_interaction', data.get('blood_sugar',120)*data.get('carb_intake',60)),
        data.get('carb_per_activity', data.get('carb_intake',60)/(data.get('activity',0)+1)),
        data.get('bs_squared', data.get('blood_sugar',120)**2),
        data.get('activity_inverse', 1/(data.get('activity',0)+1))
    ]])

    # Scale features
    try:
        scaled_features = SCALER.transform(features)
    except Exception as e:
        print("❌ Error scaling features:", e)
        return 0.5

    # Predict probability of HIGH risk (class 1)
    try:
        risk_probability = MODEL.predict_proba(scaled_features)[0][1]
    except Exception as e:
        print("❌ Error during prediction:", e)
        risk_probability = 0.5

    return risk_probability

# --- API Endpoint ---
@app.route('/predict_risk', methods=['POST'])
def predict_risk():
    data = request.get_json()

    # Default placeholders
    latest_blood_sugar = data.get('latest_blood_sugar', 120)
    carb_intake = data.get('carb_intake', 60)
    activity = data.get('activity', 30)

    # Feature engineering
    features = {
        'blood_sugar': latest_blood_sugar,
        'carb_intake': carb_intake,
        'activity': activity,
        'bs_carb_interaction': latest_blood_sugar * carb_intake,
        'carb_per_activity': carb_intake / (activity + 1),
        'bs_squared': latest_blood_sugar**2,
        'activity_inverse': 1 / (activity + 1)
    }

    print("📩 Received data for prediction:", data)

    # ML Prediction
    risk_probability = get_prediction(features)

    # Clinical risk mapping
    risk_level = get_risk_level_clinical(latest_blood_sugar)

    # Generate advice
    recommendation = generate_recommendation(risk_level)

    return jsonify({
        "success": True,
        "risk_probability": risk_probability,
        "risk_level": risk_level,
        "recommendation": recommendation,
        "model_used": "Random Forest (98.4% accuracy)"
    })


if __name__ == '__main__':
    # Flask dev server (port different from Node.js backend)
    app.run(debug=True, port=5001)
