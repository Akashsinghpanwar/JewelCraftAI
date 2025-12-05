# ---------- Frontend build ----------
FROM node:20-bookworm AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
COPY frontend/tsconfig.json frontend/next.config.ts frontend/eslint.config.mjs frontend/postcss.config.mjs ./
COPY frontend/app ./app
COPY frontend/public ./public

RUN npm ci
RUN npm run build


# ---------- Runtime ----------
FROM node:20-bookworm AS runtime
WORKDIR /app

# System deps for Python + OpenCV/rembg (Python 3.11 from bookworm)
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv python3-dev libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# Isolated virtualenv for backend Python deps to avoid Debian's externally-managed protections
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
RUN python3 -m venv "$VIRTUAL_ENV" && \
    python -m pip install --upgrade pip

# Backend deps
COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --no-cache-dir -r /app/backend/requirements.txt rembg onnxruntime python-dotenv

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
