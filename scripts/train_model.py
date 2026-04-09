import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import joblib

def load_data():
    real_csv_path = os.path.join(os.path.dirname(__file__), 'data', 'ml_training_data.csv')
    synth_csv_path = os.path.join(os.path.dirname(__file__), 'data', 'synthetic_queue_history.csv')
    
    dfs = []
    
    if os.path.exists(real_csv_path):
        print(f"Loading real data from: {real_csv_path}")
        df_real = pd.read_csv(real_csv_path)
        dfs.append(df_real)
    else:
        print("Real data CSV not found. Proceeding with synthetic data only.")
        
    if os.path.exists(synth_csv_path):
        print(f"Loading synthetic data from: {synth_csv_path}")
        df_synth = pd.read_csv(synth_csv_path)
        dfs.append(df_synth)
    else:
        print("Synthetic data CSV not found.")
        
    if not dfs:
        raise ValueError("No data available to train the model!")
        
    # Combine datasets
    df_combined = pd.concat(dfs, ignore_index=True)
    return df_combined

def preprocess_data(df):
    # Encode categorical variables
    encoders = {}
    categorical_cols = ['branchId', 'departmentId', 'serviceType']
    
    for col in categorical_cols:
        le = LabelEncoder()
        # Convert to string to avoid mixed type issues
        df[col] = df[col].astype(str)
        df[col] = le.fit_transform(df[col])
        encoders[col] = le
        
    return df, encoders

def train_model():
    print("--- Starting ML Training Pipeline ---")
    
    # 1. Load Data
    df = load_data()
    print(f"Total Combined Rows: {len(df)}")
    
    # 2. Preprocess
    df, encoders = preprocess_data(df)
    
    # Features and Target - Note: availableStaffAtJoin was removed as it was a misleading branch-level signal.
    # peopleAheadAtJoin was updated to sameDepartmentPeopleAhead for full honesty.
    features = ['sameDepartmentPeopleAhead', 'hourOfDay', 'dayOfWeek', 'branchId', 'departmentId', 'serviceType']
    target = 'actualWaitMinutes'
    
    X = df[features]
    y = df[target]
    
    # 3. Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 4. Train RandomForestRegressor
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    # 5. Evaluate
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    print(f"\nModel Performance:")
    print(f"   => Mean Absolute Error (MAE): {mae:.2f} minutes")
    
    # Sample predictions
    print("\n   => Sample Predictions vs Actual:")
    sample = X_test.head(5).copy()
    sample['Predicted_Wait'] = predictions[:5]
    sample['Actual_Wait'] = y_test.head(5).values
    # Format the print
    for i, (idx, row) in enumerate(sample.iterrows()):
        print(f"      Row {i+1} | Predicted: {row['Predicted_Wait']:.1f} min | Actual: {row['Actual_Wait']:.1f} min | Diff: {abs(row['Predicted_Wait'] - row['Actual_Wait']):.1f} min")
    
    # 6. Save Model and Encoders
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'wait_time_model.joblib')
    encoders_path = os.path.join(model_dir, 'label_encoders.joblib')
    
    joblib.dump(model, model_path)
    joblib.dump(encoders, encoders_path)
    
    print(f"\nModel saved to: {model_path}")
    print(f"Encoders saved to: {encoders_path}")
    print("--- Pipeline Complete ---")

if __name__ == "__main__":
    train_model()
