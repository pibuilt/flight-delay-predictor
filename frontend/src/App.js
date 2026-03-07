import React, { useState } from "react";
import axios from "axios";

function App() {
  const [formData, setFormData] = useState({
    AIRLINE: "",
    ORIGIN_AIRPORT: "",
    DESTINATION_AIRPORT: "",
    DEPARTURE_TIME: "",
    DISTANCE: "",
    DAY_OF_WEEK: "",
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      DEPARTURE_TIME: Number(formData.DEPARTURE_TIME),
      DISTANCE: Number(formData.DISTANCE),
      DAY_OF_WEEK: Number(formData.DAY_OF_WEEK),
    };

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/predict",
        payload,
      );

      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert("Prediction failed");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Flight Delay Predictor</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="AIRLINE"
          placeholder="Airline (AA)"
          onChange={handleChange}
        />

        <br />
        <br />

        <input
          name="ORIGIN_AIRPORT"
          placeholder="Origin Airport (JFK)"
          onChange={handleChange}
        />

        <br />
        <br />

        <input
          name="DESTINATION_AIRPORT"
          placeholder="Destination Airport (LAX)"
          onChange={handleChange}
        />

        <br />
        <br />

        <input
          name="DEPARTURE_TIME"
          placeholder="Departure Time"
          onChange={handleChange}
        />

        <br />
        <br />

        <input name="DISTANCE" placeholder="Distance" onChange={handleChange} />

        <br />
        <br />

        <input
          name="DAY_OF_WEEK"
          placeholder="Day of Week (1-7)"
          onChange={handleChange}
        />

        <br />
        <br />

        <button type="submit">Predict Delay</button>
      </form>

      {result && (
        <div style={{ marginTop: "30px" }}>
          <h2>Prediction Result</h2>

          <p>Delayed: {result.data.prediction === 1 ? "Yes" : "No"}</p>

          <p>
            Delay Probability:{" "}
            {(result.data.delay_probability * 100).toFixed(2)}%
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
