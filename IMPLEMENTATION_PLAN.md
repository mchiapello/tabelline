# MathQuest — Ultra-Detailed Implementation Plan

Branch: `feature/mathquest-implementation`  
Reference docs: `MATHQUEST_PLAN.md`, `ARCHITECTURE.html`, `ARCHITECTURE_COMPARISON.md`  
Strategy: **game-first, guest mode first, auth added on top**

---

## Repository Layout (target state)

```
tabelline/
├── app.py                          # App factory, core routes, RewardEvent gateway
├── auth.py                         # JWT helpers, token_required decorator
├── database.py                     # DB init, all core table DDL, per-request g connection
├── registry.py                     # Module registry: load, health, access-check
├── srs.py                          # Pure SM-2 algorithm (no DB imports)
├── requirements.txt                # Updated deps
│
├── modules/
│   └── moltiplicazioni/
│       ├── __init__.py             # Blueprint factory + manifest
│       ├── routes.py               # Game API endpoints
│       ├── game.py                 # Question generation, session logic
│       ├── srs_db.py               # Module-owned SRS DB reads/writes
│       └── database.py            # Module-owned table DDL
│
├── static/
│   ├── css/
│   │   ├── design.css              # Design system: tokens, reset, typography
│   │   ├── layout.css              # Shell, nav, page grid
│   │   ├── components.css          # Buttons, cards, badges, modals
│   │   ├── game.css                # Game canvas, answer grid, feedback
│   │   └── journey.css             # Galaxy map, planet nodes, progress arcs
│   └── js/
│       ├── api.js                  # fetch wrapper, token injection, error handling
│       ├── guest.js                # localStorage state manager for guest mode
│       ├── journey.js              # Galaxy map rendering + unlock transitions
│       ├── game.js                 # Game state machine (all 5 modes)
│       └── rewards.js              # XP/coin counter animation, badge toast
│
├── templates/
│   ├── base.html                   # Shell: nav, modals, JS/CSS includes
│   ├── landing.html                # Galaxy homepage (logged-in: map, guest: hero)
│   ├── journey.html                # Full-screen galaxy map
│   ├── game.html                   # Unified game view (all modes)
│   ├── profile.html                # Stats, badges, heatmap
│   └── auth/
│       ├── login.html
│       └── register.html
│
├── MATHQUEST_PLAN.md               # Research & design (do not modify)
├── ARCHITECTURE.html               # Architecture diagram (do not modify)
├── ARCHITECTURE_COMPARISON.md      # LiveGatewayView comparison (do not modify)
└── IMPLEMENTATION_PLAN.md          # This file
```

---

## Phases Overview

| Phase | Deliverable | Branch tag |
|---|---|---|
| 1 | Design system + shell | `phase-1-design` |
| 2 | Galaxy map + guest progression | `phase-2-journey` |
| 3 | Moltiplicazioni module (Explorer + Boss Battle) | `phase-3-module` |
| 4 | SRS + Daily Mission + Speed Run | `phase-4-srs` |
| 5 | Rewards (coins, XP, badges, streaks) | `phase-5-rewards` |
| 6 | Auth (register, login, server-side progress) | `phase-6-auth` |
| 7 | Profile page + heatmap | `phase-7-profile` |
| 8 | Galaxy Cup + polish + deploy prep | `phase-8-polish` |

---

## Phase 1 — Design System + Shell

### Goal
Replace the current minimal HTML with a complete design system. No game logic yet — just the visual shell every page will inherit.

### 1.1 `static/css/design.css` — Design tokens

```css
:root {
  /* Colour palette */
  --c-bg:         #0a0a1a;
  --c-surface:    #12122a;
  --c-surface2:   #1e1e40;
  --c-gold:       #FFD700;
  --c-gold-dim:   #b89a00;
  --c-cyan:       #00D4FF;
  --c-cyan-dim:   #007a99;
  --c-coral:      #FF6B6B;
  --c-green:      #4ade80;
  --c-text:       #f0f0ff;
  --c-text-dim:   #8888aa;
  --c-border:     #2a2a5a;

  /* Spacing scale (4px base) */
  --sp-1: 4px;   --sp-2: 8px;   --sp-3: 12px;  --sp-4: 16px;
  --sp-5: 20px;  --sp-6: 24px;  --sp-8: 32px;  --sp-12: 48px;
  --sp-16: 64px;

  /* Radii */
  --r-sm: 8px;  --r-md: 16px;  --r-lg: 24px;  --r-full: 9999px;

  /* Typography */
  --font-main: 'Nunito', 'Fredoka One', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs: 0.75rem;  --text-sm: 0.875rem;  --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.25rem;   --text-2xl: 1.5rem;
  --text-3xl: 2rem;    --text-4xl: 2.5rem;   --text-5xl: 3.5rem;

  /* Shadows */
  --shadow-glow-gold: 0 0 20px rgba(255,215,0,0.3);
  --shadow-glow-cyan: 0 0 20px rgba(0,212,255,0.3);
  --shadow-card: 0 4px 24px rgba(0,0,0,0.5);

  /* Transitions */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --t-fast: 150ms;  --t-base: 250ms;  --t-slow: 400ms;

  /* Touch targets (WCAG AA min 44px, we use 56px for kids) */
  --touch-min: 56px;
}
```

All font imports via `<link>` in `base.html` (Google Fonts: Nunito 400,600,700,900).

### 1.2 `static/css/layout.css` — Shell structure

```
body
└── #app-shell
    ├── <nav id="top-nav">          ← logo | planet counter | coin display | avatar/login
    ├── <main id="page-content">    ← swapped per route
    └── <div id="toast-root">       ← badge/XP toasts injected here
```

Nav is sticky, `height: 64px`, `z-index: 100`.  
Mobile: coin + avatar collapse behind a `☰` menu at `<= 640px`.

### 1.3 `static/css/components.css` — Reusable primitives

Components to define (with BEM-style class names):

| Component | Class | Notes |
|---|---|---|
| Primary button | `.btn .btn--primary` | gold bg, bounce on hover |
| Secondary button | `.btn .btn--secondary` | cyan outline |
| Ghost button | `.btn .btn--ghost` | transparent, dim text |
| Card | `.card` | `--c-surface2` bg, `--r-md` radius, shadow |
| Badge chip | `.badge-chip` | pill, coloured by type |
| Progress bar | `.progress-bar` | animated fill, height 8px |
| Modal overlay | `.modal-overlay` + `.modal-box` | backdrop blur, slide-up |
| Toast | `.toast` | slide-in from top-right |
| Star rating | `.stars` (1–3) | gold filled/empty SVG stars |
| Coin counter | `.coin-count` | coin SVG + number |
| XP bar | `.xp-bar` | cyan fill, level badge at end |

### 1.4 `templates/base.html`

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{% block title %}MathQuest{% endblock %}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ url_for('static', filename='css/design.css') }}">
  <link rel="stylesheet" href="{{ url_for('static', filename='css/layout.css') }}">
  <link rel="stylesheet" href="{{ url_for('static', filename='css/components.css') }}">
  {% block extra_css %}{% endblock %}
</head>
<body>
  <div id="app-shell">
    <nav id="top-nav">
      <a href="/" class="nav-logo">⭐ MathQuest</a>
      <div class="nav-center" id="nav-progress">
        <!-- planets unlocked counter, injected by journey.js -->
      </div>
      <div class="nav-right">
        <span class="coin-count" id="nav-coins">
          <svg><!-- coin SVG --></svg>
          <span id="coin-value">0</span>
        </span>
        <div id="nav-user">
          <!-- guest: Login / Register buttons -->
          <!-- logged in: avatar thumbnail + username -->
        </div>
      </div>
    </nav>
    <main id="page-content">
      {% block content %}{% endblock %}
    </main>
    <div id="toast-root"></div>
  </div>

  <!-- Modal placeholder (populated by JS) -->
  <div id="modal-root" hidden></div>

  <script src="{{ url_for('static', filename='js/api.js') }}"></script>
  <script src="{{ url_for('static', filename='js/guest.js') }}"></script>
  {% block extra_js %}{% endblock %}
