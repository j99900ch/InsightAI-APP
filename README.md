  <div align="center">

# ⚡ InsightAI Enterprise
### Dual-Frontend GenAI Intelligence & Deep Neural Forecasting Platform
*End-to-End Self-Supervised Sequence Learning, Distributed Big Data Ingestion, and High-Throughput Inference Engine*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.4+-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![vLLM](https://img.shields.io/badge/vLLM-PagedAttention-00BF8C?style=for-the-badge)](https://vllm.ai/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Cloud_Native-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <a href="#-executive-summary">Executive Summary</a> •
  <a href="#-dual-frontend-system-architecture">Architecture</a> •
  <a href="#-technical-stack--foundations">Tech Stack</a> •
  <a href="#-core-capabilities--deep-dive">Key Capabilities</a> •
  <a href="#-mathematical--statistical-rigor">Mathematical Rigor</a> •
  <a href="#-local-installation--quickstart">Installation</a> •
  <a href="#-dockerization--container-deployment">Dockerization</a> •
  <a href="#-cloud-deployment--decoupled-mobile-pwa">Cloud & Mobile</a>
</p>

---

</div>

## 📌 Executive Summary

**InsightAI** is an enterprise-grade artificial intelligence and analytics platform engineered to bridge exploratory data analysis with high-throughput neural inference. Designed around a **modular Dual-Frontend architecture**, the system decouples broad exploratory intelligence from specialized deep-learning forecasting pipelines:

1. **Frontend 1 (Analytics & Business Intelligence Studio)**: Interactive AutoML suite delivering automated Exploratory Data Analysis (EDA), missing value imputation, regression/classification suites, voice-driven querying, and conversational GenAI dataset copilot agents.
2. **Frontend 2 (Deep Forecaster & Neural Training Lab)**: An unsupervised sequence-learning engine equipped with dedicated container storage (`/container_storage`). Ingests unlabelled big data in JSON, Excel, or CSV formats, trains autoregressive transformer/state-space architectures, and produces forward-looking probabilistic projections equipped with live vLLM-inspired telemetry.

---

## 🏗️ Dual-Frontend System Architecture
┌────────────────────────────────────────────────────────┐
                              │               InsightAI Client Gateway                 │
                              │      (Progressive Web App • Standalone Desktop / Mobile)│
                              └───────────────┬────────────────────────┬───────────────┘
                                              │ Toggle Interface Mode  │
                    ┌─────────────────────────┴────────┐     ┌─────────┴────────────────────────┐
                    ▼                                  ▼     ▼                                  ▼
  ┌───────────────────────────────────┐                     ┌───────────────────────────────────┐
  │            FRONTEND 1             │                     │            FRONTEND 2             │
  │   Business Intelligence & AutoML  │                     │   Deep Neural Training & Future   │
  │   - Interactive EDA & Cleaning    │                     │          Forecasting Lab          │
  │   - Hypothesis Testing & Stats    │                     │   - Unlabelled Document Ingestion │
  │   - GenAI Conversational Copilot  │                     │   - PatchTST, Bi-LSTM, Mamba-SSM  │
  │   - SQL & CSV Data Export Center  │                     │   - Bayesian Cones (80% / 95%)    │
  └─────────────────┬─────────────────┘                     └─────────────────┬─────────────────┘
                    │                                                         │
                    └─────────────────────────┬───────────────────────────────┘
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │             Full-Stack Express & Vite Server            │
                    │                 Node.js / TypeScript Core               │
                    └───────┬────────────────────────┬────────────────┬───────┘
                            │                        │                │
                            ▼                        ▼                ▼
    ┌───────────────────────────────┐ ┌─────────────────────────┐ ┌───────────────────────────┐
    │       Container Storage       │ │    Model Training Hub   │ │   vLLM Telemetry Engine   │
    │    Volume-Backed Storage:     │ │ PyTorch PatchTST / RoPE │ │  - KV Cache Profiling     │
    │      `/container_storage`     │ │ Mamba-S4 / PySpark ETL  │ │  - Latency (p95, p99)     │
    │  Unlabelled JSON / XLSX / CSV │ │ Multi-Horizon Projections││  - Throughput (tokens/sec)│
    └───────────────────────────────┘ └─────────────────────────┘ └───────────────────────────┘
    ---

## 💻 Technical Stack & Foundations

### **Core Languages & Runtimes**
* **Python 3.11+**: Primary modeling runtime, PyTorch tensor graph construction, SciPy statistical hypothesis validation, and PySpark distributed ETL scripts.
* **TypeScript 5.5+ & Node.js 20+**: Enterprise server-side APIs, memory-efficient streams, filesystem volume bindings, and type-safe frontends.
* **SQL & HiveQL**: Windowed moving-average calculations, time-bucketed partition pruning, and schema-on-read pipelines.

### **Deep Learning & Inference Infrastructure**
* **PyTorch 2.4**: Transformer encoder-decoder blocks, FlashAttention-2 integration, Rotary Positional Embeddings (RoPE), and highway residual connections.
* **vLLM-Inspired Serving Engine**: PagedAttention memory virtualization, KV-cache reutilization, and continuous request batching.
* **Quantization Frameworks**: Multi-precision execution comparing FP16, BF16, INT8 (SmoothQuant), and FP8 throughput benchmarks.

### **Big Data & Cloud MLOps**
* **Apache Spark / PySpark**: Windowed feature engineering across distributed datasets (`rolling_mean`, `rolling_std`, rolling Z-scores).
* **Docker & Kubernetes (K8s)**: OCI container definitions, horizontal pod autoscalers (HPA), and NVIDIA GPU operator limit manifests.
* **Google Cloud Platform (Cloud Run)**: Low-latency container execution behind managed load balancing.

---

## 🔬 Core Capabilities & Deep Dive

### 1. Unlabelled Document Ingestion & Container Storage
* **Universal Parser**: Accepts arbitrary, unlabelled documents in **JSON, Excel (`.xlsx`, `.xls`), and CSV** regardless of nested structures or proprietary schemas.
* **Persistent Container Storage**: Automatically writes raw payloads to the server's volume-backed directory (`/container_storage`), computing cryptographic SHA-256 integrity checksums.
* **Zero-Label Auto-Discovery**: Identifies continuous numerical signals, evaluates sequential cadence, and normalizes inputs for autoregressive self-supervised training.

### 2. High-Performance Model Architectures
* **Temporal Transformer (PatchTST)**: Extracts sequential patches into latent tokens, preserving temporal locality while reducing self-attention computational complexity from $\mathcal{O}(L^2)$ to $\mathcal{O}((L/P)^2)$.
* **Deep Residual Bi-LSTM / GRU**: Multi-layer recurrent network utilizing temporal skip connections to eliminate vanishing gradient decay across long context windows.
* **Selective State Space (Mamba-S4)**: Linear-time $\mathcal{O}(L)$ continuous context compression suited for high-frequency time series.
* **Hybrid Neural Ensemble**: Variance-weighted blending of transformer and state-space signals.

### 3. Dedicated Future Forecasting Studio
* **Multi-Horizon Projections**: Produces dedicated forward projections from step $T+1$ through $T+365$ without retroactive curve fitting.
* **Dual Bayesian Confidence Cones**: Dynamic interval bands at $80\%$ and $95\%$ confidence based on cumulative error variance propagation:
  $$\sigma_{T+h} = \sigma_0 \cdot \sqrt{h} \cdot \left(1 + \frac{\gamma \cdot h}{K}\right)$$
* **Scenario Stress Testing**: Simulates dynamic scenarios including Optimistic (+12%), Downside (-15%), and Structural Disruption / Shock & Recovery models.
* **Monte Carlo Probability Engine**: Generates 50+ path trajectories calculating tail-risk percentiles.

---

## 📐 Mathematical & Statistical Rigor

InsightAI applies classical statistical hypothesis testing to prevent overfitted projections:

| Test / Diagnostic | Methodology | Mathematical Formulation | Objective |
| :--- | :--- | :--- | :--- |
| **Paired Student’s t-Test** | Residual evaluation | $t = \frac{\bar{d} - 0}{s_d / \sqrt{n}}$ | Proves error distribution departs from zero with statistical significance ($p < 0.05$). |
| **Chi-Square ($\chi^2$) Test** | Directional sign independence | $\chi^2 = \sum \frac{(O_i - E_i)^2}{E_i}$ | Validates forecast directionality against random coin-flip drift. |
| **Kolmogorov-Smirnov (K-S)** | Normality distribution check | $D = \sup_x \|F_n(x) - F_0(x)\|$ | Verifies that inference error residuals obey Gaussian assumptions. |
| **Coefficient of Determination** | Goodness-of-fit validation | $R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$ | Quantifies variance explained across cross-validation splits. |

---

## 🚀 Local Installation & Quickstart

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **Python**: v3.10+ (optional for native PyTorch scripts)

### 1. Clone Repository & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/insightai-analytics-platform.git
cd insightai-analytics-platform

# Install frontend and backend npm packages
npm install

2. Environment Configuration
Create a .env file in the project root:
code- cp .env.example .env

Populate optional API keys:
code-
Env
# Optional: Required only for GenAI Conversational Copilot features*
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000

3. Run Development Server
code
Bash
npm run dev
Navigate to http://localhost:3000 to interact with the application.
🐳 Dockerization & Container Deployment
InsightAI includes container configurations suitable for microservice architectures.

1. Build the Production Container
code
Bash
docker build -t insightai:latest .

2. Run Container with Persistent Storage Volume
Mount a local host directory to /container_storage to ensure uploaded unlabelled datasets and neural checkpoints persist across container restarts:
code
Bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/container_storage:/app/container_storage \
  -e GEMINI_API_KEY="your_api_key_if_applicable" \
  --name insightai-core \
  insightai:latest

3. Verify Container Status
code
Bash
docker ps
docker logs -f insightai-core
☁️ Cloud Deployment & Decoupled Mobile PWA
Option A: Serverless Deployment via Google Cloud Run
Deploy the container directly to Cloud Run:
code
Bash
# Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build & Submit Image to Google Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/insightai:latest

# Deploy to Cloud Run with Port 3000
gcloud run deploy insightai-service \
  --image gcr.io/YOUR_PROJECT_ID/insightai:latest \
  --platform managed \
  --region us-central1 \
  --port 3000 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2

Option B: Decoupled Mobile Access (PWA)
Because InsightAI is built as a responsive Progressive Web App with dedicated service workers:
1.Open your production Cloud Run URL (https://your-service-url.run.app) on your mobile browser (iOS Safari / Android Chrome).
2.iOS: Tap the Share button 
 Select "Add to Home Screen".
3.Android: Tap the Menu (⋮) 
 Select "Install App" or "Add to Home Screen".
4.Result: InsightAI installs as a standalone, full-screen native mobile application that communicates with your cloud backend container.

🖥️ Standalone Desktop Installation (PC / macOS / Linux)
To install InsightAI as a standalone desktop application on Windows, macOS, or Linux:
1.Navigate to the deployed instance in Google Chrome, Microsoft Edge, or Brave.
2.Click the Install App icon (⊕ or 💻) on the right side of the address bar, or click the "Install to PC" button in the app header.
3.Confirm installation. The application will launch in an independent, hardware-accelerated window, creating dedicated desktop and taskbar shortcuts.
