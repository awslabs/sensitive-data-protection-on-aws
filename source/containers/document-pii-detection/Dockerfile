# temp stage
FROM python:3.12-slim-bullseye as builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++

# Install Python dependencies first
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# prod stage
FROM python:3.12-slim-bullseye

ARG FUNCTION_DIR="/opt/ml/code"

WORKDIR ${FUNCTION_DIR}

RUN apt-get update && apt-get install -y --no-install-recommends libmagic1 && rm -rf /var/lib/apt/lists/*

COPY ocr_model/ ${FUNCTION_DIR}/ocr_model/
COPY fd_model/ ${FUNCTION_DIR}/fd_model/
COPY --from=builder /app/wheels ${FUNCTION_DIR}/wheels
RUN pip install --no-cache ${FUNCTION_DIR}/wheels/*

COPY parsers/ ${FUNCTION_DIR}/parsers/
COPY requirements.txt main.py parser_factory.py ${FUNCTION_DIR}/


CMD ["python3", "main.py"]