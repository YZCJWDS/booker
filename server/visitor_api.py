#!/usr/bin/env python3
"""Small visitor analytics API for Booker.

The service is intentionally dependency-free: Python stdlib, SQLite, and a
best-effort IP geolocation lookup with a local cache.
"""

from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import hmac
import ipaddress
import json
import mimetypes
import os
import re
import secrets
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


DEFAULT_DB_PATH = os.environ.get("BOOKER_DB_PATH", "data/visitors.db")
DEFAULT_HOST = os.environ.get("BOOKER_API_HOST", "127.0.0.1")
DEFAULT_PORT = int(os.environ.get("BOOKER_API_PORT", "8765"))
DEFAULT_STATIC_ROOT = os.environ.get("BOOKER_STATIC_ROOT", str(Path(__file__).resolve().parent.parent))
SESSION_COOKIE = "booker_admin_session"
MAX_BODY_BYTES = 32 * 1024


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_iso(dt: datetime | None = None) -> str:
    return (dt or utc_now()).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def env_list(name: str, default: str) -> set[str]:
    return {item.strip() for item in os.environ.get(name, default).split(",") if item.strip()}


def read_admin_password() -> str:
    direct = os.environ.get("BOOKER_ADMIN_PASSWORD", "").strip()
    if direct:
        return direct

    password_file = os.environ.get("BOOKER_ADMIN_PASSWORD_FILE", "").strip()
    if password_file:
        try:
            return Path(password_file).read_text(encoding="utf-8").strip()
        except OSError:
            return ""

    return ""


def make_secret() -> bytes:
    configured = os.environ.get("BOOKER_SESSION_SECRET", "").strip()
    if configured:
        return configured.encode("utf-8")
    password = read_admin_password()
    if password:
        return hashlib.sha256(password.encode("utf-8")).digest()
    return secrets.token_bytes(32)


def safe_text(value: Any, limit: int = 500) -> str:
    if value is None:
        return ""
    text = str(value).replace("\x00", "").strip()
    return text[:limit]


