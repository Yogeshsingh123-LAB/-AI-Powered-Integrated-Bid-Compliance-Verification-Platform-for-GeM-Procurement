import logging
from typing import Dict, List, Set, Any, Optional
# pyrefly: ignore [missing-import]
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages active WebSocket connections for real-time bid monitoring streams.
    Supports both a global monitoring feed and tender-specific subscription channels.
    """

    def __init__(self):
        self.active_global_connections: List[WebSocket] = []
        self.tender_channel_connections: Dict[str, List[WebSocket]] = {}
        self.recent_events_log: List[Dict[str, Any]] = []

    async def connect_global(self, websocket: WebSocket):
        await websocket.accept()
        self.active_global_connections.append(websocket)
        logger.info(f"WebSocketManager: Client connected to global live stream. Total active: {len(self.active_global_connections)}")

    def disconnect_global(self, websocket: WebSocket):
        if websocket in self.active_global_connections:
            self.active_global_connections.remove(websocket)
            logger.info("WebSocketManager: Client disconnected from global stream.")

    async def connect_tender(self, tender_id: str, websocket: WebSocket):
        await websocket.accept()
        if tender_id not in self.tender_channel_connections:
            self.tender_channel_connections[tender_id] = []
        self.tender_channel_connections[tender_id].append(websocket)
        logger.info(f"WebSocketManager: Client connected to tender stream '{tender_id}'.")

    def disconnect_tender(self, tender_id: str, websocket: WebSocket):
        if tender_id in self.tender_channel_connections:
            if websocket in self.tender_channel_connections[tender_id]:
                self.tender_channel_connections[tender_id].remove(websocket)

    async def broadcast_event(self, event_data: Dict[str, Any], tender_id: Optional[str] = None):
        """Broadcasting JSON event payloads to global stream and tender-specific channels."""
        # Store in recent events log (max 50)
        self.recent_events_log.insert(0, event_data)
        if len(self.recent_events_log) > 50:
            self.recent_events_log.pop()

        # 1. Broadcast to global stream
        disconnected_global = []
        for connection in self.active_global_connections:
            try:
                await connection.send_json(event_data)
            except Exception as e:
                logger.warning(f"Error sending to global WebSocket client: {e}")
                disconnected_global.append(connection)

        for conn in disconnected_global:
            self.disconnect_global(conn)

        # 2. Broadcast to tender-specific stream if tender_id provided
        if tender_id and tender_id in self.tender_channel_connections:
            disconnected_tender = []
            for connection in self.tender_channel_connections[tender_id]:
                try:
                    await connection.send_json(event_data)
                except Exception as e:
                    logger.warning(f"Error sending to tender '{tender_id}' WebSocket client: {e}")
                    disconnected_tender.append(connection)

            for conn in disconnected_tender:
                self.disconnect_tender(tender_id, conn)

    def get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.recent_events_log[:limit]

# Singleton instance
ws_manager = ConnectionManager()
