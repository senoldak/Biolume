import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import asyncio
import logging
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.core.gmgn_client import gmgn_client
from backend.core.filters import analyze_token_security
from backend.bot.trade_executor import trade_executor
from backend.bot.telegram_bot import telegram_bot_service
from backend.core.autopilot import autopilot_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Biolume Terminal Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket Clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    telegram_bot_service.setup()
    # Background periodic radar scanner
    asyncio.create_task(periodic_radar_scanner())

async def periodic_radar_scanner():
    while True:
        try:
            tokens = await gmgn_client.get_trending_radar_tokens()
            analyzed = []
            for t in tokens:
                res = analyze_token_security(t, smart_wallets_active=t.get("smart_money_count", 2))
                analyzed.append(res.dict())
                
                # Evaluate and auto trade if autopilot enabled
                if autopilot_engine.is_running:
                    await autopilot_engine.evaluate_and_auto_trade(res.dict())

            if autopilot_engine.is_running:
                await autopilot_engine.monitor_open_positions_and_auto_sell()
            
            await manager.broadcast({
                "type": "RADAR_UPDATE",
                "data": analyzed
            })
        except Exception as e:
            logger.error(f"Error in scanner loop: {e}")
        await asyncio.sleep(5)

@app.get("/api/health")
def health_check():
    return {"status": "online", "service": "Biolume API"}

@app.get("/api/autopilot/status")
def get_autopilot_status():
    return {
        "is_running": autopilot_engine.is_running,
        "logs": autopilot_engine.history_logs,
        "stats": autopilot_engine.stats,
        "trade_history": autopilot_engine.trade_history,
        "pnl_chart_points": autopilot_engine.pnl_chart_points,
        "settings": {
            "min_smart_money": autopilot_engine.min_smart_money,
            "min_safety_score": autopilot_engine.min_safety_score,
            "take_profit": "+50%",
            "stop_loss": "-20%",
            "buy_amount_sol": autopilot_engine.buy_amount_sol
        }
    }

@app.post("/api/autopilot/toggle")
def toggle_autopilot():
    autopilot_engine.is_running = not autopilot_engine.is_running
    status_str = "STARTED" if autopilot_engine.is_running else "STOPPED"
    autopilot_engine.log(f"Autopilot mode {status_str}.")
    return {"is_running": autopilot_engine.is_running}

@app.get("/api/tokens/radar")
async def get_radar_tokens():
    tokens = await gmgn_client.get_trending_radar_tokens()
    return [analyze_token_security(t, smart_wallets_active=t.get("smart_money_count", 2)) for t in tokens]

@app.get("/api/smart-money")
async def get_smart_money_wallets():
    return await gmgn_client.get_smart_money_wallets()

@app.get("/api/wallet/balance")
def get_balance():
    return trade_executor.get_balance()

@app.get("/api/wallet/positions")
def get_positions():
    return trade_executor.get_positions()

class BuyRequest(BaseModel):
    token_address: str
    symbol: str
    amount_sol: float
    price_usd: float

@app.post("/api/trades/quick-buy")
def quick_buy(req: BuyRequest):
    return trade_executor.execute_quick_buy(req.token_address, req.symbol, req.amount_sol, req.price_usd)

@app.websocket("/ws/radar")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