def parse_json_body(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    length = int(handler.headers.get("Content-Length") or "0")
    if length <= 0:
        return {}
    if length > MAX_BODY_BYTES:
        raise ValueError("request body is too large")
    raw = handler.rfile.read(length)
    if not raw:
        return {}
    return json.loads(raw.decode("utf-8"))


def json_bytes(payload: Any) -> bytes:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def is_private_ip(ip: str) -> bool:
    try:
        parsed = ipaddress.ip_address(ip)
    except ValueError:
        return True
    return (
        parsed.is_private
        or parsed.is_loopback
        or parsed.is_link_local
        or parsed.is_multicast
        or parsed.is_reserved
        or parsed.is_unspecified
    )


WINDOWS_NT = {
    "10.0": "Windows 10/11",
    "6.3": "Windows 8.1",
    "6.2": "Windows 8",
    "6.1": "Windows 7",
}


def parse_user_agent(user_agent: str) -> dict[str, str]:
    ua = user_agent or ""
    lower = ua.lower()

    if re.search(r"bot|crawler|spider|preview|monitor|slurp", lower):
        device = "bot"
    elif "ipad" in lower or "tablet" in lower:
        device = "tablet"
    elif "mobile" in lower or "iphone" in lower or "android" in lower:
        device = "mobile"
    else:
        device = "desktop"

    browser_name = "Unknown"
    browser_version = ""
    browser_patterns = [
        ("Edge", r"(?:Edg|Edge)/([\d.]+)"),
        ("Opera", r"(?:OPR|Opera)/([\d.]+)"),
        ("Samsung Internet", r"SamsungBrowser/([\d.]+)"),
        ("Chrome", r"Chrome/([\d.]+)"),
        ("Firefox", r"Firefox/([\d.]+)"),
        ("Safari", r"Version/([\d.]+).*Safari/"),
        ("Internet Explorer", r"(?:MSIE |rv:)([\d.]+)"),
    ]
    if "; wv)" in lower or "version/4.0 chrome/" in lower and "android" in lower:
        browser_name = "Android WebView"
        match = re.search(r"Chrome/([\d.]+)", ua)
        browser_version = match.group(1) if match else ""
    else:
        for name, pattern in browser_patterns:
            match = re.search(pattern, ua)
            if match:
                browser_name = name
                browser_version = match.group(1)
                break

    os_name = "Unknown"
    os_version = ""
    if "Windows NT" in ua:
        match = re.search(r"Windows NT ([\d.]+)", ua)
        os_version = match.group(1) if match else ""
        os_name = WINDOWS_NT.get(os_version, "Windows")
    elif "Android" in ua:
        match = re.search(r"Android ([\d.]+)", ua)
        os_name = "Android"
        os_version = match.group(1) if match else ""
    elif "iPhone OS" in ua or "CPU OS" in ua:
        match = re.search(r"(?:iPhone OS|CPU OS) ([\d_]+)", ua)
        os_name = "iOS"
        os_version = match.group(1).replace("_", ".") if match else ""
    elif "Mac OS X" in ua:
        match = re.search(r"Mac OS X ([\d_]+)", ua)
        os_name = "macOS"
        os_version = match.group(1).replace("_", ".") if match else ""
    elif "Linux" in ua:
        os_name = "Linux"

    return {
        "browser_name": browser_name,
        "browser_version": browser_version,
        "os_name": os_name,
        "os_version": os_version,
        "device_type": device,
    }


class VisitorStore:
    def __init__(self, db_path: str):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=15)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=5000")
        return conn

    def init_db(self) -> None:
        with self.connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS visits (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    visited_at TEXT NOT NULL,
                    ip TEXT NOT NULL,
                    ip_version TEXT,
                    country TEXT,
                    region TEXT,
                    city TEXT,
                    latitude REAL,
                    longitude REAL,
                    timezone TEXT,
                    isp TEXT,
                    geo_status TEXT,
                    browser_name TEXT,
                    browser_version TEXT,
                    os_name TEXT,
                    os_version TEXT,
                    device_type TEXT,
                    user_agent TEXT,
                    page_path TEXT,
                    page_title TEXT,
                    referrer TEXT,
                    language TEXT,
                    screen TEXT,
                    client_timezone TEXT,
                    session_id TEXT
                );

                CREATE TABLE IF NOT EXISTS geo_cache (
                    ip TEXT PRIMARY KEY,
                    looked_up_at TEXT NOT NULL,
                    country TEXT,
                    region TEXT,
                    city TEXT,
                    latitude REAL,
                    longitude REAL,
                    timezone TEXT,
                    isp TEXT,
                    geo_status TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at DESC);
                CREATE INDEX IF NOT EXISTS idx_visits_ip ON visits(ip);
                CREATE INDEX IF NOT EXISTS idx_visits_page_path ON visits(page_path);
                """
            )

    def get_cached_geo(self, ip: str, cache_days: int) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM geo_cache WHERE ip = ?", (ip,)).fetchone()
        if not row:
            return None
        try:
            looked_up_at = parse_iso(row["looked_up_at"])
        except ValueError:
            return None
        if looked_up_at < utc_now() - timedelta(days=cache_days):
            return None
        return dict(row)

    def set_cached_geo(self, ip: str, geo: dict[str, Any]) -> None:
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO geo_cache (
                    ip, looked_up_at, country, region, city, latitude, longitude,
                    timezone, isp, geo_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(ip) DO UPDATE SET
                    looked_up_at = excluded.looked_up_at,
                    country = excluded.country,
                    region = excluded.region,
                    city = excluded.city,
                    latitude = excluded.latitude,
                    longitude = excluded.longitude,
                    timezone = excluded.timezone,
                    isp = excluded.isp,
                    geo_status = excluded.geo_status
                """,
                (
                    ip,
                    utc_iso(),
                    geo.get("country"),
                    geo.get("region"),
                    geo.get("city"),
                    geo.get("latitude"),
                    geo.get("longitude"),
                    geo.get("timezone"),
                    geo.get("isp"),
                    geo.get("geo_status"),
                ),
            )

    def record_visit(self, visit: dict[str, Any]) -> int:
        with self.connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO visits (
                    visited_at, ip, ip_version, country, region, city, latitude,
                    longitude, timezone, isp, geo_status, browser_name,
                    browser_version, os_name, os_version, device_type, user_agent,
                    page_path, page_title, referrer, language, screen,
                    client_timezone, session_id
                ) VALUES (
                    :visited_at, :ip, :ip_version, :country, :region, :city,
                    :latitude, :longitude, :timezone, :isp, :geo_status,
                    :browser_name, :browser_version, :os_name, :os_version,
                    :device_type, :user_agent, :page_path, :page_title,
                    :referrer, :language, :screen, :client_timezone, :session_id
                )
                """,
                visit,
            )
            return int(cursor.lastrowid)

    def public_stats(self) -> dict[str, Any]:
        today = utc_now() - timedelta(hours=24)
        with self.connect() as conn:
            total = conn.execute("SELECT COUNT(*) FROM visits").fetchone()[0]
            recent_24h = conn.execute(
                "SELECT COUNT(*) FROM visits WHERE visited_at >= ?", (utc_iso(today),)
            ).fetchone()[0]
            unique_ips = conn.execute("SELECT COUNT(DISTINCT ip) FROM visits").fetchone()[0]
            top_pages = [
                dict(row)
                for row in conn.execute(
                    """
                    SELECT COALESCE(NULLIF(page_path, ''), '/') AS page_path, COUNT(*) AS visits
                    FROM visits
                    GROUP BY COALESCE(NULLIF(page_path, ''), '/')
                    ORDER BY visits DESC
                    LIMIT 8
                    """
                )
            ]
            recent_locations = [
                {
                    "visited_at": row["visited_at"],
                    "country": row["country"] or "",
                    "region": row["region"] or "",
                    "city": row["city"] or "",
                    "browser_name": row["browser_name"] or "Unknown",
                    "device_type": row["device_type"] or "unknown",
                    "page_path": row["page_path"] or "/",
                }
                for row in conn.execute(
                    """
                    SELECT visited_at, country, region, city, browser_name, device_type, page_path
                    FROM visits
                    ORDER BY visited_at DESC
                    LIMIT 10
                    """
                )
            ]
        return {
            "total_visits": total,
            "recent_24h": recent_24h,
            "unique_ips": unique_ips,
            "top_pages": top_pages,
            "recent_locations": recent_locations,
        }

    def admin_summary(self) -> dict[str, Any]:
        with self.connect() as conn:
            rows = {
                "total_visits": conn.execute("SELECT COUNT(*) FROM visits").fetchone()[0],
                "unique_ips": conn.execute("SELECT COUNT(DISTINCT ip) FROM visits").fetchone()[0],
                "today_visits": conn.execute(
                    "SELECT COUNT(*) FROM visits WHERE visited_at >= ?",
                    (utc_iso(utc_now() - timedelta(hours=24)),),
                ).fetchone()[0],
            }
            by_browser = [
                dict(row)
                for row in conn.execute(
                    """
                    SELECT COALESCE(NULLIF(browser_name, ''), 'Unknown') AS name, COUNT(*) AS visits
                    FROM visits
                    GROUP BY COALESCE(NULLIF(browser_name, ''), 'Unknown')
                    ORDER BY visits DESC
                    LIMIT 8
                    """
                )
            ]
            by_country = [
                dict(row)
                for row in conn.execute(
                    """
                    SELECT COALESCE(NULLIF(country, ''), 'Unknown') AS name, COUNT(*) AS visits
                    FROM visits
                    GROUP BY COALESCE(NULLIF(country, ''), 'Unknown')
                    ORDER BY visits DESC
                    LIMIT 8
                    """
                )
            ]
        rows["by_browser"] = by_browser
        rows["by_country"] = by_country
        return rows

    def visit_filter(self, query: str = "", since_hours: int = 0) -> tuple[str, list[Any]]:
        clauses: list[str] = []
        params: list[Any] = []
        since_hours = max(0, min(since_hours, 24 * 3660))

        if since_hours:
            clauses.append("visited_at >= ?")
            params.append(utc_iso(utc_now() - timedelta(hours=since_hours)))

        if query:
            like = f"%{query}%"
            clauses.append(
                """
                (
                    ip LIKE ? OR page_path LIKE ? OR page_title LIKE ?
                    OR country LIKE ? OR region LIKE ? OR city LIKE ?
                    OR browser_name LIKE ? OR browser_version LIKE ?
                    OR os_name LIKE ? OR user_agent LIKE ? OR isp LIKE ?
                )
                """
            )
            params.extend([like] * 11)

        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        return where, params

    def count_visits(self, query: str = "", since_hours: int = 0) -> int:
        where, params = self.visit_filter(query=query, since_hours=since_hours)
        with self.connect() as conn:
            return int(conn.execute(f"SELECT COUNT(*) FROM visits {where}", params).fetchone()[0])

    def list_visits(
        self,
        limit: int = 100,
        offset: int = 0,
        query: str = "",
        since_hours: int = 0,
    ) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 500))
        offset = max(0, offset)
        where, params = self.visit_filter(query=query, since_hours=since_hours)

        sql = f"""
            SELECT *
            FROM visits
            {where}
            ORDER BY visited_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        with self.connect() as conn:
            return [dict(row) for row in conn.execute(sql, params)]

    def delete_visits(self, ids: list[Any]) -> int:
        clean_ids: list[int] = []
        for raw_id in ids:
            try:
                visit_id = int(raw_id)
            except (TypeError, ValueError):
                continue
            if visit_id > 0:
                clean_ids.append(visit_id)

        clean_ids = list(dict.fromkeys(clean_ids))[:200]
        if not clean_ids:
            return 0

        placeholders = ",".join("?" for _ in clean_ids)
        with self.connect() as conn:
            cursor = conn.execute(f"DELETE FROM visits WHERE id IN ({placeholders})", clean_ids)
            return int(cursor.rowcount)

    def purge_older_than(self, days: int) -> int:
        threshold = utc_iso(utc_now() - timedelta(days=days))
        with self.connect() as conn:
            cursor = conn.execute("DELETE FROM visits WHERE visited_at < ?", (threshold,))
            return cursor.rowcount