</body>
</html>
```

### 1.5 `app.py` — App factory (Phase 1 skeleton)

```python
import os
from flask import Flask, render_template, g
from database import init_db, get_connection

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-CHANGE-ME')
    app.config['DATABASE'] = os.environ.get('DATABASE', 'mathquest.db')

    with app.app_context():
        init_db()

    # Teardown: close DB connection after each request
    @app.teardown_appcontext
    def close_db(error):
        db = g.pop('db', None)
        if db is not None:
            db.close()

    # Core page routes
    from routes.pages import pages_bp
    app.register_blueprint(pages_bp)

    # Core API routes (auth, modules, rewards)
    from routes.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    # Module registry
    from registry import load_active_modules
    load_active_modules(app)

    return app

app = create_app()  # for `flask run`
```

### 1.6 `database.py` — Core DDL (Phase 1 tables only)

Tables created in Phase 1 (full schema added incrementally per phase):

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'student',  -- student | teacher | operator
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    last_login    TEXT
);

-- Refresh tokens (sliding window, 30-day)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Module registry tokens (global activation, Layer 1)
CREATE TABLE IF NOT EXISTS module_tokens (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id       TEXT    NOT NULL UNIQUE,
    token_hash      TEXT    NOT NULL UNIQUE,
    active          INTEGER NOT NULL DEFAULT 0,
    pending_restart INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

`get_db()` uses Flask `g` for per-request connection:

```python
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(current_app.config['DATABASE'])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db
```

### 1.7 `auth.py` — JWT helpers

```python
import jwt, bcrypt, uuid
from datetime import datetime, timedelta, timezone
from flask import current_app, request, jsonify
from functools import wraps
from database import get_db

ACCESS_TOKEN_TTL  = timedelta(hours=1)
REFRESH_TOKEN_TTL = timedelta(days=30)

def make_access_token(user_id: int, username: str, role: str) -> str:
    payload = {
        'sub': user_id,
        'username': username,
        'role': role,
        'exp': datetime.now(timezone.utc) + ACCESS_TOKEN_TTL,
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def make_refresh_token(user_id: int) -> str:
    """Returns plaintext token (store hash in DB)."""
    token = str(uuid.uuid4())
    token_hash = bcrypt.hashpw(token.encode(), bcrypt.gensalt()).decode()
    expires = datetime.now(timezone.utc) + REFRESH_TOKEN_TTL
    get_db().execute(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)",
        (user_id, token_hash, expires.isoformat())
    )
    get_db().commit()
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
    """Like token_required but passes None if no/invalid token (guest mode)."""
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
```

### 1.8 `static/js/api.js` — Fetch wrapper

```javascript
const API = (() => {
    const BASE = '/api/v1';

    function getToken() {
        return localStorage.getItem('mq_access_token');
    }

    async function request(method, path, body = null) {
        const headers = { 'Content-Type': 'application/json' };
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(BASE + path, opts);

        if (res.status === 401) {
            // Try refresh
            const refreshed = await tryRefresh();
            if (refreshed) return request(method, path, body);
            // Give up — emit event so UI can show login prompt
            window.dispatchEvent(new CustomEvent('mq:auth-expired'));
            throw new Error('auth_expired');
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw Object.assign(new Error(err.error || 'request_failed'), { status: res.status, body: err });
        }

        return res.json();
    }

    async function tryRefresh() {
        const rt = localStorage.getItem('mq_refresh_token');
        if (!rt) return false;
        try {
            const res = await fetch(BASE + '/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: rt })
            });
            if (!res.ok) return false;
            const data = await res.json();
            localStorage.setItem('mq_access_token', data.access_token);
            return true;
        } catch {
            return false;
        }
    }

    return {
        get:    (path)        => request('GET',    path),
        post:   (path, body)  => request('POST',   path, body),
        put:    (path, body)  => request('PUT',    path, body),
        delete: (path)        => request('DELETE', path),
    };
})();
```

### 1.9 `static/js/guest.js` — Guest state manager

All guest state lives in `localStorage` under key `mq_guest`. Shape:

```json
{
  "planets_unlocked": [2, 5, 10],
  "coins": 120,
  "xp": 340,
  "level": 4,
  "streak_days": 3,
  "last_practice_date": "2026-04-29",
  "srs": {
    "2x3": { "ef": 2.5, "interval": 1, "reps": 0, "next_review": "2026-04-29" }
  },
  "badges": ["moltiplicazioni:first_contact"]
}
```

```javascript
const Guest = (() => {
    const KEY = 'mq_guest';

    function load() {
        try {
            return JSON.parse(localStorage.getItem(KEY)) || defaultState();
        } catch {
            return defaultState();
        }
    }

    function save(state) {
        localStorage.setItem(KEY, JSON.stringify(state));
    }

    function defaultState() {
        return {
            planets_unlocked: [],
            coins: 0, xp: 0, level: 1,
            streak_days: 0,
            last_practice_date: null,
            srs: {},
            badges: []
        };
    }

    function applyReward(reward) {
        const s = load();
        s.coins += reward.coins || 0;
        s.xp    += reward.xp    || 0;
        s.level  = Math.floor(s.xp / 100) + 1;
        for (const b of (reward.badges_earned || [])) {
            if (!s.badges.includes(b)) s.badges.push(b);
        }
        if (reward.planet_unlocked) {
            if (!s.planets_unlocked.includes(reward.planet_unlocked)) {
                s.planets_unlocked.push(reward.planet_unlocked);
            }
        }
        save(s);
        return s;
    }

    function isLoggedIn() {
        return !!localStorage.getItem('mq_access_token');
    }

    return { load, save, applyReward, defaultState, isLoggedIn };
})();
```

### Phase 1 checklist
- [ ] `static/css/design.css` written (all tokens)
- [ ] `static/css/layout.css` written (nav + shell)
- [ ] `static/css/components.css` written (all components listed above)
- [ ] `templates/base.html` written
- [ ] `app.py` refactored to app factory
- [ ] `database.py` refactored with `get_db()` + Phase 1 tables
- [ ] `auth.py` written
- [ ] `static/js/api.js` written
- [ ] `static/js/guest.js` written
- [ ] `flask run` serves root without errors

---

## Phase 2 — Galaxy Map + Guest Progression

### Goal
A visually engaging landing page. Guest can see the galaxy map, see which planets are locked/unlocked, and navigate to games. No auth yet.

### 2.1 Galaxy map design

**Planet order** (learning-science recommended): 2 → 5 → 10 → 3 → 4 → 6 → 9 → 7 → 8  
**Visual:** SVG or CSS circles arranged in a curved path. Each circle = one planet.

Planet states:
- `locked` — greyed out, padlock icon
- `available` — glowing, pulse animation, "Play" button on hover
- `mastered` — gold ring, star badge showing boss-battle score

### 2.2 `templates/journey.html`

Extends `base.html`. Contains:
```html
{% block extra_css %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/journey.css') }}">
{% endblock %}

{% block content %}
<section id="galaxy-map">
  <div id="planet-path">
    <!-- 9 planet nodes, data-table="2" through data-table="8" -->
    <!-- populated by journey.js from guest state or server -->
  </div>
  <div id="map-legend">
    <!-- locked / available / mastered key -->
  </div>
</section>
{% endblock %}

{% block extra_js %}
<script src="{{ url_for('static', filename='js/journey.js') }}"></script>
{% endblock %}
```

### 2.3 `static/css/journey.css`

Planet node sizing and states:
```css
.planet-node {
  width: 80px; height: 80px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--text-xl); font-weight: 900;
  cursor: pointer;
  transition: transform var(--t-base) var(--ease-bounce),
              box-shadow var(--t-base) var(--ease-smooth);
  position: relative;
}

