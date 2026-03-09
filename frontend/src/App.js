import React, { useState } from "react";
import axios from "axios";

// API_URL is intentionally empty string in production.
// Requests like `${API_URL}/predict` become same-origin calls (e.g. http://ec2-host:3000/predict),
// which nginx then proxies internally to the backend container.
// Set REACT_APP_API_URL at build time only when running locally against a separate backend.
const API_URL = process.env.REACT_APP_API_URL || "";

const AIRLINES = [
  "AA",
  "AS",
  "B6",
  "DL",
  "EV",
  "F9",
  "HA",
  "MQ",
  "NK",
  "OO",
  "UA",
  "US",
  "VX",
  "WN",
];

const AIRPORTS = [
  "ABE",
  "ABI",
  "ABQ",
  "ABR",
  "ABY",
  "ACK",
  "ACT",
  "ACV",
  "ACY",
  "ADK",
  "ADQ",
  "AEX",
  "AGS",
  "AKN",
  "ALB",
  "ALO",
  "AMA",
  "ANC",
  "APN",
  "ASE",
  "ATL",
  "ATW",
  "AUS",
  "AVL",
  "AVP",
  "AZO",
  "BDL",
  "BET",
  "BFL",
  "BGM",
  "BGR",
  "BHM",
  "BIL",
  "BIS",
  "BJI",
  "BLI",
  "BMI",
  "BNA",
  "BOI",
  "BOS",
  "BPT",
  "BQK",
  "BQN",
  "BRD",
  "BRO",
  "BRW",
  "BTM",
  "BTR",
  "BTV",
  "BUF",
  "BUR",
  "BWI",
  "BZN",
  "CAE",
  "CAK",
  "CDC",
  "CDV",
  "CEC",
  "CHA",
  "CHO",
  "CHS",
  "CID",
  "CIU",
  "CLD",
  "CLE",
  "CLL",
  "CLT",
  "CMH",
  "CMI",
  "CMX",
  "CNY",
  "COD",
  "COS",
  "COU",
  "CPR",
  "CRP",
  "CRW",
  "CSG",
  "CVG",
  "CWA",
  "DAB",
  "DAL",
  "DAY",
  "DBQ",
  "DCA",
  "DEN",
  "DFW",
  "DHN",
  "DIK",
  "DLG",
  "DLH",
  "DRO",
  "DSM",
  "DTW",
  "DVL",
  "EAU",
  "ECP",
  "EGE",
  "EKO",
  "ELM",
  "ELP",
  "ERI",
  "ESC",
  "EUG",
  "EVV",
  "EWN",
  "EWR",
  "EYW",
  "FAI",
  "FAR",
  "FAT",
  "FAY",
  "FCA",
  "FLG",
  "FLL",
  "FNT",
  "FSD",
  "FSM",
  "FWA",
  "GCC",
  "GCK",
  "GEG",
  "GFK",
  "GGG",
  "GJT",
  "GNV",
  "GPT",
  "GRB",
  "GRI",
  "GRK",
  "GRR",
  "GSO",
  "GSP",
  "GST",
  "GTF",
  "GTR",
  "GUC",
  "GUM",
  "HDN",
  "HIB",
  "HLN",
  "HNL",
  "HOB",
  "HOU",
  "HPN",
  "HRL",
  "HSV",
  "HYA",
  "HYS",
  "IAD",
  "IAG",
  "IAH",
  "ICT",
  "IDA",
  "ILG",
  "ILM",
  "IMT",
  "IND",
  "INL",
  "ISN",
  "ISP",
  "ITH",
  "ITO",
  "JAC",
  "JAN",
  "JAX",
  "JFK",
  "JLN",
  "JMS",
  "JNU",
  "KOA",
  "KTN",
  "LAN",
  "LAR",
  "LAS",
  "LAW",
  "LAX",
  "LBB",
  "LBE",
  "LCH",
  "LEX",
  "LFT",
  "LGA",
  "LGB",
  "LIH",
  "LIT",
  "LNK",
  "LRD",
  "LSE",
  "LWS",
  "MAF",
  "MBS",
  "MCI",
  "MCO",
  "MDT",
  "MDW",
  "MEI",
  "MEM",
  "MFE",
  "MFR",
  "MGM",
  "MHK",
  "MHT",
  "MIA",
  "MKE",
  "MKG",
  "MLB",
  "MLI",
  "MLU",
  "MMH",
  "MOB",
  "MOT",
  "MQT",
  "MRY",
  "MSN",
  "MSO",
  "MSP",
  "MSY",
  "MTJ",
  "MVY",
  "MYR",
  "OAJ",
  "OAK",
  "OGG",
  "OKC",
  "OMA",
  "OME",
  "ONT",
  "ORD",
  "ORF",
  "ORH",
  "OTH",
  "OTZ",
  "PAH",
  "PBG",
  "PBI",
  "PDX",
  "PHF",
  "PHL",
  "PHX",
  "PIA",
  "PIB",
  "PIH",
  "PIT",
  "PLN",
  "PNS",
  "PPG",
  "PSC",
  "PSE",
  "PSG",
  "PSP",
  "PUB",
  "PVD",
  "PWM",
  "RAP",
  "RDD",
  "RDM",
  "RDU",
  "RHI",
  "RIC",
  "RKS",
  "RNO",
  "ROA",
  "ROC",
  "ROW",
  "RST",
  "RSW",
  "SAF",
  "SAN",
  "SAT",
  "SAV",
  "SBA",
  "SBN",
  "SBP",
  "SCC",
  "SCE",
  "SDF",
  "SEA",
  "SFO",
  "SGF",
  "SGU",
  "SHV",
  "SIT",
  "SJC",
  "SJT",
  "SJU",
  "SLC",
  "SMF",
  "SMX",
  "SNA",
  "SPI",
  "SPS",
  "SRQ",
  "STC",
  "STL",
  "STT",
  "STX",
  "SUN",
  "SUX",
  "SWF",
  "SYR",
  "TLH",
  "TOL",
  "TPA",
  "TRI",
  "TTN",
  "TUL",
  "TUS",
  "TVC",
  "TWF",
  "TXK",
  "TYR",
  "TYS",
  "UST",
  "VEL",
  "VLD",
  "VPS",
  "WRG",
  "WYS",
  "XNA",
  "YAK",
  "YUM",
];

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