class GeoResolver:
    def __init__(self, store: VisitorStore):
        self.store = store
        self.provider = os.environ.get("BOOKER_GEO_PROVIDER", "ipwhois").strip().lower()
        self.timeout = float(os.environ.get("BOOKER_GEO_TIMEOUT", "3"))
        self.cache_days = int(os.environ.get("BOOKER_GEO_CACHE_DAYS", "14"))

    def resolve(self, ip: str) -> dict[str, Any]:
        base = {
            "country": "",
            "region": "",
            "city": "",
            "latitude": None,
            "longitude": None,
            "timezone": "",
            "isp": "",
            "geo_status": "unknown",
        }
        if is_private_ip(ip):
            return {**base, "geo_status": "private", "country": "Local/private network"}

        cached = self.store.get_cached_geo(ip, self.cache_days)
        if cached:
            return {
                "country": cached.get("country") or "",
                "region": cached.get("region") or "",
                "city": cached.get("city") or "",
                "latitude": cached.get("latitude"),
                "longitude": cached.get("longitude"),
                "timezone": cached.get("timezone") or "",
                "isp": cached.get("isp") or "",
                "geo_status": cached.get("geo_status") or "cached",
            }

        if self.provider in {"", "none", "off"}:
            geo = {**base, "geo_status": "disabled"}
            self.store.set_cached_geo(ip, geo)
            return geo

        if self.provider != "ipwhois":
            geo = {**base, "geo_status": f"unsupported:{self.provider}"}
            self.store.set_cached_geo(ip, geo)
            return geo

        geo = self._resolve_ipwhois(ip, base)
        self.store.set_cached_geo(ip, geo)
        return geo

    def _resolve_ipwhois(self, ip: str, base: dict[str, Any]) -> dict[str, Any]:
        fields = ",".join(
            [
                "success",
                "message",
                "country",
                "region",
                "city",
                "latitude",
                "longitude",
                "timezone",
                "connection",
            ]
        )
        url = f"https://ipwho.is/{urllib.parse.quote(ip)}?fields={urllib.parse.quote(fields)}"
        request = urllib.request.Request(url, headers={"User-Agent": "BookerVisitorAPI/1.0"})
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                data = json.loads(response.read().decode("utf-8"))
        except (OSError, urllib.error.URLError, json.JSONDecodeError) as exc:
            return {**base, "geo_status": f"error:{type(exc).__name__}"}

        if data.get("success") is False:
            return {**base, "geo_status": safe_text(data.get("message"), 120) or "failed"}

        connection = data.get("connection") if isinstance(data.get("connection"), dict) else {}
        timezone_value = data.get("timezone")
        if isinstance(timezone_value, dict):
            timezone_value = timezone_value.get("id") or timezone_value.get("utc") or ""

        return {
            "country": safe_text(data.get("country"), 80),
            "region": safe_text(data.get("region"), 80),
            "city": safe_text(data.get("city"), 80),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "timezone": safe_text(timezone_value, 80),
            "isp": safe_text(connection.get("isp") or connection.get("org"), 160),
            "geo_status": "ok",
        }