.planet-node[data-state="locked"] {
  background: var(--c-surface2);
  color: var(--c-text-dim);
  cursor: not-allowed;
}

.planet-node[data-state="available"] {
  background: radial-gradient(circle at 30% 30%, #5a3aff, #1a0a6e);
  color: var(--c-text);
  animation: pulse-glow 2s ease-in-out infinite;
}

.planet-node[data-state="mastered"] {
  background: radial-gradient(circle at 30% 30%, #ffd700, #8b6900);
  color: #0a0a1a;
  box-shadow: var(--shadow-glow-gold);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(90,58,255,0.4); }
  50%       { box-shadow: 0 0 0 12px rgba(90,58,255,0); }
}
```

Planet path connector (SVG line between nodes):
- Use an SVG `<polyline>` drawn behind all nodes
- Segments between locked pairs = `--c-border` dashed
- Segments between unlocked/mastered = gradient line

### 2.4 `static/js/journey.js`

```javascript
const Journey = (() => {
    const PLANET_ORDER = [2, 5, 10, 3, 4, 6, 9, 7, 8];
    const PLANET_NAMES = {
        2:'Duo',5:'Cinque',10:'Decima',3:'Trio',
        4:'Quadra',6:'Hexa',9:'Nova',7:'Septem',8:'Octo'
    };

    function getUnlocked() {
        if (Guest.isLoggedIn()) {
            // populated from /api/v1/user/progress on page load
            return window.__serverProgress?.planets_unlocked || [];
        }
        return Guest.load().planets_unlocked;
    }

    function stateOf(table) {
        const unlocked = getUnlocked();
        const idx = PLANET_ORDER.indexOf(table);
        if (unlocked.includes(table)) return 'mastered';
        // First planet always available; others need previous unlocked
        if (idx === 0 || unlocked.includes(PLANET_ORDER[idx - 1])) return 'available';
        return 'locked';
    }

    function render(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        PLANET_ORDER.forEach((table, i) => {
            const state = stateOf(table);
            const node = document.createElement('div');
            node.className = 'planet-node';
            node.dataset.table = table;
            node.dataset.state = state;
            node.dataset.index = i;
            node.innerHTML = `
              <span class="planet-number">${table}</span>
              <span class="planet-name">${PLANET_NAMES[table]}</span>
              ${state === 'mastered' ? '<span class="planet-star">★</span>' : ''}
              ${state === 'locked'   ? '<span class="planet-lock">🔒</span>' : ''}
            `;
            if (state !== 'locked') {
                node.addEventListener('click', () => openPlanetMenu(table, state));
            }
            container.appendChild(node);
        });
    }

    function openPlanetMenu(table, state) {
        // Shows modal with: Explorer / Daily Mission / Speed Run / Boss Battle buttons
        // Explorer always available; Boss Battle available if ≥ 5 Explorer sessions logged
        Modal.open('planet-menu', { table, state });
    }

    return { render, stateOf, PLANET_ORDER };
})();
```

### 2.5 `templates/landing.html` (rewrite)

- Hero section for guests: tagline + "Inizia a giocare" → goes to `journey.html`
- For logged-in users: go directly to `journey.html`
- Stats teaser: "9 pianeti × 9 tabelle = matematica totale"

### Phase 2 checklist
- [ ] `static/css/journey.css` written
- [ ] `templates/journey.html` written
- [ ] `templates/landing.html` rewritten (hero + CTA)
- [ ] `static/js/journey.js` written (render + openPlanetMenu)
- [ ] `GET /journey` route added to `app.py`
- [ ] Planet states render correctly from guest localStorage
- [ ] Planet-2 is "available" for brand-new guest
- [ ] Clicking an available planet opens a placeholder modal
- [ ] Galaxy map is visually correct on 375px mobile width

---

## Phase 3 — Moltiplicazioni Module (Explorer + Boss Battle)

### Goal
Full working multiplication game — two of the five modes. A guest can play Explorer to learn the ×2 table, then take Boss Battle to unlock planet 5.

### 3.1 Module file structure

```
modules/moltiplicazioni/
├── __init__.py        # Blueprint factory + manifest dict
├── routes.py          # /api/v1/modules/moltiplicazioni/* endpoints
├── game.py            # Question generation, session state
├── srs_db.py          # SRS reads/writes (uses core get_db())
└── database.py        # CREATE TABLE for module-owned tables
```

### 3.2 `modules/moltiplicazioni/__init__.py`

```python
from flask import Blueprint

MANIFEST = {
    "id":          "moltiplicazioni",
    "name":        "Moltiplicazioni",
    "version":     "1.0.0",
    "free":        True,              # globally available, no token needed
    "tables":      list(range(2, 10)),
    "game_modes":  ["explorer", "mission", "speedrun", "boss_battle", "galaxy_cup"],
    "ui_script":   "moltiplicazioni/game.js",
    "badge_prefix": "moltiplicazioni",
}

def create_blueprint():
    bp = Blueprint('moltiplicazioni', __name__, url_prefix='/modules/moltiplicazioni')
    from . import routes
    routes.register(bp)
    return bp
```

### 3.3 `modules/moltiplicazioni/database.py`

```sql
-- Session log (per answer, guest or user)
CREATE TABLE IF NOT EXISTS molt_sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,              -- NULL for guest (no FK, guests have no users row)
    session_key TEXT NOT NULL,        -- UUID generated client-side for guest continuity
    mode        TEXT NOT NULL,        -- explorer|mission|speedrun|boss_battle|galaxy_cup
    table_num   INTEGER NOT NULL,
    started_at  TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT,
    total_q     INTEGER NOT NULL DEFAULT 0,
    correct_q   INTEGER NOT NULL DEFAULT 0
);

-- Per-answer record
CREATE TABLE IF NOT EXISTS molt_answers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER NOT NULL REFERENCES molt_sessions(id) ON DELETE CASCADE,
    multiplicand INTEGER NOT NULL,
    multiplier   INTEGER NOT NULL,
    correct_ans  INTEGER NOT NULL,
    user_ans     INTEGER,
    is_correct   INTEGER NOT NULL DEFAULT 0,
    response_ms  INTEGER,             -- response time in milliseconds
    answered_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- SRS state per user per fact (2×3 = fact "2_3")
CREATE TABLE IF NOT EXISTS molt_srs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fact_key    TEXT NOT NULL,        -- "multiplicand_multiplier" e.g. "2_3"
    ef          REAL NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 1,
    reps        INTEGER NOT NULL DEFAULT 0,
    next_review TEXT NOT NULL DEFAULT (date('now')),
    last_quality INTEGER,
    UNIQUE(user_id, fact_key)
);

-- Boss battle results (used to gate planet unlock)
CREATE TABLE IF NOT EXISTS molt_boss_battles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    session_key TEXT NOT NULL,
    table_num   INTEGER NOT NULL,
    score_pct   REAL NOT NULL,        -- 0.0–100.0
    passed      INTEGER NOT NULL DEFAULT 0,  -- 1 if score >= 80%
    played_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 3.4 `modules/moltiplicazioni/game.py` — Question generation

