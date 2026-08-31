# Multi-stage Dockerfile for FastAPI Backend (GeM Bid Compliance Platform)
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required for OCR (Tesseract) and PDF processing (Poppler)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    libmagic1 \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definition and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose Uvicorn API port
EXPOSE 8000

# Run FastAPI backend using Uvicorn server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