class SessionManager:
    def __init__(self) -> None:
        self.secret = make_secret()
        self.ttl_seconds = int(os.environ.get("BOOKER_ADMIN_SESSION_SECONDS", str(12 * 3600)))
        self.sessions: dict[str, float] = {}

    def _sign(self, token: str) -> str:
        digest = hmac.new(self.secret, token.encode("utf-8"), hashlib.sha256).digest()
        return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")

    def create(self) -> str:
        token = secrets.token_urlsafe(32)
        self.sessions[token] = time.time() + self.ttl_seconds
        return f"{token}.{self._sign(token)}"

    def validate(self, signed: str) -> bool:
        if "." not in signed:
            return False
        token, signature = signed.rsplit(".", 1)
        if not hmac.compare_digest(signature, self._sign(token)):
            return False
        expires_at = self.sessions.get(token)
        if not expires_at or expires_at < time.time():
            self.sessions.pop(token, None)
            return False
        return True

    def revoke(self, signed: str) -> None:
        token = signed.rsplit(".", 1)[0] if "." in signed else signed
        self.sessions.pop(token, None)


class VisitorAPI(BaseHTTPRequestHandler):
    server_version = "BookerVisitorAPI/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        if os.environ.get("BOOKER_API_ACCESS_LOG", "0") == "1":
            super().log_message(fmt, *args)

    @property
    def store(self) -> VisitorStore:
        return self.server.store  # type: ignore[attr-defined]

    @property
    def resolver(self) -> GeoResolver:
        return self.server.resolver  # type: ignore[attr-defined]

    @property
    def sessions(self) -> SessionManager:
        return self.server.sessions  # type: ignore[attr-defined]

    @property
    def admin_password(self) -> str:
        return self.server.admin_password  # type: ignore[attr-defined]

    @property
    def trusted_proxies(self) -> set[str]:
        return self.server.trusted_proxies  # type: ignore[attr-defined]

    @property
    def static_root(self) -> Path:
        return self.server.static_root  # type: ignore[attr-defined]

    def do_GET(self) -> None:
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/health":
            self.send_json({"ok": True, "time": utc_iso()})
        elif path == "/api/me":
            self.send_json({"ok": True, "visitor": self.current_visitor(record=False)})
        elif path == "/api/public-stats":
            self.send_json({"ok": True, "stats": self.store.public_stats()})
        elif path == "/api/admin/summary":
            self.require_admin(lambda: self.send_json({"ok": True, "summary": self.store.admin_summary()}))
        elif path == "/api/admin/visits":
            self.require_admin(self.handle_admin_visits)
        elif path.startswith("/api/"):
            self.send_error_json(HTTPStatus.NOT_FOUND, "not found")
        else:
            self.serve_static(path)

    def do_POST(self) -> None:
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/visit":
            self.handle_visit()
        elif path == "/api/admin/login":
            self.handle_login()
        elif path == "/api/admin/logout":
            self.handle_logout()
        else:
            self.send_error_json(HTTPStatus.NOT_FOUND, "not found")

    def do_DELETE(self) -> None:
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/admin/visits":
            self.require_admin(self.handle_delete_visits)
        else:
            self.send_error_json(HTTPStatus.NOT_FOUND, "not found")

    def handle_visit(self) -> None:
        try:
            data = parse_json_body(self)
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(exc))
            return
        visitor = self.current_visitor(record=True, client_data=data)
        self.send_json({"ok": True, "visitor": visitor})

    def handle_login(self) -> None:
        try:
            data = parse_json_body(self)
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(exc))
            return

        password = str(data.get("password") or "")
        if not self.admin_password:
            self.send_error_json(HTTPStatus.SERVICE_UNAVAILABLE, "admin password is not configured")
            return
        if not hmac.compare_digest(password, self.admin_password):
            self.send_error_json(HTTPStatus.UNAUTHORIZED, "invalid password")
            return

        session = self.sessions.create()
        self.send_json(
            {"ok": True},
            headers=[
                (
                    "Set-Cookie",
                    f"{SESSION_COOKIE}={session}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age={self.sessions.ttl_seconds}",
                )
            ],
        )

    def handle_logout(self) -> None:
        session = self.session_cookie()
        if session:
            self.sessions.revoke(session)
        self.send_json(
            {"ok": True},
            headers=[
                (
                    "Set-Cookie",
                    f"{SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0",
                )
            ],
        )

    def handle_admin_visits(self) -> None:
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        try:
            limit = int(query.get("limit", ["100"])[0] or "100")
            offset = int(query.get("offset", ["0"])[0] or "0")
            since_hours = int(query.get("since_hours", ["0"])[0] or "0")
        except ValueError:
            self.send_error_json(HTTPStatus.BAD_REQUEST, "invalid pagination query")
            return

        limit = max(1, min(limit, 500))
        offset = max(0, offset)
        since_hours = max(0, min(since_hours, 24 * 3660))
        search = safe_text(query.get("q", [""])[0], 120)
        total = self.store.count_visits(query=search, since_hours=since_hours)
        rows = self.store.list_visits(limit=limit, offset=offset, query=search, since_hours=since_hours)
        self.send_json(
            {
                "ok": True,
                "visits": rows,
                "total": total,
                "limit": limit,
                "offset": offset,
                "q": search,
                "since_hours": since_hours,
            }
        )

    def handle_delete_visits(self) -> None:
        try:
            data = parse_json_body(self)
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_error_json(HTTPStatus.BAD_REQUEST, str(exc))
            return

        ids = data.get("ids")
        if not isinstance(ids, list):
            self.send_error_json(HTTPStatus.BAD_REQUEST, "ids must be a list")
            return

        deleted = self.store.delete_visits(ids)
        self.send_json({"ok": True, "deleted": deleted})

    def require_admin(self, action: Any) -> None:
        if not self.sessions.validate(self.session_cookie()):
            self.send_error_json(HTTPStatus.UNAUTHORIZED, "authentication required")
            return
        action()

    def session_cookie(self) -> str:
        raw = self.headers.get("Cookie", "")
        if not raw:
            return ""
        cookie = SimpleCookie()
        cookie.load(raw)
        if SESSION_COOKIE not in cookie:
            return ""
        return cookie[SESSION_COOKIE].value

    def current_visitor(
        self,
        record: bool = False,
        client_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        client_data = client_data or {}
        ip = self.client_ip()
        try:
            ip_version = f"IPv{ipaddress.ip_address(ip).version}"
        except ValueError:
            ip_version = ""
        user_agent = safe_text(self.headers.get("User-Agent", ""), 1200)
        ua = parse_user_agent(user_agent)
        geo = self.resolver.resolve(ip)
        visit = {
            "visited_at": utc_iso(),
            "ip": ip,
            "ip_version": ip_version,
            **geo,
            **ua,
            "user_agent": user_agent,
            "page_path": safe_text(client_data.get("path"), 300),
            "page_title": safe_text(client_data.get("title"), 200),
            "referrer": safe_text(client_data.get("referrer"), 500),
            "language": safe_text(client_data.get("language"), 80),
            "screen": safe_text(client_data.get("screen"), 80),
            "client_timezone": safe_text(client_data.get("timezone"), 80),
            "session_id": safe_text(client_data.get("sessionId"), 120),
        }
        if record:
            visit["id"] = self.store.record_visit(visit)
        return visit

    def client_ip(self) -> str:
        remote_ip = self.client_address[0]
        if remote_ip in self.trusted_proxies:
            real_ip = self.headers.get("X-Real-IP", "").strip()
            if real_ip:
                return real_ip.split(",")[0].strip()
            forwarded = self.headers.get("X-Forwarded-For", "").strip()
            if forwarded:
                return forwarded.split(",")[0].strip()
        return remote_ip

    def static_file_for_path(self, request_path: str) -> Path | None:
        if not self.static_root:
            return None

        decoded_path = urllib.parse.unquote(request_path.split("?", 1)[0])
        if decoded_path in {"", "/"}:
            decoded_path = "/index.html"
        elif decoded_path.endswith("/"):
            decoded_path = f"{decoded_path}index.html"

        relative = decoded_path.lstrip("/")
        candidate = (self.static_root / relative).resolve()
        root = self.static_root.resolve()

        try:
            candidate.relative_to(root)
        except ValueError:
            return None

        if candidate.is_dir():
            candidate = candidate / "index.html"
        if candidate.is_file():
            return candidate
        return None

    def serve_static(self, request_path: str) -> None:
        path = self.static_file_for_path(request_path)
        if path is None:
            path = self.static_file_for_path("/404.html")
            status = HTTPStatus.NOT_FOUND
        else:
            status = HTTPStatus.OK

        if path is None:
            self.send_error_json(HTTPStatus.NOT_FOUND, "not found")
            return

        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        if path.suffix.lower() in {".html", ".css", ".js", ".svg"}:
            content_type = f"{content_type}; charset=utf-8"

        try:
            body = path.read_bytes()
        except OSError:
            self.send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, "failed to read static file")
            return

        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store" if path.suffix.lower() == ".html" else "public, max-age=604800")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, payload: Any, status: HTTPStatus = HTTPStatus.OK, headers: list[tuple[str, str]] | None = None) -> None:
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        for key, value in headers or []:
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, status: HTTPStatus, message: str) -> None:
        self.send_json({"ok": False, "error": message}, status=status)


