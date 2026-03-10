# Flight Delay Predictor

A production-grade ML system that predicts whether a flight will be delayed by more than 15 minutes. Built with a React frontend, FastAPI backend, scikit-learn Random Forest model, Docker Compose orchestration, and deployed to AWS EC2 with full HTTPS and an automated CI/CD pipeline.

**Live:** Deployed on AWS EC2 with HTTPS via Let's Encrypt.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [ML Model](#ml-model)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [HTTPS & SSL Certificates](#https--ssl-certificates)
- [CI/CD Pipeline](#cicd-pipeline)
- [Running After a Fresh Pull on the Server](#running-after-a-fresh-pull-on-the-server)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
User's Browser
      │
      │  HTTPS (port 443) / HTTP redirect (port 80)
      ▼
┌─────────────────────────────────────────────┐
│           AWS EC2 (t2.micro)                │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │     Docker Compose Network           │   │
│  │                                      │   │
│  │  ┌─────────────────────────────┐     │   │
│  │  │   frontend container        │     │   │
│  │  │   nginx:alpine              │     │   │
│  │  │                             │     │   │
│  │  │  • Serves React SPA         │     │   │
│  │  │  • Terminates TLS (443)     │     │   │
│  │  │  • HTTP → HTTPS redirect    │     │   │
│  │  │  • Proxies /predict &       │     │   │
│  │  │    /health → backend:8000   │     │   │
│  │  └────────────┬────────────────┘     │   │
│  │               │ Docker internal DNS  │   │
│  │               │ http://backend:8000  │   │
│  │  ┌────────────▼────────────────┐     │   │
│  │  │   backend container         │     │   │
│  │  │   python:3.11-slim          │     │   │
│  │  │                             │     │   │
│  │  │  • FastAPI + uvicorn        │     │   │
│  │  │  • Loads .joblib ML model   │     │   │
│  │  │  • No public port exposed   │     │   │
│  │  └─────────────────────────────┘     │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  /etc/letsencrypt/  (cert volume, read-only)│
│  /var/www/certbot/  (ACME webroot)          │
└─────────────────────────────────────────────┘
```

**Key design decisions:**

- The backend has **no public port mapping** — it is only reachable from inside the Docker network. All browser traffic goes through nginx.
- `REACT_APP_API_URL` is an empty string in production. Calls to `/predict` are same-origin, which nginx intercepts and proxies internally. This avoids any IP/port hardcoding in the React bundle.
- CORS is `allow_origins=["*"]` — safe because the backend is not publicly accessible.

---

## Tech Stack

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| Frontend         | React 18, Tailwind CSS, Axios                |
| Backend          | FastAPI, Uvicorn, Pydantic                   |
| ML               | scikit-learn (Random Forest), pandas, joblib |
| Reverse Proxy    | nginx (alpine)                               |
| Containerisation | Docker, Docker Compose v3.9                  |
| CI/CD            | GitHub Actions                               |
| Cloud            | AWS EC2 t2.micro (free tier)                 |
| HTTPS            | Let's Encrypt (certbot)                      |

---

## Project Structure

```
flight-delay-predictor/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI: runs tests + builds Docker images
│       └── deploy.yml      # CD: deploys to EC2 after CI passes
│
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py                     # FastAPI app, CORS, routes
│       ├── models/
│       │   └── flight.py               # Pydantic request schema
│       └── services/
│           └── prediction_service.py   # Loads model, runs inference
│
├── frontend/
│   ├── nginx.conf          # nginx: HTTPS, HTTP redirect, API proxy
│   ├── package.json
│   └── src/
│       └── App.js          # React SPA — form, axios calls, result display
│
├── model/                  # Model training scripts (run locally/offline)
│   ├── preprocess.py       # Data loading, cleaning, target creation
│   ├── features.py         # sklearn ColumnTransformer pipeline
│   └── train.py            # RandomForest + RandomizedSearchCV training
│
├── models/
│   └── flight_delay_model.joblib   # Trained model artifact (committed)
│
├── data/
│   └── flights.csv         # Raw dataset (2015 US domestic flights)
│
├── reports/
│   └── metrics.json        # Training metrics (accuracy, ROC-AUC, best params)
│
├── Dockerfile.backend      # Multi-stage: dependency install + runtime
├── Dockerfile.frontend     # Multi-stage: React build + nginx serve
└── docker-compose.yml      # Orchestrates both containers + volumes
```

---

## ML Model

### Dataset

2015 US domestic flight data. Binary target: flight is **delayed** if `ARRIVAL_DELAY > 15 minutes`.

### Features used

| Feature               | Type        | Description                             |
| --------------------- | ----------- | --------------------------------------- |
| `AIRLINE`             | Categorical | Airline code (AA, DL, UA, etc.)         |
| `ORIGIN_AIRPORT`      | Categorical | Departure airport IATA code             |
| `DESTINATION_AIRPORT` | Categorical | Arrival airport IATA code               |
| `DEPARTURE_TIME`      | Numerical   | Scheduled departure time (HHMM integer) |
| `DISTANCE`            | Numerical   | Flight distance in miles                |
| `DAY_OF_WEEK`         | Numerical   | 1 = Monday … 7 = Sunday                 |

### Pipeline

1. **Preprocessing** — categorical features → `OneHotEncoder(handle_unknown='ignore')`; numerical features → `StandardScaler`
2. **Model** — `RandomForestClassifier` with `class_weight='balanced'`
3. **Tuning** — `RandomizedSearchCV` over `n_estimators`, `max_depth`, `min_samples_split`, `min_samples_leaf`, `max_features`
4. **Sample** — 200,000 rows sampled from the full dataset for training speed

### Performance

| Metric   | Value |
| -------- | ----- |
| Accuracy | 61.5% |
| ROC-AUC  | 0.675 |

Best params: `n_estimators=200`, `max_depth=20`, `max_features=sqrt`, `min_samples_leaf=1`, `min_samples_split=10`

### Retraining the model

```bash
cd model
python train.py
```

The trained artifact is saved to `models/flight_delay_model.joblib`. Commit the updated `.joblib` file to redeploy with the new model.

---

## Local Development

### Prerequisites

- Docker and Docker Compose installed
- Python 3.11 (for running tests or model training outside Docker)

### Option A — Docker Compose (recommended)

The production `docker-compose.yml` requires SSL certs and ports 80/443 — it won't work locally. Use `docker-compose.local.yml` instead, which is HTTP-only and runs on `localhost:3000`.

```bash
# Clone the repo
git clone https://github.com/pibuilt/flight-delay-predictor.git
cd flight-delay-predictor

# Build and start both containers using the local config
docker-compose -f docker-compose.local.yml up --build

# App available at http://localhost:3000
# Backend API at http://localhost:3000/health
```

This uses `frontend/nginx.local.conf` (HTTP-only, no SSL) mounted over the production nginx config at runtime — so no certs are needed and no changes to any source files are required. The nginx proxy to the backend works identically to production.

### Option B — Run services separately (for backend development)

```bash
# Terminal 1: Backend
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
REACT_APP_API_URL=http://localhost:8000 npm start
```

### Running tests

```bash
pip install -r backend/requirements.txt
pytest backend/tests
```

Tests cover:

- `GET /health` returns `{"status": "healthy"}`
- `POST /predict` with valid input returns prediction + probability
- `POST /predict` with missing fields returns HTTP 422

---

## Production Deployment

The production environment runs on a single AWS EC2 t2.micro instance (free tier).

### Infrastructure requirements

| Resource               | Detail                                                      |
| ---------------------- | ----------------------------------------------------------- |
| EC2 instance           | Ubuntu, t2.micro                                            |
| Security Group inbound | Port 22 (SSH), Port 80 (HTTP), Port 443 (HTTPS)             |
| Disk                   | 8GB (Docker prune runs on every deploy to prevent fill-up)  |
| Domain                 | Any domain (or free subdomain) pointed at the EC2 public IP |

### First-time server setup

```bash
# 1. Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# 2. Enable Docker to start on reboot
sudo systemctl enable docker

# 3. Clone the repository
git clone https://github.com/pibuilt/flight-delay-predictor.git
cd flight-delay-predictor

# 4. Obtain the SSL certificate (see HTTPS section below)

# 5. Start the stack
sudo docker-compose up -d --build
```

### GitHub Actions secrets required

Go to **GitHub repo → Settings → Secrets and variables → Actions** and add:

| Secret        | Value                                         |
| ------------- | --------------------------------------------- |
| `EC2_HOST`    | Your EC2 public IP address                    |
| `EC2_USER`    | `ubuntu`                                      |
| `EC2_SSH_KEY` | Full contents of your `.pem` private key file |

> **Important:** If your EC2 instance is stopped and restarted, AWS assigns a new public IP (unless you use an Elastic IP). Update `EC2_HOST` whenever the IP changes.

---

## HTTPS & SSL Certificates

### How it works

```
Browser → https://your-domain.com
               │
               ▼ port 443
           nginx (frontend container)
               │
               │  reads cert files from volume mount:
               │  /etc/letsencrypt/live/app/fullchain.pem
               │  /etc/letsencrypt/live/app/privkey.pem
               │
               ▼ terminates TLS, proxies API calls internally
           backend container (http://backend:8000)
```

The cert files live on the **EC2 host** at `/etc/letsencrypt/` and are mounted read-only into the frontend container via `docker-compose.yml`. nginx uses them to terminate TLS. The container never writes to the cert directory.

### Obtaining the cert (first time only)

This must be done **before** running the full Docker stack on ports 80/443, because certbot needs port 80 free for the standalone challenge.

```bash
# Install certbot
sudo apt install -y certbot

# Obtain cert (standalone mode — port 80 must be free)
sudo certbot certonly --standalone \
  --preferred-challenges http \
  -d your-domain.com \
  --cert-name app

# Cert is saved at:
# /etc/letsencrypt/live/app/fullchain.pem
# /etc/letsencrypt/live/app/privkey.pem
```

If the stack is already running on port 80, bring it down first:

```bash
sudo docker-compose down
sudo certbot certonly --standalone -d your-domain.com --cert-name app
sudo docker-compose up -d
```

### Automatic cert renewal

Let's Encrypt certs expire every **90 days**. Two mechanisms handle renewal automatically:

**1. systemd timer (built into certbot)**

Certbot installs a systemd timer (`certbot.timer`) that runs `certbot renew` twice daily. You can verify it is active:

```bash
sudo systemctl status certbot.timer
```

**2. Deploy hook — nginx reload after renewal**

When certbot renews the cert, nginx must reload to pick up the new files. The deploy script installs a hook on every CD run:

```bash
# Written to: /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
#!/bin/bash
docker exec flight-delay-frontend nginx -s reload
```

This hook runs automatically after every successful renewal. You can verify it exists:

```bash
cat /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

**To test renewal manually** (dry run, no actual cert change):

```bash
sudo certbot renew --dry-run
```

### nginx configuration overview

```nginx
# HTTP server — two purposes:
# 1. Serve ACME webroot challenges for certbot renewal (no downtime needed)
# 2. Redirect all other HTTP traffic to HTTPS
server {
    listen 80;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

# HTTPS server — main app
server {
    listen 443 ssl;
    ssl_certificate     /etc/letsencrypt/live/app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # Serve React SPA — unknown paths fall back to index.html
    location / { try_files $uri /index.html; }

    # Proxy API calls to the backend container over Docker internal network
    location ~ ^/(predict|health) {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

> **Why ACME webroot for renewal?** After the initial cert is obtained, renewals use the webroot method rather than standalone. This means certbot writes a challenge file to `/var/www/certbot/` (mounted into the container) and nginx serves it over HTTP — so the containers **do not need to stop** for renewal.

---

## CI/CD Pipeline

```
git push → main
    │
    ▼
┌─────────────────────────────────────┐
│         CI Pipeline                 │
│  (ci.yml — runs on every push/PR)   │
│                                     │
│  1. Checkout repo                   │
│  2. Install Python deps             │
│  3. Run pytest (backend/tests)      │
│  4. Build backend Docker image      │
│  5. Build frontend Docker image     │
└──────────────┬──────────────────────┘
               │ on success
               ▼
┌─────────────────────────────────────┐
│         Deploy to EC2               │
│  (deploy.yml — triggered via        │
│   workflow_run after CI passes)     │
│                                     │
│  1. SSH into EC2                    │
│  2. git pull origin main            │
│  3. docker-compose down             │
│  4. docker system prune -af         │  ← prevents disk fill-up
│  5. docker-compose build --no-cache │
│  6. docker-compose up -d            │
│  7. Install certbot reload hook     │  ← idempotent, safe to repeat
└─────────────────────────────────────┘
```

**Important:** The deploy workflow only runs if CI conclusion is `success`. A failing test **blocks** deployment automatically.

The `docker system prune -af --volumes` step removes all unused images, containers, and build cache before each rebuild. On the 8GB EC2 disk this is essential — Docker build cache fills up quickly without it.

---

## Running After a Fresh Pull on the Server

If you SSH into the EC2 and want to update manually (without waiting for CI/CD), or if you've just cloned the repo to a fresh server:

```bash
cd ~/flight-delay-predictor

# Pull latest changes
git pull origin main

# Tear down running containers
sudo docker-compose down

# Remove all Docker cache (prevents disk from filling up)
sudo docker system prune -af --volumes

# Rebuild images from scratch and start in background
sudo docker-compose build --no-cache
sudo docker-compose up -d

# Verify both containers are running
sudo docker ps

# Check logs
sudo docker logs flight-delay-backend
sudo docker logs flight-delay-frontend
```

> **Note:** `--no-cache` ensures the build always uses the freshly pulled code, not a cached layer from a previous state.

If you are setting up a **brand new server** from scratch, obtain the SSL cert first (see [HTTPS section](#https--ssl-certificates)) before running `docker-compose up`, otherwise nginx will fail to start because the cert files won't exist at the volume mount paths.

### Auto-restart on EC2 reboot

Both containers have `restart: unless-stopped` in `docker-compose.yml`. Docker itself is enabled as a systemd service (`sudo systemctl enable docker`). This means:

- EC2 reboots → Docker starts → Containers start → App is live

No manual intervention needed after a reboot.

---

## API Reference

### `GET /health`

Health check endpoint. Used by nginx and monitoring.

**Response:**

```json
{ "status": "healthy" }
```

### `POST /predict`

Run a flight delay prediction.

**Request body:**

```json
{
  "AIRLINE": "AA",
  "ORIGIN_AIRPORT": "JFK",
  "DESTINATION_AIRPORT": "LAX",
  "DEPARTURE_TIME": 900,
  "DISTANCE": 2475,
  "DAY_OF_WEEK": 3
}
```

| Field                 | Type    | Description                                      |
| --------------------- | ------- | ------------------------------------------------ |
| `AIRLINE`             | string  | IATA airline code                                |
| `ORIGIN_AIRPORT`      | string  | Departure airport IATA code                      |
| `DESTINATION_AIRPORT` | string  | Arrival airport IATA code                        |
| `DEPARTURE_TIME`      | integer | Scheduled departure (HHMM, e.g. `900` = 9:00 AM) |
| `DISTANCE`            | integer | Distance in miles                                |
| `DAY_OF_WEEK`         | integer | 1 (Monday) to 7 (Sunday)                         |

**Response:**

```json
{
  "success": true,
  "data": {
    "prediction": 1,
    "delay_probability": 0.63
  }
}
```

`prediction`: `1` = delayed, `0` = on time  
`delay_probability`: probability of delay (0.0 – 1.0)

---

## Troubleshooting

### App not loading after deploy

```bash
sudo docker ps               # Are both containers Up?
sudo docker logs flight-delay-frontend   # nginx errors?
sudo docker logs flight-delay-backend    # Python/model errors?
```

### curl http://localhost/health returns 404

nginx is running but the proxy config is missing. Verify the nginx config was copied into the image:

```bash
sudo docker exec flight-delay-frontend cat /etc/nginx/conf.d/default.conf
```

If empty or default, rebuild the frontend image — the `Dockerfile.frontend` `COPY frontend/nginx.conf` step may have failed silently on a cached layer. Run with `--no-cache`.

### SSH timeout in GitHub Actions (`dial tcp: i/o timeout`)

EC2 was likely stopped and restarted, giving it a new public IP. Update the `EC2_HOST` secret in GitHub → Settings → Secrets with the new IP. Allocate an Elastic IP in AWS to make the IP permanent.

### Disk full on EC2

```bash
df -h                                  # Check usage
sudo docker system prune -af --volumes # Remove all Docker cache
```

The CI/CD deploy script runs prune automatically on every deploy, but if you've been building manually it can fill up.

### SSL cert not found / nginx fails to start

```bash
ls /etc/letsencrypt/live/app/   # fullchain.pem and privkey.pem must exist
```

If missing, obtain the cert (see [HTTPS section](#https--ssl-certificates)). Bring containers down first so port 80 is free for the standalone challenge.

### Cert renewal not reloading nginx

Verify the deploy hook exists and is executable:

```bash
cat /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
ls -la /etc/letsencrypt/renewal-hooks/deploy/
```

If missing, re-run the deploy script or create it manually:

```bash
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
printf '#!/bin/bash\ndocker exec flight-delay-frontend nginx -s reload\n' \
  | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh > /dev/null
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```