```python
import random
from typing import Optional

PASS_THRESHOLD = 80.0   # Boss Battle pass score %
EXPLORER_Q     = 15     # Questions per Explorer session
BOSS_BATTLE_Q  = 20     # Questions per Boss Battle

def generate_explorer_session(table: int) -> list[dict]:
    """
    Blocked practice: all questions from one table.
    Shuffled, each multiplicand 1-10 used at least once,
    5 extra questions weighted toward harder facts (6,7,8,9).
    Returns list of {multiplicand, multiplier, correct_ans}.
    """
    base = [{'multiplicand': table, 'multiplier': m,
             'correct_ans': table * m} for m in range(1, 11)]
    hard = [{'multiplicand': table, 'multiplier': m,
              'correct_ans': table * m} for m in random.choices([6,7,8,9], k=5)]
    all_q = base + hard
    random.shuffle(all_q)
    return all_q[:EXPLORER_Q]

def generate_boss_battle(table: int) -> list[dict]:
    """
    20 questions from one table, no repeats within session.
    Weighted toward harder facts (×6–×9).
    """
    pool = list(range(1, 11))
    weights = [1,1,1,1,1,2,3,3,2,1]  # index 0=×1 … 9=×10
    chosen = random.choices(pool, weights=weights, k=BOSS_BATTLE_Q)
    return [{'multiplicand': table, 'multiplier': m,
             'correct_ans': table * m} for m in chosen]

def score_session(answers: list[dict]) -> dict:
    """answers: list of {is_correct: bool, response_ms: int}"""
    total   = len(answers)
    correct = sum(1 for a in answers if a['is_correct'])
    pct     = (correct / total * 100) if total else 0
    avg_ms  = sum(a.get('response_ms', 0) for a in answers) / total if total else 0
    return {
        'total':     total,
        'correct':   correct,
        'score_pct': round(pct, 1),
        'avg_ms':    round(avg_ms),
        'passed':    pct >= PASS_THRESHOLD,
    }

def build_reward_event(score: dict, mode: str, table: int,
                       prev_unlocked: list[int]) -> dict:
    """
    Builds a RewardEvent dict following the contract in MATHQUEST_PLAN.md.
    Core gateway will process this and mutate wallet/badges/streaks.
    """
    correct = score['correct']
    coins   = correct * 3
    xp      = correct * 5

    badges = []
    if correct == score['total'] and mode in ('explorer', 'boss_battle'):
        badges.append('moltiplicazioni:perfect_session')
    if mode == 'boss_battle' and score['passed']:
        badges.append(f'moltiplicazioni:master_x{table}')

    planet_unlocked = None
    if mode == 'boss_battle' and score['passed']:
        PLANET_ORDER = [2, 5, 10, 3, 4, 6, 9, 7, 8]
        idx = PLANET_ORDER.index(table)
        if idx + 1 < len(PLANET_ORDER):
            next_table = PLANET_ORDER[idx + 1]
            if next_table not in prev_unlocked:
                planet_unlocked = next_table

    return {
        'correct':        score['correct'],
        'coins':          coins,
        'xp':             xp,
        'badges_earned':  badges,
        'streak_activity': True,
        'srs_updated':    False,   # Phase 4
        'planet_unlocked': planet_unlocked,
        'module_data': {
            'table':     table,
            'mode':      mode,
            'score_pct': score['score_pct'],
            'passed':    score['passed'],
        }
    }
```

### 3.5 `modules/moltiplicazioni/routes.py`

All routes are under `/api/v1/modules/moltiplicazioni/` (registered via Blueprint prefix).

```
POST   /session/start      → start a new session, returns session_id + questions
POST   /session/answer     → record one answer, returns immediate feedback + partial reward
POST   /session/finish     → finish session, returns full RewardEvent
GET    /manifest           → returns MANIFEST dict
GET    /stats              → returns per-table accuracy for current user/guest
GET    /srs/queue          → returns next due facts for logged-in user (Phase 4)
```

**`POST /session/start`**

Request body:
```json
{ "mode": "explorer", "table": 2, "session_key": "uuid-for-guest" }
```

Response:
```json
{
  "session_id": 42,
  "questions": [
    { "id": 0, "multiplicand": 2, "multiplier": 7 },
    ...
  ]
}
```

Server creates a `molt_sessions` row. Returns questions without `correct_ans` (never send answer to client in advance).

**`POST /session/answer`**

Request body:
```json
{
  "session_id": 42,
  "question_index": 0,
  "multiplicand": 2,
  "multiplier": 7,
  "user_answer": 14,
  "response_ms": 1230
}
```

Response:
```json
{
  "correct": true,
  "correct_ans": 14,
  "stars": 3,          // 3=fast+correct, 2=slow+correct, 1=wrong
  "coins_earned": 3,
  "xp_earned": 5
}
```

Stars logic:
- 3 stars: correct + response_ms ≤ 5000
- 2 stars: correct + response_ms > 5000
- 1 star:  wrong (correct answer shown)

**`POST /session/finish`**

Request body:
```json
{ "session_id": 42, "session_key": "uuid" }
```

Response (full RewardEvent for client-side application):
```json
{
  "score": { "total": 15, "correct": 13, "score_pct": 86.7, "passed": true },
  "reward": {
    "coins": 39, "xp": 65,
    "badges_earned": ["moltiplicazioni:master_x2"],
    "planet_unlocked": 5,
    "streak_activity": true
  },
  "session_summary": {
    "mode": "explorer",
    "table": 2,
    "duration_ms": 145000
  }
}
```

For logged-in users, server also writes to `user_wallet`, `user_badges`, `user_streaks`.  
For guests, client applies `Guest.applyReward(reward)`.

### 3.6 `templates/game.html`

Extends `base.html`. One template covers all modes — JS controls the view.

```html
{% block extra_css %}
<link rel="stylesheet" href="{{ url_for('static', filename='css/game.css') }}">
{% endblock %}

{% block content %}
<div id="game-container">

  <!-- Mode header -->
  <div id="game-header">
    <button id="btn-quit" class="btn btn--ghost">← Esci</button>
    <div id="game-mode-label"></div>
    <div id="game-progress">
      <div class="progress-bar"><div id="progress-fill"></div></div>
      <span id="progress-text">0 / 15</span>
    </div>
    <div id="game-timer" hidden></div>   <!-- shown only in speedrun -->
  </div>

  <!-- Question area -->
  <div id="question-area">
    <div id="question-display">
      <span id="q-a"></span>
      <span class="q-operator">×</span>
      <span id="q-b"></span>
      <span class="q-eq">=</span>
      <span id="q-answer-display">?</span>
    </div>
    <div id="feedback-area"></div>   <!-- ✓ or ✗ + correct answer -->
  </div>

  <!-- Answer input area -->
  <div id="answer-area">
    <!-- Number pad (mobile) + keyboard input -->
    <input type="number" id="answer-input" inputmode="numeric"
           min="1" max="100" autocomplete="off" placeholder="?" />
    <div id="numpad">
      <!-- 1–9, 0, ← (backspace), ✓ (confirm) -->
    </div>
  </div>

  <!-- Session summary (shown on finish) -->
  <div id="session-summary" hidden>
    <!-- stars, score, coins/XP earned, badge notifications, CTA -->
  </div>

</div>
{% endblock %}

{% block extra_js %}
<script src="{{ url_for('static', filename='js/rewards.js') }}"></script>
<script src="{{ url_for('static', filename='js/game.js') }}"></script>
{% endblock %}
```

### 3.7 `static/js/game.js` — Game state machine

States: `idle → loading → playing → feedback → summary`