const selectClass =
  "border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white";

const SelectField = ({ label, name, options, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-600">{label}</label>
    <select
      name={name}
      onChange={onChange}
      defaultValue=""
      className={selectClass}
    >
      <option value="" disabled>
        Select...
      </option>
      {options.map((opt) =>
        typeof opt === "object" ? (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ) : (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ),
      )}
    </select>
  </div>
);

const InputField = ({ label, name, placeholder, type = "text", onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-600">{label}</label>
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    />
  </div>
);

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      ...formData,
      DEPARTURE_TIME: Number(formData.DEPARTURE_TIME),
      DISTANCE: Number(formData.DISTANCE),
      DAY_OF_WEEK: Number(formData.DAY_OF_WEEK),
    };

    try {
      const response = await axios.post(`${API_URL}/predict`, payload);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Prediction failed. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const delayed = result?.data?.prediction === 1;
  const probability = result
    ? (result.data.delay_probability * 100).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✈️</div>
          <h1 className="text-3xl font-bold text-gray-800">
            Flight Delay Predictor
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Enter flight details to predict delay probability
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Airline Code"
                name="AIRLINE"
                options={AIRLINES}
                onChange={handleChange}
              />
              <SelectField
                label="Day of Week"
                name="DAY_OF_WEEK"
                options={DAYS}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Origin Airport"
                name="ORIGIN_AIRPORT"
                options={AIRPORTS}
                onChange={handleChange}
              />
              <SelectField
                label="Destination Airport"
                name="DESTINATION_AIRPORT"
                options={AIRPORTS}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Departure Time"
                name="DEPARTURE_TIME"
                placeholder="e.g. 900"
                type="number"
                onChange={handleChange}
              />
              <InputField
                label="Distance (miles)"
                name="DISTANCE"
                placeholder="e.g. 2475"
                type="number"
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              {loading ? "Predicting..." : "Predict Delay or Not"}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="mt-4 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Prediction Result
            </h2>

            <div
              className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ${
                delayed
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {delayed ? "⚠️ Likely Delayed" : "✅ On Time"}
            </div>

            <p className="text-sm text-gray-500 mb-2">Delay Probability</p>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-1">
              <div
                className={`h-3 rounded-full transition-all ${
                  delayed ? "bg-red-500" : "bg-green-500"
                }`}
                style={{ width: `${probability}%` }}
              />
            </div>
            <p className="text-right text-sm font-medium text-gray-700">
              {probability}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
