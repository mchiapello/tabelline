import jwt
import bcrypt
import uuid
from datetime import datetime, timedelta, timezone
from flask import current_app, request, jsonify
from functools import wraps
from database import get_db

ACCESS_TOKEN_TTL  = timedelta(hours=1)
REFRESH_TOKEN_TTL = timedelta(days=30)


def make_access_token(user_id: int, username: str, role: str) -> str:
    payload = {
        'sub':      user_id,
        'username': username,
        'role':     role,
        'exp':      datetime.now(timezone.utc) + ACCESS_TOKEN_TTL,
        'iat':      datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def make_refresh_token(user_id: int) -> str:
    """Returns plaintext token; stores bcrypt hash in DB."""
    token = str(uuid.uuid4())
    token_hash = bcrypt.hashpw(token.encode(), bcrypt.gensalt()).decode()
    expires = datetime.now(timezone.utc) + REFRESH_TOKEN_TTL
    db = get_db()
    db.execute(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)",
        (user_id, token_hash, expires.isoformat())
    )
    db.commit()
    return token


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'missing_token'}), 401
        raw = auth.split(' ', 1)[1]
        try:
            payload = jwt.decode(raw, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'token_expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'token_invalid'}), 401
        return f(payload, *args, **kwargs)
    return decorated


def optional_token(f):
    """Like token_required but passes None for guests."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        payload = None
        if auth.startswith('Bearer '):
            try:
                payload = jwt.decode(
                    auth.split(' ', 1)[1],
                    current_app.config['SECRET_KEY'],
                    algorithms=['HS256']
                )
            except jwt.InvalidTokenError:
                pass
        return f(payload, *args, **kwargs)
    return decorated