```javascript
const Game = (() => {
    let state = {
        mode: null, table: null,
        sessionId: null, sessionKey: null,
        questions: [], currentIdx: 0,
        answers: [],
        startTime: null, questionStartTime: null,
        timerId: null,  // speedrun countdown
    };

    async function start(mode, table) {
        state = {
            mode, table,
            sessionId: null,
            sessionKey: Guest.load()._sessionKey || crypto.randomUUID(),
            questions: [], currentIdx: 0, answers: [],
            startTime: Date.now(), questionStartTime: null,
            timerId: null,
        };

        const data = await API.post('/modules/moltiplicazioni/session/start', {
            mode, table, session_key: state.sessionKey
        });

        state.sessionId  = data.session_id;
        state.questions  = data.questions;
        renderQuestion();
    }

    function renderQuestion() {
        if (state.currentIdx >= state.questions.length) {
            return finishSession();
        }
        const q = state.questions[state.currentIdx];
        document.getElementById('q-a').textContent   = q.multiplicand;
        document.getElementById('q-b').textContent   = q.multiplier;
        document.getElementById('q-answer-display').textContent = '?';
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').focus();
        document.getElementById('feedback-area').innerHTML = '';
        document.getElementById('progress-fill').style.width =
            `${(state.currentIdx / state.questions.length) * 100}%`;
        document.getElementById('progress-text').textContent =
            `${state.currentIdx} / ${state.questions.length}`;
        state.questionStartTime = Date.now();
    }

    async function submitAnswer(userAnswer) {
        const q = state.questions[state.currentIdx];
        const response_ms = Date.now() - state.questionStartTime;

        const result = await API.post('/modules/moltiplicazioni/session/answer', {
            session_id: state.sessionId,
            question_index: state.currentIdx,
            multiplicand: q.multiplicand,
            multiplier: q.multiplier,
            user_answer: userAnswer,
            response_ms
        });

        state.answers.push({ is_correct: result.correct, response_ms });
        showFeedback(result);

        // Auto-advance after 1.2s on correct, 2.5s on wrong
        setTimeout(() => {
            state.currentIdx++;
            renderQuestion();
        }, result.correct ? 1200 : 2500);
    }

    function showFeedback(result) {
        const el = document.getElementById('feedback-area');
        if (result.correct) {
            el.innerHTML = `<span class="feedback feedback--correct">✓</span>`;
            document.getElementById('q-answer-display').textContent = result.correct_ans;
            Rewards.playCorrect(result.coins_earned, result.xp_earned);
        } else {
            el.innerHTML = `<span class="feedback feedback--wrong">✗ ${result.correct_ans}</span>`;
            document.getElementById('q-answer-display').textContent = result.correct_ans;
            // Gentle shake animation
            document.getElementById('question-area').classList.add('shake');
            setTimeout(() => document.getElementById('question-area').classList.remove('shake'), 500);
        }
    }

    async function finishSession() {
        const result = await API.post('/modules/moltiplicazioni/session/finish', {
            session_id: state.sessionId,
            session_key: state.sessionKey
        });

        // Apply reward to guest state OR server already updated for logged-in
        if (!Guest.isLoggedIn()) {
            Guest.applyReward(result.reward);
        }

        showSummary(result);
        Rewards.showSummary(result.reward);

        // Update journey map if planet unlocked
        if (result.reward.planet_unlocked) {
            Journey.render('planet-path');
        }
    }

    function showSummary(result) {
        const el = document.getElementById('session-summary');
        const s  = result.score;
        el.innerHTML = `
          <h2 class="summary-title">${s.passed ? '🎉 Completato!' : 'Allenati ancora!'}</h2>
          <div class="summary-score">${s.correct}/${s.total} — ${s.score_pct}%</div>
          <div class="summary-stars">${'★'.repeat(starsFromScore(s.score_pct))}</div>
          <div class="summary-rewards">
            +${result.reward.coins} monete &nbsp;|&nbsp; +${result.reward.xp} XP
          </div>
          <button class="btn btn--primary" onclick="Journey.render('planet-path'); showPage('journey')">
            Torna alla mappa
          </button>
        `;
        document.getElementById('game-container').querySelector('#question-area').hidden = true;
        document.getElementById('game-container').querySelector('#answer-area').hidden   = true;
        el.hidden = false;
    }

    function starsFromScore(pct) {
        if (pct >= 90) return 3;
        if (pct >= 70) return 2;
        return 1;
    }

    // Numpad + keyboard listeners wired up at DOMContentLoaded
    function initInputHandlers() {
        document.getElementById('answer-input').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) submitAnswer(val);
            }
        });
        document.querySelectorAll('.numpad-key').forEach(key => {
            key.addEventListener('click', () => {
                const input = document.getElementById('answer-input');
                if (key.dataset.value === 'back') {
                    input.value = input.value.slice(0, -1);
                } else if (key.dataset.value === 'confirm') {
                    const val = parseInt(input.value, 10);
                    if (!isNaN(val)) submitAnswer(val);
                } else {
                    input.value += key.dataset.value;
                }
            });
        });
    }

    return { start, initInputHandlers };
})();

document.addEventListener('DOMContentLoaded', Game.initInputHandlers);
```

### 3.8 `registry.py`

```python
from flask import current_app

_registry = {}  # module_id → { blueprint, manifest, health }

def load_active_modules(app):
    """Called once at startup from create_app()."""
    _try_load(app, 'moltiplicazioni')

def _try_load(app, module_id):
    try:
        mod = __import__(f'modules.{module_id}', fromlist=['create_blueprint', 'MANIFEST'])
        bp  = mod.create_blueprint()
        app.register_blueprint(bp, url_prefix=f'/api/v1')
        _registry[module_id] = {
            'blueprint': bp,
            'manifest':  mod.MANIFEST,
            'health':    'registered',
        }
        # Init module DB tables
        from importlib import import_module
        db_mod = import_module(f'modules.{module_id}.database')
        with app.app_context():
            db_mod.init_tables()
    except Exception as e:
        _registry[module_id] = {
            'blueprint': None,
            'manifest':  None,
            'health':    'broken',
            'error':     str(e),
        }
        app.logger.error(f'Module {module_id} failed to load: {e}')

def is_registered(module_id):
    return _registry.get(module_id, {}).get('health') == 'registered'

def get_health():
    return {mid: {'health': v['health'], 'manifest': v.get('manifest')}
            for mid, v in _registry.items()}
```

### 3.9 API endpoints for module health (operator-facing)

```
GET /api/v1/modules/health        → all modules health summary
GET /api/v1/modules/<id>/manifest → one module's manifest
```

Added to `routes/api.py`.

### Phase 3 checklist
- [ ] `modules/moltiplicazioni/__init__.py` written
- [ ] `modules/moltiplicazioni/database.py` written + `init_tables()` called at startup
- [ ] `modules/moltiplicazioni/game.py` written (generate_explorer_session, generate_boss_battle, score_session, build_reward_event)
- [ ] `modules/moltiplicazioni/routes.py` — all 5 endpoints implemented
- [ ] `registry.py` written and called from `create_app()`
- [ ] `templates/game.html` written
- [ ] `static/css/game.css` written (question display, numpad, feedback animations)
- [ ] `static/js/game.js` written (state machine, all handlers)
- [ ] Explorer mode playable end-to-end (guest)
- [ ] Boss Battle scores and returns `passed: true/false`
- [ ] `planet_unlocked` returned in reward when Boss Battle passed
- [ ] Guest localStorage updated with new planet after Boss Battle pass
- [ ] Journey map re-renders showing newly unlocked planet
- [ ] Answer shake animation on wrong answer
- [ ] Sparkle/bounce animation on correct answer
- [ ] Mobile layout functional at 375px

---

## Phase 4 — SRS + Daily Mission + Speed Run

### Goal
Add spaced repetition to surface weak facts. Add Daily Mission (adaptive 20-question interleaved session) and Speed Run (60-second timed burst).

### 4.1 `srs.py` — Pure SM-2 algorithm (no DB imports)

```python
def update(ef: float, reps: int, quality: int) -> tuple[float, int, int]:
    """
    SM-2 algorithm. quality: 0–5 (0-1=blackout, 2=wrong, 3=correct hard, 4=correct, 5=easy).
    Returns (new_ef, interval_days, new_reps).
    """
    if quality < 3:
        new_reps = 0
        interval = 1
    else:
        if reps == 0:
            interval = 1
        elif reps == 1:
            interval = 6
        else:
            # previous interval not passed here; caller must store it
            interval = None  # see note below
        new_reps = reps + 1

    new_ef = max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    return new_ef, interval, new_reps
```

**Note:** Full SM-2 uses the previous interval for the `reps ≥ 2` case. `srs_db.py` retrieves the current interval from the DB and multiplies by `new_ef`. The pure function is kept simple; the caller handles the `interval * ef` multiplication.