class VisitorHTTPServer(ThreadingHTTPServer):
    def __init__(
        self,
        server_address: tuple[str, int],
        handler: type[VisitorAPI],
        store: VisitorStore,
        static_root: str,
    ):
        super().__init__(server_address, handler)
        self.store = store
        self.resolver = GeoResolver(store)
        self.sessions = SessionManager()
        self.admin_password = read_admin_password()
        self.trusted_proxies = env_list("BOOKER_TRUSTED_PROXIES", "127.0.0.1,::1")
        self.static_root = Path(static_root).resolve()


def run_server(args: argparse.Namespace) -> None:
    store = VisitorStore(args.db)
    server = VisitorHTTPServer((args.host, args.port), VisitorAPI, store, args.static_root)
    print(f"Booker visitor API listening on http://{args.host}:{args.port}", flush=True)
    print(f"Serving static files from {Path(args.static_root).resolve()}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def print_visits(rows: list[dict[str, Any]]) -> None:
    if not rows:
        print("No visits found.")
        return
    header = ["time", "ip", "location", "browser", "os", "page"]
    print(" | ".join(header))
    print("-" * 110)
    for row in rows:
        location = ", ".join(part for part in [row.get("country"), row.get("region"), row.get("city")] if part)
        browser = " ".join(part for part in [row.get("browser_name"), row.get("browser_version")] if part)
        os_value = " ".join(part for part in [row.get("os_name"), row.get("os_version")] if part)
        values = [
            row.get("visited_at") or "",
            row.get("ip") or "",
            location or row.get("geo_status") or "",
            browser,
            os_value,
            row.get("page_path") or "",
        ]
        print(" | ".join(str(value)[:80] for value in values))


def export_csv(rows: list[dict[str, Any]], path: str) -> None:
    fieldnames = [
        "id",
        "visited_at",
        "ip",
        "country",
        "region",
        "city",
        "browser_name",
        "browser_version",
        "os_name",
        "os_version",
        "device_type",
        "page_path",
        "referrer",
        "user_agent",
    ]
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Booker visitor API and SQLite query tool")
    parser.add_argument("--db", default=DEFAULT_DB_PATH, help="SQLite database path")
    parser.add_argument("--host", default=DEFAULT_HOST, help="API host")
    parser.add_argument("--port", default=DEFAULT_PORT, type=int, help="API port")
    parser.add_argument("--static-root", default=DEFAULT_STATIC_ROOT, help="Static site root for local preview")
    parser.add_argument("--serve", action="store_true", help="Run the HTTP API")
    parser.add_argument("--list", action="store_true", help="List recent visits")
    parser.add_argument("--summary", action="store_true", help="Print summary JSON")
    parser.add_argument("--limit", type=int, default=50, help="Rows to list")
    parser.add_argument("--offset", type=int, default=0, help="Rows to skip")
    parser.add_argument("--q", default="", help="Search text for --list")
    parser.add_argument("--export-csv", default="", help="Export listed rows to CSV")
    parser.add_argument("--purge-days", type=int, default=0, help="Delete visits older than N days")
    args = parser.parse_args(argv)

    if args.serve or not any([args.list, args.summary, args.export_csv, args.purge_days]):
        run_server(args)
        return 0

    store = VisitorStore(args.db)
    if args.purge_days:
        deleted = store.purge_older_than(args.purge_days)
        print(f"Deleted {deleted} visits older than {args.purge_days} days.")

    if args.summary:
        print(json.dumps(store.admin_summary(), ensure_ascii=False, indent=2))

    if args.list or args.export_csv:
        rows = store.list_visits(limit=args.limit, offset=args.offset, query=args.q)
        if args.export_csv:
            export_csv(rows, args.export_csv)
            print(f"Exported {len(rows)} rows to {args.export_csv}")
        if args.list:
            print_visits(rows)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
