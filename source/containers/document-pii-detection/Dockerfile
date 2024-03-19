# temp stage
FROM python:3.12-slim-bullseye as builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc g++

# Install Python dependencies first
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Download and copy models
#ARG OCR_MODEL_URL="https://aws-gcr-solutions-assets.s3.cn-northwest-1.amazonaws.com.cn/ai-solution-kit/infer-ocr-model/standard"
#ARG OCR_MODEL_VERSION="v1.0.0"
#ARG FD_MODEL_URL="https://aws-gcr-solutions-assets.s3.cn-northwest-1.amazonaws.com.cn/ai-solution-kit/face-detection"
#ARG FD_MODEL_VERSION="1.2.0"

#RUN mkdir -p ocr_model fd_model
#RUN wget -c $OCR_MODEL_URL/$OCR_MODEL_VERSION/classifier.onnx -O ./ocr_model/classifier.onnx
#RUN wget -c $OCR_MODEL_URL/$OCR_MODEL_VERSION/det_standard.onnx -O ./ocr_model/det_standard.onnx
#RUN wget -c $OCR_MODEL_URL/$OCR_MODEL_VERSION/keys_v1.txt -O ./ocr_model/keys_v1.txt
#RUN wget -c $OCR_MODEL_URL/$OCR_MODEL_VERSION/rec_standard.onnx -O ./ocr_model/rec_standard.onnx
#RUN wget -c ${FD_MODEL_URL}/${FD_MODEL_VERSION}/det.onnx -O ./fd_model/det.onnx

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