### 4.2 `modules/moltiplicazioni/srs_db.py`

```python
from database import get_db
from srs import update as sm2_update
from datetime import date, timedelta

def get_due_facts(user_id: int, table: int = None) -> list[dict]:
    """Returns facts due for review today, optionally filtered by table."""
    db = get_db()
    today = date.today().isoformat()
    if table:
        rows = db.execute(
            "SELECT * FROM molt_srs WHERE user_id=? AND fact_key LIKE ? AND next_review<=?",
            (user_id, f"{table}_%", today)
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM molt_srs WHERE user_id=? AND next_review<=?",
            (user_id, today)
        ).fetchall()
    return [dict(r) for r in rows]

def record_answer(user_id: int, fact_key: str, quality: int):
    """Update SRS state after an answer. quality 0-5."""
    db = get_db()
    row = db.execute(
        "SELECT ef, reps, interval_days FROM molt_srs WHERE user_id=? AND fact_key=?",
        (user_id, fact_key)
    ).fetchone()

    if row:
        ef, reps, interval = row['ef'], row['reps'], row['interval_days']
    else:
        ef, reps, interval = 2.5, 0, 1

    new_ef, new_interval_base, new_reps = sm2_update(ef, reps, quality)

    # For reps >= 2, multiply previous interval by new_ef
    if reps >= 2 and new_interval_base is None:
        new_interval = round(interval * new_ef)
    else:
        new_interval = new_interval_base or 1

    next_review = (date.today() + timedelta(days=new_interval)).isoformat()

    db.execute("""
        INSERT INTO molt_srs (user_id, fact_key, ef, interval_days, reps, next_review, last_quality)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, fact_key) DO UPDATE SET
            ef=excluded.ef, interval_days=excluded.interval_days,
            reps=excluded.reps, next_review=excluded.next_review,
            last_quality=excluded.last_quality
    """, (user_id, fact_key, new_ef, new_interval, new_reps, next_review, quality))
    db.commit()
```

### 4.3 Daily Mission mode

**Question selection** (server-side, for logged-in users):
1. Pull all SRS-due facts → weight them highest (quality < 3 → weight 4)
2. Pull facts from tables the user has visited in the last 7 days → weight 2
3. Fill to 20 questions with random facts from all unlocked tables → weight 1
4. Shuffle the final 20

For guests: purely random from unlocked planets (no SRS).

**Session flow:** Same as Explorer but mode = `mission`. RewardEvent sets `streak_activity: True`.

**Streak logic** (server-side, Phase 5):
- On `session/finish` for `mode=mission`, check `user_streaks.last_practice_date`
- If today − last_practice_date = 1 day → increment streak
- If today = last_practice_date → no change (already done today)
- If gap > 1 day → reset streak to 1

### 4.4 Speed Run mode

- Duration: 60 seconds (countdown timer shown in `#game-timer`)
- No fixed question count — as many as possible in 60s
- Same `/session/start` + `/session/answer` endpoints, mode = `speedrun`
- `/session/finish` called automatically when timer hits 0 or user taps "Stop"
- Score = questions answered correctly in 60s
- Personal best stored in `molt_sessions` (query max correct_q WHERE mode='speedrun' AND table_num=?)

Timer in `game.js`:
```javascript
function startSpeedRunTimer(seconds = 60) {
    const el = document.getElementById('game-timer');
    el.hidden = false;
    let remaining = seconds;
    el.textContent = remaining;
    state.timerId = setInterval(() => {
        remaining--;
        el.textContent = remaining;
        if (remaining <= 10) el.classList.add('timer--urgent');  // red pulse
        if (remaining <= 0) {
            clearInterval(state.timerId);
            finishSession();
        }
    }, 1000);
}
```

### Phase 4 checklist
- [ ] `srs.py` refactored to pure function (no DB import)
- [ ] `modules/moltiplicazioni/srs_db.py` written
- [ ] `GET /modules/moltiplicazioni/srs/queue` endpoint added
- [ ] Daily Mission question selection implemented (SRS-weighted for logged-in, random for guest)
- [ ] Daily Mission playable end-to-end
- [ ] Speed Run 60s timer functional
- [ ] Speed Run personal best shown on summary screen
- [ ] `session/answer` calls `srs_db.record_answer()` for logged-in users in Mission mode
- [ ] `session/finish` streak logic runs for Mission mode

---

## Phase 5 — Rewards: Coins, XP, Badges, Streaks

### Goal
Full reward system. Every correct answer earns coins + XP. Badges awarded on achievement. Streaks tracked per user.

### 5.1 Database tables (added to `database.py`)

```sql
CREATE TABLE IF NOT EXISTS user_wallet (
    user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    coins       INTEGER NOT NULL DEFAULT 0,
    xp          INTEGER NOT NULL DEFAULT 0,
    level       INTEGER NOT NULL DEFAULT 1,
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_streaks (
    user_id             INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak      INTEGER NOT NULL DEFAULT 0,
    longest_streak      INTEGER NOT NULL DEFAULT 0,
    last_practice_date  TEXT
);

CREATE TABLE IF NOT EXISTS user_badges (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id    TEXT    NOT NULL,    -- namespaced: "moltiplicazioni:master_x2"
    earned_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, badge_id)
);
```

### 5.2 `routes/api.py` — `apply_reward_event()` gateway function

```python
def apply_reward_event(user_id: int, reward: dict):
    """
    Central gateway: applies a RewardEvent to the user's wallet, badges, streaks.
    Called by module routes after /session/finish for logged-in users.
    """
    db = get_db()

    # Wallet
    if reward.get('coins') or reward.get('xp'):
        db.execute("""
            INSERT INTO user_wallet (user_id, coins, xp, level)
            VALUES (?, ?, ?, 1)
            ON CONFLICT(user_id) DO UPDATE SET
                coins = coins + excluded.coins,
                xp    = xp    + excluded.xp,
                level = MAX(1, (xp + excluded.xp) / 100 + 1),
                updated_at = datetime('now')
        """, (user_id, reward.get('coins', 0), reward.get('xp', 0)))

    # Badges (INSERT OR IGNORE for idempotency)
    for badge_id in reward.get('badges_earned', []):
        db.execute("""
            INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)
        """, (user_id, badge_id))

    # Streaks (only if streak_activity flagged)
    if reward.get('streak_activity'):
        _update_streak(db, user_id)

    db.commit()

def _update_streak(db, user_id):
    from datetime import date
    today = date.today().isoformat()
    row = db.execute(
        "SELECT current_streak, longest_streak, last_practice_date FROM user_streaks WHERE user_id=?",
        (user_id,)
    ).fetchone()

    if not row:
        db.execute("""
            INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_practice_date)
            VALUES (?, 1, 1, ?)
        """, (user_id, today))
        return

    last = row['last_practice_date']
    cur  = row['current_streak']
    best = row['longest_streak']

    if last == today:
        return  # already practiced today

    from datetime import date, timedelta
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    new_streak = cur + 1 if last == yesterday else 1
    new_best   = max(best, new_streak)

    db.execute("""
        UPDATE user_streaks
        SET current_streak=?, longest_streak=?, last_practice_date=?
        WHERE user_id=?
    """, (new_streak, new_best, today, user_id))
```

### 5.3 Badge catalogue (minimum 15)

Defined in `modules/moltiplicazioni/__init__.py` as `BADGES` dict:

| badge_id | Trigger |
|---|---|
| `moltiplicazioni:first_contact` | First answer ever submitted |
| `moltiplicazioni:master_x2` | Boss Battle ×2 passed |
| `moltiplicazioni:master_x5` | Boss Battle ×5 passed |
| `moltiplicazioni:master_x10` | Boss Battle ×10 passed |
| `moltiplicazioni:master_x3` | Boss Battle ×3 passed |
| `moltiplicazioni:master_x4` | Boss Battle ×4 passed |
| `moltiplicazioni:master_x6` | Boss Battle ×6 passed |
| `moltiplicazioni:master_x9` | Boss Battle ×9 passed |
| `moltiplicazioni:master_x7` | Boss Battle ×7 passed |
| `moltiplicazioni:master_x8` | Boss Battle ×8 passed |
| `moltiplicazioni:galaxy_explorer` | All 9 tables mastered |
| `moltiplicazioni:perfect_session` | 100% in any session |
| `moltiplicazioni:speed_demon` | Speed Run ≥ 15 correct in 60s |
| `moltiplicazioni:comeback_kid` | 3 wrong followed by 3 right (within one session) |
| `moltiplicazioni:seven_day_streak` | 7-day streak (checked in streak update) |
| `moltiplicazioni:perfect_mission` | 20/20 in Daily Mission |

### 5.4 `static/js/rewards.js` — Animated feedback

```javascript
const Rewards = (() => {
    function playCorrect(coins, xp) {
        // +coins floating text above answer
        const floater = document.createElement('div');
        floater.className = 'reward-floater';
        floater.textContent = `+${coins} 🪙`;
        document.getElementById('feedback-area').appendChild(floater);
        setTimeout(() => floater.remove(), 1200);

        // Update nav coin counter with animation
        const counter = document.getElementById('coin-value');
        const current = parseInt(counter.textContent, 10) || 0;
        animateCounter(counter, current, current + coins, 600);
    }

    function animateCounter(el, from, to, duration) {
        const start = performance.now();
        function step(now) {
            const t = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(from + (to - from) * t);
            if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function showBadgeToast(badgeId, badgeName) {
        const toast = document.createElement('div');
        toast.className = 'toast toast--badge';
        toast.innerHTML = `🏅 Nuovo badge: <strong>${badgeName}</strong>`;
        document.getElementById('toast-root').appendChild(toast);
        setTimeout(() => toast.classList.add('toast--visible'), 10);
        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    function showSummary(reward) {
        for (const badge of (reward.badges_earned || [])) {
            // badge name lookup from BADGE_NAMES map
            setTimeout(() => showBadgeToast(badge, BADGE_NAMES[badge] || badge), 500);
        }
    }

    return { playCorrect, showBadgeToast, showSummary };
})();
```

### Phase 5 checklist
- [ ] `user_wallet`, `user_streaks`, `user_badges` tables added to `database.py`
- [ ] `apply_reward_event()` gateway implemented in `routes/api.py`
- [ ] All 15 badges defined and checked at correct trigger points
- [ ] `moltiplicazioni:first_contact` awarded on first answer
- [ ] `moltiplicazioni:galaxy_explorer` awarded when all 9 boss battles passed
- [ ] Streak correctly increments, resets, and doesn't double-count same day
- [ ] `rewards.js` floating +coins animation works
- [ ] Badge toast appears correctly for earned badges
- [ ] Nav coin counter animates after each correct answer
- [ ] Guest rewards persisted to localStorage (Guest.applyReward)

---

## Phase 6 — Auth (Register, Login, Token Refresh)

### Goal
Add server-side accounts. Guest can register and migrate their progress. Logged-in users get persistent cross-device progress.

### 6.1 API endpoints

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

### 6.2 `POST /api/v1/auth/register`

Request:
```json
{
  "username": "astro_kid",
  "email": "kid@example.com",
  "password": "securepass123",
  "guest_progress": {             // optional — guest migration
    "planets_unlocked": [2, 5],
    "badges": ["moltiplicazioni:first_contact"],
    "xp": 340,
    "coins": 120
  }
}
```

Validation rules:
- `username`: 3–20 chars, `[a-zA-Z0-9_-]` only
- `email`: basic format check
- `password`: minimum 8 chars
- Return `400` with `field` + `message` on failure

On success:
1. Hash password with bcrypt (cost factor 12)
2. Insert `users` row
3. Insert `user_wallet` row (apply `guest_progress.coins` and `guest_progress.xp` if provided)
4. Insert `user_badges` rows for `guest_progress.badges`
5. Unlock planets: insert `molt_boss_battles` rows with `passed=1` for each planet in `guest_progress.planets_unlocked` (except first which is always free)
6. Generate access token + refresh token
7. Return `{ access_token, refresh_token, user: { id, username, role } }`

**Migration rules** (anti-abuse):
- Coins and XP from guest are migrated as-is
- Badges are migrated as-is
- Planet unlocks are migrated as boss_battle rows (synthetic `passed=1`)
- SRS state from localStorage is NOT migrated (no server state to merge with)

### 6.3 `POST /api/v1/auth/login`

```json
{ "username": "astro_kid", "password": "securepass123" }
```

Returns same shape as register on success. Returns `401` with `{ "error": "invalid_credentials" }` on failure (do not distinguish username vs password — prevents user enumeration).

bcrypt comparison: `bcrypt.checkpw(password.encode(), stored_hash.encode())`

### 6.4 `POST /api/v1/auth/refresh`

```json
{ "refresh_token": "uuid-string" }
```

Server logic:
1. Look up all non-expired refresh tokens for the presented token (compare hash via bcrypt)
2. If found and not expired: issue new access token, return `{ access_token }`
3. If expired or not found: return `401 { "error": "refresh_invalid" }`

Do NOT rotate refresh tokens on use (would break multi-device use). Refresh tokens expire naturally after 30 days; the user re-logs at that point.

### 6.5 `templates/auth/login.html` and `register.html`

Both extend `base.html`. Single-column centered card layout, 400px max-width.

Login form fields:
- Username
- Password (show/hide toggle)
- "Accedi" submit button
- Link to register page

Register form fields:
- Username (with real-time availability check after 500ms debounce → `GET /api/v1/auth/check-username?u=...`)
- Email
- Password
- Password confirm
- "Crea account" submit button
- "Gioca come ospite" link (dismisses and stays on journey page)

JS handles form submission, stores tokens in localStorage on success, redirects to `/journey`.

### 6.6 `GET /api/v1/auth/me`

Returns `{ id, username, role, wallet: { coins, xp, level }, streak: { current, longest } }` for logged-in user. Used by `base.html` JS to populate the nav on page load.

### 6.7 User progress endpoint

```
GET /api/v1/user/progress
```

Returns:
```json
{
  "planets_unlocked": [2, 5, 10],
  "wallet":  { "coins": 340, "xp": 780, "level": 8 },
  "streak":  { "current": 5, "longest": 12 },
  "badges":  ["moltiplicazioni:first_contact", "moltiplicazioni:master_x2"]
}
```

Used by `journey.js` to render the map for logged-in users instead of reading from localStorage.

### Phase 6 checklist
- [ ] `POST /auth/register` with full validation and guest migration
- [ ] `POST /auth/login` with bcrypt check
- [ ] `POST /auth/logout` (deletes refresh token row)
- [ ] `POST /auth/refresh` implemented
- [ ] `GET /auth/me` implemented
- [ ] `GET /user/progress` implemented
- [ ] `templates/auth/login.html` written
- [ ] `templates/auth/register.html` with live username check
- [ ] `api.js` tryRefresh() tested (access token expiry + silent refresh)
- [ ] Guest migration: planets, badges, coins/XP correctly transferred
- [ ] Nav shows username + avatar initial for logged-in user
- [ ] Nav shows Login/Register buttons for guest

---

## Phase 7 — Profile Page + Heatmap

### Goal
A personal stats page: XP progress, badges earned, per-table accuracy heatmap.

### 7.1 `templates/profile.html`

Sections:
1. **Header**: avatar initial, username, level badge, join date
2. **XP bar**: current XP, XP needed for next level, level number
3. **Streak card**: current streak flames, longest streak, last practice date
4. **Heatmap**: 9×10 grid (9 tables × 10 multipliers), coloured by accuracy
5. **Badges grid**: all earned badges as chips, greyed out unearned ones

### 7.2 Heatmap data endpoint

