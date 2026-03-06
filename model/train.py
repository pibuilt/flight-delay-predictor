import os

from preprocess import load_data, basic_cleaning, create_target, select_features
from features import build_feature_pipeline

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report
from sklearn.ensemble import RandomForestClassifier


def main():

    root_dir = os.path.dirname(os.path.dirname(__file__))
    data_path = os.path.join(root_dir, "data", "flights.csv")

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

    clf = Pipeline(
        steps=[
            ("features", feature_pipeline),
            ("model", model)
        ]
    )

    print("Performing cross-validation...")

    cv_scores = cross_val_score(clf, X_train, y_train, cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42), scoring="f1", n_jobs=-1)

    print("Cross-validation scores:", cv_scores)
    print("Mean CV accuracy:", cv_scores.mean())

    print("Training Random Forest model...")

    clf.fit(X_train, y_train)

    print("Generating predictions...")

    predictions = clf.predict(X_test)

    print("Accuracy:", accuracy_score(y_test, predictions))

    print("\nClassification Report:")
    print(classification_report(y_test, predictions, zero_division=0))


if __name__ == "__main__":
    main()