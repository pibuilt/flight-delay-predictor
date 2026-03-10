import os
import json
import joblib

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import seaborn as sns

from preprocess import load_data, basic_cleaning, create_target, select_features
from features import build_feature_pipeline

from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_curve, roc_auc_score
from sklearn.ensemble import RandomForestClassifier


def main():

    root_dir = os.path.dirname(os.path.dirname(__file__))
    data_path = os.path.join(root_dir, "data", "flights.csv")

    reports_dir = os.path.join(root_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    df = load_data(data_path)
    print("Raw dataset shape:", df.shape)

    df = basic_cleaning(df)
    df = create_target(df)
    df = select_features(df)

    print("Processed dataset shape:", df.shape)

    print("Sampling dataset for faster experimentation...")

    sample_size = 200000

    df_sample = df.sample(n=sample_size, random_state=42)

    print("Sample dataset shape:", df_sample.shape)

    X = df_sample.drop("delayed", axis=1)
    y = df_sample["delayed"]

    print("Splitting dataset...")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print("Building feature pipeline...")

    feature_pipeline = build_feature_pipeline()

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )

    param_dist = {
    "model__n_estimators": [100, 200],
    "model__max_depth": [10, 15, 20],   
    "model__min_samples_split": [2, 5, 10],
    "model__min_samples_leaf": [1, 3, 5],
    "model__max_features": ["sqrt", "log2"]
    }

    clf = Pipeline(
        steps=[
            ("features", feature_pipeline),
            ("model", model)
        ]
    )

    print("Running hyperparameter tuning...")

    randomized_search = RandomizedSearchCV(
        clf,
        param_distributions=param_dist,
        n_iter=17,
        cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=42),
        verbose=2,
        scoring="f1",
        n_jobs=-1,
        random_state=42
    )

    randomized_search.fit(X_train, y_train)

    print("Best parameters:", randomized_search.best_params_)
    print("Best cross-validation score:", randomized_search.best_score_)

    best_model = randomized_search.best_estimator_

    print("Generating predictions...")

    predictions = best_model.predict(X_test)
    probabilities = best_model.predict_proba(X_test)[:, 1]

    print("Accuracy:", accuracy_score(y_test, predictions))

    print("\nClassification Report:")
    print(classification_report(y_test, predictions, zero_division=0))

    cm = confusion_matrix(y_test, predictions)

    plt.figure(figsize=(6,4))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
    plt.title("Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")

    confusion_path = os.path.join(reports_dir, "confusion_matrix.png")
    plt.savefig(confusion_path)
    plt.close()

    fpr, tpr, _ = roc_curve(y_test, probabilities)
    roc_auc = roc_auc_score(y_test, probabilities)

    plt.figure(figsize=(6,4))
    plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.3f}")
    plt.plot([0,1], [0,1], linestyle="--")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve")
    plt.legend()

    roc_path = os.path.join(reports_dir, "roc_curve.png")
    plt.savefig(roc_path)
    plt.close()

    model = best_model.named_steps["model"]
    importances = model.feature_importances_
    feature_names = best_model.named_steps["features"].get_feature_names_out()

    indices = importances.argsort()[::-1]
    top_n = min(20, len(indices))

    plt.figure(figsize=(10, 8))
    plt.barh(range(top_n), importances[indices[:top_n]][::-1])
    plt.yticks(range(top_n), [feature_names[i] for i in indices[:top_n]][::-1])
    plt.xlabel("Importance")
    plt.title("Top Feature Importances")
    plt.tight_layout()

    fi_path = os.path.join(reports_dir, "feature_importance.png")
    plt.savefig(fi_path)
    plt.close()

    metrics = {
    "accuracy": float(accuracy_score(y_test, predictions)),
    "roc_auc": float(roc_auc),
    "best_params": randomized_search.best_params_
}

    metrics_path = os.path.join(reports_dir, "metrics.json")

    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)

    models_dir = os.path.join(root_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, "flight_delay_model.joblib")

    joblib.dump(best_model, model_path)

    print("Model saved to:", model_path)

if __name__ == "__main__":
    main()