```
GET /api/v1/user/heatmap
```

Returns:
```json
{
  "facts": {
    "2_3": { "attempts": 12, "correct": 11, "accuracy": 91.7 },
    "7_8": { "attempts": 5,  "correct": 2,  "accuracy": 40.0 }
  }
}
```

Query: aggregate from `molt_answers` joined to `molt_sessions` where `user_id = current user`.

Heatmap colour scale (CSS `--c-heatmap-*`):
- 0 attempts → `#1e1e40` (unknown)
- < 50% accuracy → `#FF6B6B` (coral/red)
- 50–75% → `#FFD700` (gold/yellow)
- 75–90% → `#4ade80` (green)
- > 90% → `#00D4FF` (cyan/excellent)

### 7.3 `static/js/journey.js` — profile rendering addition

```javascript
async function renderHeatmap(containerId) {
    const data = await API.get('/user/heatmap');
    const container = document.getElementById(containerId);
    const tables = [2,5,10,3,4,6,9,7,8];
    const mults  = [1,2,3,4,5,6,7,8,9,10];

    container.innerHTML = '';
    for (const t of tables) {
        const row = document.createElement('div');
        row.className = 'heatmap-row';
        for (const m of mults) {
            const key = `${t}_${m}`;
            const fact = data.facts[key];
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.title = fact
                ? `${t}×${m}=${t*m}: ${fact.accuracy}% (${fact.attempts} tentativi)`
                : `${t}×${m}=${t*m}: mai praticato`;
            cell.dataset.accuracy = fact ? fact.accuracy : -1;
            cell.style.background = accuracyToColor(fact);
            row.appendChild(cell);
        }
        container.appendChild(row);
    }
}

function accuracyToColor(fact) {
    if (!fact || fact.attempts === 0) return 'var(--c-surface2)';
    const a = fact.accuracy;
    if (a < 50)  return 'var(--c-coral)';
    if (a < 75)  return 'var(--c-gold-dim)';
    if (a < 90)  return 'var(--c-green)';
    return 'var(--c-cyan)';
}
```

### Phase 7 checklist
- [ ] `GET /user/heatmap` endpoint implemented
- [ ] `templates/profile.html` written
- [ ] Heatmap renders with correct colours
- [ ] Heatmap cells show tooltip on hover
- [ ] Badges grid shows all 15 badges (earned coloured, unearned greyed)
- [ ] XP bar correctly shows progress to next level
- [ ] Streak card shows flame icons for current streak ≥ 3
- [ ] Profile accessible at `/profile` route

---

## Phase 8 — Galaxy Cup + Polish + Deploy Prep

### Goal
Add the 5th game mode, complete the mobile UX, add sound effects, and prepare for Render.com deployment.

### 8.1 Galaxy Cup mode

- No specific table — random questions from ALL unlocked planets
- No timer, no fixed count (user plays until they tap "Stop")
- Rewards scale with correct answers; no Boss Battle pass/fail
- Good for casual daily practice or warming up

Implementation: extend `generate_boss_battle` to accept `table=None` and draw facts from all unlocked tables.

### 8.2 Sound effects

Audio files: `static/audio/correct.mp3`, `wrong.mp3`, `levelup.mp3`, `badge.mp3`  
Format: MP3 at 44.1kHz, < 100KB each  
JS: `new Audio('/static/audio/correct.mp3').play()` — no library needed

User control: mute toggle in nav (stored in localStorage `mq_sound_enabled`).

### 8.3 Mobile polish

- Ensure numpad works with no keyboard on iOS (suppress iOS zoom on input focus: `font-size: 16px` minimum on inputs)
- Test with Chrome DevTools at 375px (iPhone SE), 414px (iPhone XR), 768px (iPad)
- Swipe-left on galaxy map scrolls between planets on small screens
- Bottom-safe-area padding for iPhone notch: `padding-bottom: env(safe-area-inset-bottom)`

### 8.4 `requirements.txt` (final state)

```
flask>=3.0.0
pyjwt>=2.8.0
bcrypt>=4.1.0
gunicorn>=21.0.0
```

No Flask-Login, no Flask-WTF, no SQLAlchemy — keep dependencies minimal.

### 8.5 `Procfile` (Render.com)

```
web: gunicorn "app:create_app()" --bind 0.0.0.0:$PORT --workers 2 --timeout 60
```

### 8.6 `render.yaml`

```yaml
services:
  - type: web
    name: mathquest
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn "app:create_app()" --bind 0.0.0.0:$PORT
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE
        value: /var/data/mathquest.db
    disk:
      name: mathquest-db
      mountPath: /var/data
      sizeGB: 1
```

### 8.7 Security checklist before deploy
- [ ] `SECRET_KEY` never hardcoded — always from `os.environ`
- [ ] bcrypt cost factor ≥ 12
- [ ] All user inputs validated server-side (username regex, email format, password length)
- [ ] `PRAGMA foreign_keys=ON` in every DB connection
- [ ] No SQL string interpolation — always parameterised queries (`?` placeholders)
- [ ] CORS: only allow own origin (Flask-CORS not needed for same-origin app)
- [ ] Rate limiting on `/auth/login` and `/auth/register`: max 10 req/min per IP (add `flask-limiter` as only extra dep if needed)
- [ ] No user PII beyond email (no DOB, no full name, no phone)
- [ ] Refresh tokens stored as bcrypt hashes (never plaintext in DB)

### Phase 8 checklist
- [ ] Galaxy Cup mode implemented
- [ ] Sound effects added (correct, wrong, levelup, badge)
- [ ] Mute toggle in nav
- [ ] Mobile tested at 375px, 414px, 768px
- [ ] `requirements.txt` finalised
- [ ] `Procfile` and `render.yaml` created
- [ ] Security checklist passed
- [ ] End-to-end test: new guest → play Explorer → pass Boss Battle → unlock planet → register → migrate progress → play Mission → earn badge → view profile heatmap

---

## Three-Layer Module Access (Phases 3–6 integration note)

The `moltiplicazioni` module has `free: True` in its manifest, so access checks always pass for Layer 1 alone. The three-layer check is in place but trivially satisfied:

```python
# registry.py
def user_can_access_module(user_id, module_id):
    info = _registry.get(module_id)
    if not info or info['health'] != 'registered':       # Layer 1: registered?
        return False
    if info['manifest'].get('free'):
        return True                                       # Free module: no further check
    # Layer 2: org check (future paid modules)
    # Layer 3: user check (future paid modules)
    return False
```

Future paid modules will set `free: False` and require a token. The `org_module_access` and `user_module_access` tables (defined in MATHQUEST_PLAN.md) are created in `database.py` from Phase 3 onwards but are not queried until a paid module exists.

---

## Dependency between phases (critical path)

```
Phase 1 (shell) ──► Phase 2 (journey) ──► Phase 3 (module+game) ──► Phase 4 (SRS)
                                                    │
                                                    ▼
                                           Phase 5 (rewards) ──► Phase 6 (auth) ──► Phase 7 (profile)
                                                                        │
                                                                        ▼
                                                                 Phase 8 (polish)
```

Phase 3 is the longest phase. Phases 4 and 5 can be partially parallelised (SRS is independent of the badge/streak system).

---

## Key invariants to maintain throughout

1. **Guest mode always works** — never require login to play. Every game endpoint accepts `session_key` (UUID) as guest identifier.
2. **Modules never import from `database.py` directly** — only via `get_db()` from Flask's `g`.
3. **`srs.py` has zero imports from the project** — pure algorithm only.
4. **RewardEvent is the only return value from module session/finish** — core gateway owns the wallet/badge mutation.
5. **No plaintext tokens in DB** — both bcrypt-hashed passwords and bcrypt-hashed refresh tokens.
6. **Badge IDs are always namespaced** — `"<module_id>:<slug>"` format enforced.
7. **All SQL uses `?` placeholders** — no f-string or `.format()` in queries.
