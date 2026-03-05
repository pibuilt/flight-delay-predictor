import os

from preprocess import load_data, basic_cleaning, create_target, select_features
from features import build_feature_pipeline

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report

def main():

    # Get project root
    root_dir = os.path.dirname(os.path.dirname(__file__))
    data_path = os.path.join(root_dir, "data", "flights.csv")

    df = load_data(data_path)

    print("Raw dataset shape:", df.shape)

    df = basic_cleaning(df)
    df = create_target(df)
    df = select_features(df)

    print("Processed dataset shape:", df.shape)

    X = df.drop("delayed", axis=1)
    y = df["delayed"]

    print("Splitting dataset...")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print("Building training pipeline...")

    feature_pipeline = build_feature_pipeline()

    model = LogisticRegression(max_iter=100)

    clf = Pipeline(
        steps=[
            ("features", feature_pipeline),
            ("model", model)
        ]
    )

    print("Training Logistic Regression baseline...")

    clf.fit(X_train, y_train)

    print("Generating predictions...")

    predictions = clf.predict(X_test)

    print("Accuracy:", accuracy_score(y_test, predictions))

    print("\nClassification Report:")
    print(classification_report(y_test, predictions))

if __name__ == "__main__":
    main()