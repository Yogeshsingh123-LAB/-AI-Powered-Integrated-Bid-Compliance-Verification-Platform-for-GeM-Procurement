"""WebSocket authentication tests: anonymous and non-officer connections
must be closed (1008), officer connections are authenticated."""
import pytest
from starlette.websockets import WebSocketDisconnect

from conftest import login, make_user, get_db_session


def _connect(client, token=None):
    with client.websocket_connect("/api/v1/monitoring/live") as ws:
        if token is not None:
            ws.send_json({"token": token})
        # For anonymous / unauthorized connections the server closes the
        # socket (code 1008) without sending anything -> receive raises.
        return ws.receive_json()


def test_websocket_anonymous_closed(client):
    with pytest.raises(WebSocketDisconnect):
        _connect(client)


def test_websocket_bidder_rejected(client):
    db = get_db_session()
    try:
        make_user(db, "ws-bidder@test.com", "Passw0rdAbc", role="BIDDER")
    finally:
        db.close()
    token = login(client, "ws-bidder@test.com", "Passw0rdAbc").json()["access_token"]
    with pytest.raises(WebSocketDisconnect):
        _connect(client, token=token)


def test_websocket_officer_accepted(client):
    db = get_db_session()
    try:
        make_user(db, "ws-officer@test.com", "Passw0rdAbc", role="OFFICER")
    finally:
        db.close()
    token = login(client, "ws-officer@test.com", "Passw0rdAbc").json()["access_token"]
    msg = _connect(client, token=token)
    assert msg.get("type") == "authenticated"
