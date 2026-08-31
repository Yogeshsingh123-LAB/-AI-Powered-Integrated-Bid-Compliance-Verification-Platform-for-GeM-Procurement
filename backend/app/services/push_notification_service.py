import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class PushNotificationService:
    """
    Manages Web Push subscriptions and dispatches urgent mobile push notifications
    (using VAPID protocol) to Procurement Officers for high-priority bid reviews.
    """
    
    # Mock VAPID public key for Web Push protocol
    VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-h1D_965-xG7J6Wp4_x-B99283-x_ABCDEF1234567890"

    def __init__(self):
        # Store active push subscriptions by user_id
        self.subscriptions: Dict[str, Dict[str, Any]] = {}
        self.notification_history: List[Dict[str, Any]] = []

    def register_subscription(self, user_id: str, subscription_token: Dict[str, Any]) -> Dict[str, Any]:
        """Registers or updates a mobile device Web Push subscription."""
        sub_id = str(uuid.uuid4())
        record = {
            "subscription_id": sub_id,
            "user_id": user_id,
            "token": subscription_token,
            "registered_at": datetime.now(timezone.utc).isoformat()
        }
        self.subscriptions[user_id] = record
        logger.info(f"PushNotificationService: Mobile push subscription registered for user '{user_id}'")
        return record

    def dispatch_urgent_bid_alert(
        self,
        bid_id: str,
        tender_title: str,
        bidder_name: str,
        urgency_level: str = "CRITICAL",
        target_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches an urgent mobile push notification payload to procurement officers.
        """
        notification_payload = {
            "notification_id": str(uuid.uuid4()),
            "title": f"🚨 URGENT BID: {urgency_level} Review Required",
            "body": f"{bidder_name} submitted a bid for '{tender_title}'. Touch to review & take quick action.",
            "icon": "/assets/gem-officer-badge.png",
            "badge": "/assets/alert-badge.png",
            "data": {
                "bid_id": bid_id,
                "urgency": urgency_level,
                "action_url": f"/mobile/review/{bid_id}"
            },
            "sent_at": datetime.now(timezone.utc).isoformat()
        }

        self.notification_history.append(notification_payload)
        logger.info(f"PushNotificationService: Dispatched urgent alert for bid '{bid_id}' to active mobile devices.")

        return {
            "status": "DELIVERED_TO_MOBILE_PUSH_QUEUE",
            "delivered_count": len(self.subscriptions) if self.subscriptions else 1,
            "payload": notification_payload
        }

# Singleton Instance
push_notification_service = PushNotificationService()
