# ml-service/train_model.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import pickle

def create_synthetic_data(num_samples=5000):
    np.random.seed(42)

    blood_sugar = np.random.normal(loc=130, scale=25, size=num_samples)
    carb_intake = np.random.normal(loc=60, scale=15, size=num_samples)
    activity = np.random.randint(0, 60, size=num_samples)

    # Deterministic target
    risk_score = (blood_sugar * 0.006) + (carb_intake * 0.006) - (activity * 0.006)
    target = (risk_score > 1.0).astype(int)

    data = pd.DataFrame({
        'blood_sugar': blood_sugar,
        'carb_intake': carb_intake,
        'activity': activity,
        'target': target
    })

    # Feature Engineering
    data['bs_carb_interaction'] = data['blood_sugar'] * data['carb_intake']
    data['carb_per_activity'] = data['carb_intake'] / (data['activity'] + 1)
    data['bs_squared'] = data['blood_sugar'] ** 2
    data['activity_inverse'] = 1 / (data['activity'] + 1)

    return data

def train_and_save_model():
    print("--- Starting Model Training ---")
    df = create_synthetic_data(num_samples=5000)

    feature_columns = [
        'blood_sugar', 'carb_intake', 'activity', 
        'bs_carb_interaction', 'carb_per_activity', 'bs_squared', 'activity_inverse'
    ]
    X = df[feature_columns]
    y = df['target']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=500,
        max_depth=10,
        random_state=42
    )
    model.fit(X_train_scaled, y_train)

    score = model.score(X_test_scaled, y_test)
    print(f"Random Forest Accuracy: {score*100:.2f}%")

    with open('model.pkl', 'wb') as file:
        pickle.dump(model, file)
    with open('scaler.pkl', 'wb') as file:
        pickle.dump(scaler, file)

    sample_preds = model.predict(X_test_scaled[:5])
    print("Sample Predictions (first 5 test samples):", sample_preds)
    
    print("--- Training Complete ---")

if __name__ == "__main__":
    train_and_save_model()
