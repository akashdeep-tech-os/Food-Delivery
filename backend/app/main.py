from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import json
import asyncio
from app.config import settings
from app.database import engine, Base
from app.routes import (
    auth_router, foods_router, categories_router, orders_router,
    users_router, payments_router, analytics_router, uploads_router,
    promos_router, notifications_router, settings_router
)
from app.middleware.error_handler import app_exception_handler, global_exception_handler
from app.utils.exceptions import AppException
from app.utils.security import decode_access_token
from pathlib import Path

connected_clients: list[WebSocket] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_for_runtime()
    yield


app = FastAPI(
    title="Food Delivery Admin API",
    description="Production-ready Food Delivery Backend with FastAPI + PostgreSQL",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth_router)
app.include_router(foods_router)
app.include_router(categories_router)
app.include_router(orders_router)
app.include_router(users_router)
app.include_router(payments_router)
app.include_router(analytics_router)
app.include_router(uploads_router)
app.include_router(promos_router)
app.include_router(notifications_router)
app.include_router(settings_router)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token or decode_access_token(token) is None:
        await websocket.close(code=1008, reason="Authentication required")
        return

    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await broadcast(data)
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


async def broadcast(message: str):
    for client in connected_clients[:]:
        try:
            await client.send_text(message)
        except Exception:
            if client in connected_clients:
                connected_clients.remove(client)


@app.get("/api/health/live")
def liveness_check():
    return {"status": "alive", "version": "1.0.0"}


@app.get("/api/health/ready")
def readiness_check():
    from sqlalchemy import text

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ready", "version": "1.0.0"}


@app.get("/api/health")
def health_check():
    return readiness_check()
