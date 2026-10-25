from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
ENV_FILE = ROOT / ".env"
TEST_AMOUNT_PAISE = 100
RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders"
pending_orders: dict[str, int] = {}


def load_local_env() -> None:
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(name.strip(), value)


def verify_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    message = f"{order_id}|{payment_id}".encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


class PaymentHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict | None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 8192:
                return None
            payload = json.loads(self.rfile.read(length))
            return payload if isinstance(payload, dict) else None
        except (ValueError, json.JSONDecodeError):
            return None

    def do_POST(self) -> None:
        if self.path == "/api/create-order":
            self.create_order()
        elif self.path == "/api/verify-payment":
            self.verify_payment()
        else:
            self.send_json(404, {"error": "API route not found."})

    def create_order(self) -> None:
        key_id = os.environ.get("RAZORPAY_KEY_ID", "").strip()
        key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
        if not key_id.startswith("rzp_test_") or not key_secret:
            self.send_json(503, {"error": "Add your Razorpay Test Mode Key ID and Secret to .env first."})
            return

        order_payload = {
            "amount": TEST_AMOUNT_PAISE,
            "currency": "INR",
            "receipt": f"hrtest_{uuid.uuid4().hex[:24]}",
            "notes": {"purpose": "HR Employee Analytics test payment"},
        }
        credentials = base64.b64encode(f"{key_id}:{key_secret}".encode("utf-8")).decode("ascii")
        request = Request(
            RAZORPAY_ORDERS_URL,
            data=json.dumps(order_payload).encode("utf-8"),
            headers={"Authorization": f"Basic {credentials}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urlopen(request, timeout=15) as response:
                order = json.loads(response.read())
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            self.send_json(502, {"error": "Razorpay could not create the test order. Check the Test Mode keys and try again."})
            return

        order_id = order.get("id")
        if not order_id or order.get("amount") != TEST_AMOUNT_PAISE or order.get("currency") != "INR":
            self.send_json(502, {"error": "Razorpay returned an unexpected test order."})
            return

        pending_orders[order_id] = TEST_AMOUNT_PAISE
        self.send_json(200, {
            "key_id": key_id,
            "order_id": order_id,
            "amount": TEST_AMOUNT_PAISE,
            "currency": "INR",
        })

    def verify_payment(self) -> None:
        payload = self.read_json()
        if not payload:
            self.send_json(400, {"error": "Invalid payment response."})
            return

        order_id = str(payload.get("razorpay_order_id", ""))
        payment_id = str(payload.get("razorpay_payment_id", ""))
        signature = str(payload.get("razorpay_signature", ""))
        secret = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
        expected_amount = pending_orders.get(order_id)
        if not secret or expected_amount != TEST_AMOUNT_PAISE or not payment_id:
            self.send_json(400, {"error": "The test payment could not be verified."})
            return

        if not verify_signature(order_id, payment_id, signature, secret):
            self.send_json(400, {"error": "Razorpay signature verification failed."})
            return

        del pending_orders[order_id]
        self.send_json(200, {"verified": True, "amount": expected_amount, "currency": "INR"})


def main() -> None:
    load_local_env()
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("127.0.0.1", port), PaymentHandler)
    print(f"HR Employee Analytics running at http://127.0.0.1:{port}")
    print("Razorpay Test Mode only: each test order is fixed at INR 1.00.")
    server.serve_forever()


if __name__ == "__main__":
    main()