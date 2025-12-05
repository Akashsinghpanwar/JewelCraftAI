# ---------- Frontend build ----------
FROM node:20-bullseye AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
COPY frontend/tsconfig.json frontend/next.config.ts frontend/eslint.config.mjs frontend/postcss.config.mjs ./
COPY frontend/app ./app
COPY frontend/public ./public

RUN npm ci
RUN npm run build


# ---------- Runtime ----------
FROM node:20-bullseye AS runtime
WORKDIR /app

# System deps for Python + OpenCV/rembg
RUN apt-get update && \
    apt-get install -y python3 python3-pip libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Backend deps
COPY backend/requirements.txt /app/backend/requirements.txt
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install -r /app/backend/requirements.txt rembg onnxruntime python-dotenv

# App source
COPY backend /app/backend
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/package*.json /app/frontend/

# Install only prod deps for Next runtime
WORKDIR /app/frontend
RUN npm ci --omit=dev

WORKDIR /app
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV PORT=3000 \
    BACKEND_PORT=8000 \
    HOST=0.0.0.0

EXPOSE 3000 8000
CMD ["/bin/bash", "/app/start.sh"]
