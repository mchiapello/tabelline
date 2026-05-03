import re
import bcrypt
from datetime import date, timedelta
from flask import Blueprint, request, jsonify, current_app
from database import get_db
from auth import make_access_token, make_refresh_token, token_required, optional_token

api_bp = Blueprint('api', __name__)


# ── Auth endpoints ────────────────────────────────────────────────────────────

@api_bp.route('/auth/register', methods=['POST'])
def auth_register():
    data     = request.get_json() or {}
    username = (data.get('username') or '').strip()
    email    = (data.get('email') or '').strip()
    password = data.get('password') or ''

    # Validation
    if not re.fullmatch(r'[a-zA-Z0-9_\-]{3,20}', username):
        return jsonify({'error': 'invalid_username',
                        'field': 'username',
                        'message': 'Username: 3–20 caratteri, solo lettere, numeri, _ o -'}), 400
    if not re.fullmatch(r'[^@\s]+@[^@\s]+\.[^@\s]+', email):
        return jsonify({'error': 'invalid_email', 'field': 'email',
                        'message': 'Indirizzo email non valido'}), 400
    if len(password) < 8:
        return jsonify({'error': 'password_too_short', 'field': 'password',
                        'message': 'La password deve avere almeno 8 caratteri'}), 400

    db = get_db()
    if db.execute('SELECT 1 FROM users WHERE username=?', (username,)).fetchone():
        return jsonify({'error': 'username_taken', 'field': 'username',
                        'message': 'Username già in uso'}), 400
    if db.execute('SELECT 1 FROM users WHERE email=?', (email,)).fetchone():
        return jsonify({'error': 'email_taken', 'field': 'email',
                        'message': 'Email già registrata'}), 400

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
    db.execute(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)',
        (username, email, pw_hash, 'student')
    )
    db.commit()
    user_id = db.execute('SELECT id FROM users WHERE username=?', (username,)).fetchone()['id']

    # Apply guest migration
    guest = data.get('guest_progress') or {}
    coins = int(guest.get('coins', 0))
    xp    = int(guest.get('xp', 0))
    level = max(1, xp // 100 + 1)
    db.execute(
        'INSERT OR IGNORE INTO user_wallet (user_id, coins, xp, level) VALUES (?,?,?,?)',
        (user_id, coins, xp, level)
    )
    for badge_id in (guest.get('badges') or []):
        db.execute('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?,?)',
                   (user_id, badge_id))
    for planet in (guest.get('planets_unlocked') or []):
        db.execute("""
            INSERT INTO molt_boss_battles (user_id, session_key, table_num, score_pct, passed)
            VALUES (?,?,?,?,1)
        """, (user_id, 'migration', planet, 100.0))
    db.commit()

    access_token  = make_access_token(user_id, username, 'student')
    refresh_token = make_refresh_token(user_id)

    return jsonify({
        'access_token':  access_token,
        'refresh_token': refresh_token,
        'user': {'id': user_id, 'username': username, 'role': 'student'}
    }), 201


@api_bp.route('/auth/login', methods=['POST'])
def auth_login():
    data     = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    db  = get_db()
    row = db.execute('SELECT * FROM users WHERE username=?', (username,)).fetchone()
    if not row or not bcrypt.checkpw(password.encode(), row['password_hash'].encode()):
        return jsonify({'error': 'invalid_credentials'}), 401

    db.execute("UPDATE users SET last_login=datetime('now') WHERE id=?", (row['id'],))
    db.commit()

    access_token  = make_access_token(row['id'], row['username'], row['role'])
    refresh_token = make_refresh_token(row['id'])

    return jsonify({
        'access_token':  access_token,
        'refresh_token': refresh_token,
        'user': {'id': row['id'], 'username': row['username'], 'role': row['role']}
    })


@api_bp.route('/auth/logout', methods=['POST'])
@token_required
def auth_logout(payload):
    data = request.get_json() or {}
    rt   = data.get('refresh_token')
    if rt:
        # We can't un-hash, so we delete all expired or we skip (tokens expire naturally).
        # For immediate invalidation, delete by user_id (logs out all devices).
        # Here we do a best-effort: delete the token row matching this user.
        get_db().execute('DELETE FROM refresh_tokens WHERE user_id=?', (payload['sub'],))
        get_db().commit()
    return jsonify({'ok': True})


@api_bp.route('/auth/refresh', methods=['POST'])
def auth_refresh():
    from datetime import timezone
    import jwt as pyjwt

    data = request.get_json() or {}
    rt   = data.get('refresh_token') or ''
    if not rt:
        return jsonify({'error': 'refresh_invalid'}), 401

    db   = get_db()
    now  = date.today().isoformat()
    rows = db.execute(
        'SELECT rt.*, u.username, u.role FROM refresh_tokens rt '
        'JOIN users u ON u.id=rt.user_id '
        'WHERE rt.expires_at > ? ORDER BY rt.id DESC LIMIT 50',
        (now,)
    ).fetchall()

    matched = None
    for row in rows:
        try:
            if bcrypt.checkpw(rt.encode(), row['token_hash'].encode()):
                matched = row
                break
        except Exception:
            continue

    if not matched:
        return jsonify({'error': 'refresh_invalid'}), 401

    access_token = make_access_token(matched['user_id'], matched['username'], matched['role'])
    return jsonify({'access_token': access_token})


@api_bp.route('/auth/me')
@token_required
def auth_me(payload):
    db  = get_db()
    row = db.execute('SELECT * FROM users WHERE id=?', (payload['sub'],)).fetchone()
    if not row:
        return jsonify({'error': 'not_found'}), 404

    wallet = db.execute('SELECT * FROM user_wallet WHERE user_id=?', (row['id'],)).fetchone()
    streak = db.execute('SELECT * FROM user_streaks WHERE user_id=?', (row['id'],)).fetchone()

    return jsonify({
        'id':       row['id'],
        'username': row['username'],
        'role':     row['role'],
        'wallet':   dict(wallet) if wallet else {'coins': 0, 'xp': 0, 'level': 1},
        'streak':   {'current': streak['current_streak'], 'longest': streak['longest_streak']}
                    if streak else {'current': 0, 'longest': 0},
    })


@api_bp.route('/auth/check-username')
def auth_check_username():
    username = (request.args.get('u') or '').strip()
    if not re.fullmatch(r'[a-zA-Z0-9_\-]{3,20}', username):
        return jsonify({'available': False, 'reason': 'invalid'})
    taken = get_db().execute('SELECT 1 FROM users WHERE username=?', (username,)).fetchone()
    return jsonify({'available': not bool(taken)})


# ── User progress ─────────────────────────────────────────────────────────────

@api_bp.route('/user/progress')
@token_required
def user_progress(payload):
    user_id = payload['sub']
    db      = get_db()

    passed_rows = db.execute(
        'SELECT DISTINCT table_num FROM molt_boss_battles WHERE user_id=? AND passed=1',
        (user_id,)
    ).fetchall()
    planets_unlocked = [r['table_num'] for r in passed_rows]

    wallet = db.execute('SELECT * FROM user_wallet WHERE user_id=?', (user_id,)).fetchone()
    streak = db.execute('SELECT * FROM user_streaks WHERE user_id=?', (user_id,)).fetchone()
    badges = db.execute('SELECT badge_id FROM user_badges WHERE user_id=?', (user_id,)).fetchall()

    return jsonify({
        'planets_unlocked': planets_unlocked,
        'wallet': dict(wallet) if wallet else {'coins': 0, 'xp': 0, 'level': 1},
        'streak': {'current': streak['current_streak'], 'longest': streak['longest_streak']}
                  if streak else {'current': 0, 'longest': 0},
        'badges': [r['badge_id'] for r in badges],
    })


@api_bp.route('/user/heatmap')
@token_required
def user_heatmap(payload):
    user_id = payload['sub']
    db      = get_db()

    rows = db.execute("""
        SELECT a.multiplicand, a.multiplier,
               COUNT(*) as attempts,
               SUM(a.is_correct) as correct
        FROM molt_answers a
        JOIN molt_sessions s ON s.id = a.session_id
        WHERE s.user_id = ?
        GROUP BY a.multiplicand, a.multiplier
    """, (user_id,)).fetchall()

    facts = {}
    for r in rows:
        key = f"{r['multiplicand']}_{r['multiplier']}"
        attempts = r['attempts']
        correct  = r['correct'] or 0
        facts[key] = {
            'attempts': attempts,
            'correct':  correct,
            'accuracy': round(correct / attempts * 100, 1) if attempts else 0,
        }

    return jsonify({'facts': facts})


# ── Module health ─────────────────────────────────────────────────────────────

@api_bp.route('/modules/health')
def modules_health():
    from registry import get_health
    return jsonify(get_health())


@api_bp.route('/modules/<module_id>/manifest')
def module_manifest(module_id):
    from registry import _registry
    info = _registry.get(module_id)
    if not info:
        return jsonify({'error': 'not_found'}), 404
    return jsonify(info.get('manifest') or {})


# ── Operator endpoints ────────────────────────────────────────────────────────

@api_bp.route('/operator/modules/<module_id>/activate', methods=['POST'])
def operator_activate_module(module_id):
    """
    Activate a non-free module by supplying the plaintext activation token.
    The token is bcrypt-compared against the hash stored in module_tokens.
    If the row doesn't exist yet (first activation), the token IS the hash
    seed — stored directly as the hash so the CLI and API share the same flow.
    """
    data  = request.get_json() or {}
    token = (data.get('token') or '').strip()
    if not token:
        return jsonify({'error': 'token_required'}), 400

    from registry import _registry, is_registered
    if not is_registered(module_id):
        return jsonify({'error': 'module_not_registered'}), 404

    manifest = (_registry.get(module_id) or {}).get('manifest') or {}
    if manifest.get('free'):
        return jsonify({'error': 'free_module_needs_no_token'}), 400

    db  = get_db()
    row = db.execute(
        'SELECT id, token_hash, active FROM module_tokens WHERE module_id=?',
        (module_id,)
    ).fetchone()

    if not row:
        return jsonify({'error': 'no_token_issued',
                        'hint':  'Run scripts/generate_token.py to issue a token first'}), 404

    if not bcrypt.checkpw(token.encode(), row['token_hash'].encode()):
        return jsonify({'error': 'invalid_token'}), 403

    db.execute('UPDATE module_tokens SET active=1, pending_restart=0 WHERE module_id=?',
               (module_id,))
    db.commit()
    return jsonify({'ok': True, 'module': module_id, 'activated': True})


@api_bp.route('/operator/modules/<module_id>/deactivate', methods=['POST'])
def operator_deactivate_module(module_id):
    """Deactivate a module (does not delete the token row)."""
    data  = request.get_json() or {}
    token = (data.get('token') or '').strip()
    if not token:
        return jsonify({'error': 'token_required'}), 400

    db  = get_db()
    row = db.execute('SELECT token_hash FROM module_tokens WHERE module_id=?',
                     (module_id,)).fetchone()
    if not row or not bcrypt.checkpw(token.encode(), row['token_hash'].encode()):
        return jsonify({'error': 'invalid_token'}), 403

    db.execute('UPDATE module_tokens SET active=0 WHERE module_id=?', (module_id,))
    db.commit()
    return jsonify({'ok': True, 'module': module_id, 'activated': False})


@api_bp.route('/operator/modules/status')
def operator_modules_status():
    """Public status of all registered modules (no auth required)."""
    from registry import get_health
    return jsonify(get_health())


# ── Reward gateway (used by module routes) ────────────────────────────────────

def apply_reward_event(user_id: int, reward: dict):
    """Applies a RewardEvent to wallet, badges, streaks for a logged-in user."""
    db = get_db()

    if reward.get('coins') or reward.get('xp'):
        db.execute("""
            INSERT INTO user_wallet (user_id, coins, xp, level)
            VALUES (?, ?, ?, 1)
            ON CONFLICT(user_id) DO UPDATE SET
                coins      = coins + excluded.coins,
                xp         = xp    + excluded.xp,
                level      = MAX(1, (xp + excluded.xp) / 100 + 1),
                updated_at = datetime('now')
        """, (user_id, reward.get('coins', 0), reward.get('xp', 0)))

    for badge_id in reward.get('badges_earned', []):
        db.execute('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?,?)',
                   (user_id, badge_id))

    if reward.get('streak_activity'):
        _update_streak(db, user_id)

    db.commit()


def _update_streak(db, user_id: int):
    today     = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    row = db.execute(
        'SELECT current_streak, longest_streak, last_practice_date FROM user_streaks WHERE user_id=?',
        (user_id,)
    ).fetchone()

    if not row:
        db.execute(
            'INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_practice_date) VALUES (?,1,1,?)',
            (user_id, today)
        )
        return

    if row['last_practice_date'] == today:
        return

    new_streak = (row['current_streak'] + 1) if row['last_practice_date'] == yesterday else 1
    new_best   = max(row['longest_streak'], new_streak)

    db.execute(
        'UPDATE user_streaks SET current_streak=?, longest_streak=?, last_practice_date=? WHERE user_id=?',
        (new_streak, new_best, today, user_id)
    )


# ── Legacy verbi API (preserved) ─────────────────────────────────────────────

@api_bp.route('/verbi/sessione')
def api_verbi_sessione():
    try:
        from srs_verbi import get_verbi_da_ripassare, ErrorManager
        from verbi_data import get_verbi_per_livello
    except ImportError:
        return jsonify({'error': 'module_unavailable'}), 503

    livello = request.args.get('livello', 'base')
    n       = int(request.args.get('n', 10))

    verbi_livello = get_verbi_per_livello(livello)
    da_ripassare  = get_verbi_da_ripassare(1, livello, limite=n)
    coperti       = {(r['infinito'], r['modo'], r['tempo'], r['persona']) for r in da_ripassare}
    esercizi      = list(da_ripassare)

    import random
    for v in random.sample(verbi_livello, len(verbi_livello)):
        if len(esercizi) >= n:
            break
        for modo, tempi in v['coniugazioni'].items():
            if modo == 'passato_prossimo' or not isinstance(tempi, dict):
                continue
            for tempo, persone in tempi.items():
                for persona in persone:
                    if (v['infinito'], modo, tempo, persona) not in coperti:
                        coniug = v['coniugazioni'][modo][tempo][persona]
                        esercizi.append({
                            'infinito':    v['infinito'],
                            'isIrregular': v['isIrregular'],
                            'modo':        modo,
                            'tempo':       tempo,
                            'persona':     persona,
                            'forma':       coniug if isinstance(coniug, str) else coniug['forma'],
                        })
                        coperti.add((v['infinito'], modo, tempo, persona))
                        break

    return jsonify({'esercizi': esercizi[:n]})
