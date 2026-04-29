# MathQuest vs. LiveGatewayView — Architecture Comparison

> Structured analysis using LiveGatewayView as a reference architecture.
> For each axis: what matches, what differs, and why.

---

## 1. System Role and Intent

| Axis | LiveGatewayView | MathQuest |
|---|---|---|
| Primary role | Control-plane observer of a multi-service API platform | Product application delivering educational content to end users |
| Traffic relationship | Does **not** handle business traffic — observes it | **Is** the business traffic system |
| Users | Operators and admins | Students (ages 6–12), teachers, parents |
| Unit of concern | Service health, call graphs, counter deltas | Student learning progress, question sessions, reward state |

**Verdict:** The intent is fundamentally different. LiveGatewayView watches a platform; MathQuest
*is* the platform. This shapes every downstream comparison.

---

## 2. Control Plane vs. Data Plane Separation

### LiveGatewayView model
Strict separation:
- **Data plane** — client requests flow through API Gateway to downstream services
- **Control plane** — LiveGatewayView polls, synthesizes, and surfaces operational state without intercepting any request

The control plane never touches a request; it only observes artifacts (health endpoints, metrics).

### MathQuest current design
The Core App is a **hybrid** — it handles both:
- **Control-adjacent functions** — module registry, token validation, Blueprint health tracking, RewardEvent processing
- **Data functions** — auth requests, user profile reads, game session routing

There is no external system to observe passively. MathQuest *is* the system being used.

### Deliberate deviation
MathQuest does not separate control and data planes **because there is nothing to observe passively**.
The modules are in-process Flask Blueprints, not external services reachable over a network.
The core must handle requests to be useful.

### Where the separation *does* partially apply
The module registry subsystem (`core/registry.py`) behaves like a lightweight control plane element:
- It reads module state at startup
- It does not serve game sessions itself
- It produces a health snapshot consumed by operators

This is the closest analogy to LiveGatewayView's role, scoped to the module system rather than to
the full application.

**Future evolution:** if modules are extracted to separate microservices (e.g., `italiano.verbi`
runs as a dedicated service), the separation becomes mandatory and the LiveGatewayView model
becomes directly applicable. The `GET /api/v1/modules/health` endpoint is already designed with
that future in mind.

---

## 3. Polling-Based Heartbeat and Synthesized Snapshot

### LiveGatewayView model
- A configurable heartbeat cycle polls `/health/*` and `/metrics/*` across all observed services
- Each cycle computes counter deltas and infers directional call events
- Output: a single synthesized snapshot consumed by all UI and API clients

### MathQuest current design
No heartbeat. No polling loop. State is computed **on-demand per HTTP request**.

The equivalent of the snapshot does exist, but it is **request-driven** rather than
**timer-driven**:

| LiveGatewayView snapshot field | MathQuest equivalent | Computed when |
|---|---|---|
| `nodes` (services + status) | Active module list + health status | `GET /api/v1/modules/health` |
| `edges` (inferred call paths) | RewardEvent flow (module → core) | Implicit; no inter-module calls |
| `recent_calls` (derived events) | Session answer log per user | `GET /api/v1/modules/<id>/stats` |
| `stats` (aggregated counters) | Per-fact accuracy, streak, XP | Per-user profile and module stats |
| `warnings` (degraded states) | Broken Blueprint import logs | `GET /api/v1/modules/health` |

### Why polling is not appropriate here
LiveGatewayView polls because its subjects are **external processes** that may fail independently
at any time, producing signal between observations. Polling is the correct mechanism when you
cannot instrument the subjects directly.

MathQuest's modules are in-process Blueprints. Their health is binary at startup (registered or
not) and does not drift during runtime. A background polling loop would produce no new information
after boot.

### Snapshot abstraction: reused with scope reduction
The **concept** of a single synthesized operational snapshot is reused, but:
- It is scoped to the module system (not the full student session)
- It is computed lazily (on request) rather than eagerly (on heartbeat)
- It is not the primary abstraction boundary for UI consumers — student progress state is

**Intentional reuse:** `GET /api/v1/modules/health` is a direct structural analog to
LiveGatewayView's synthesized snapshot. It produces nodes (modules), status (registered/broken/
pending), and warnings (import failures) in a single response.

**Intentional deviation:** student-facing API consumers do not consume a single snapshot. Each
route serves a specific slice of state (progress, stats, session). This matches the product's
user-facing nature — a student needs their own state, not a platform-wide operational view.

---

## 4. Degraded State and Partial Failure

### LiveGatewayView model
Service health is computed from a combination of health checks, metrics, and probe outcomes.
Partial failures produce a "degraded" state — not healthy, not dead.

### MathQuest mapping
The same concept applies to modules:

| Condition | LiveGatewayView | MathQuest |
|---|---|---|
| Fully healthy | All probes pass | Blueprint registered, routes responding |
| Degraded | Partial probe failure | Blueprint registered but DB migration incomplete |
| Broken | Health check fails | Blueprint import failed (logged, not silent) |
| Pending | N/A | Token inserted, `pending_restart=True`, not yet registered |

**Pattern reused directly.** The registry's health response uses the same four-state vocabulary.
`GET /api/v1/modules/health` returns one of `registered`, `broken`, `pending_restart`, or
`degraded` per module.

The `degraded` state (registered but partially functional) covers the case where a module's
Blueprint loaded but its DB tables failed to initialize — the module exists on the routing table
but cannot serve requests correctly.

---

## 5. Observer Pattern vs. Participant Pattern

### LiveGatewayView
Pure observer. It never modifies the platform it watches. Changes made through its admin API
(heartbeat reconfiguration) affect LiveGatewayView's own behavior, not the downstream services.

### MathQuest
Pure participant. The core app does not observe an external system — it **is** the system.
The RewardEvent flow is not observation; it is active state mutation (updating wallets, streaks,
badges in response to user actions).

**No analogy here.** MathQuest cannot and should not replicate the observer pattern.
It would only make sense if MathQuest grew into a platform that managed multiple deployable
educational services externally.

---

## 6. API and Operations Model

| Feature | LiveGatewayView | MathQuest |
|---|---|---|
| API style | REST/JSON | REST/JSON (same) |
| Versioning | Not described | `/api/v1/` prefix; breaking changes → `/api/v2/` |
| Read-only mode | View mode | Student role (cannot modify other users' state) |
| Admin/control mode | Admin mode (heartbeat config) | Teacher role (class management) + operator (module activation) |
| Runtime config | Heartbeat interval | Module token activation (pending restart) |
| Introspection | Platform/spec endpoints | Module manifest endpoint |

**Patterns reused:**
- REST/JSON — same
- View/admin mode distinction → student/teacher role separation
- Platform introspection (`/spec`, `/manifest`) → `GET /api/v1/modules/<id>/manifest`

**Key difference on runtime control:**
LiveGatewayView's admin actions (changing heartbeat) take effect immediately without restart.
MathQuest module activation requires a restart. This is a weaker operational model but is
acceptable because module additions are infrequent (unlike tuning a polling interval, which
may happen operationally).

---

## 7. Observability Requirements

### LiveGatewayView approach
- Intentionally avoids packet capture and span-level distributed tracing
- Favors low overhead and operational clarity
- Counter delta inference provides directional signal without full trace detail

### MathQuest approach
- No inter-service communication exists yet — nothing to trace between services
- Per-request DB writes provide sufficient audit trail for student progress
- Module health logging covers the operational observability need

**Pattern reused:** the bias toward low overhead and operational clarity over forensic detail.
MathQuest does not need distributed tracing at current scale and architecture.

**Where this diverges in the future:** if modules become microservices, request tracing between
core (API gateway role) and modules (downstream services) becomes necessary. At that point,
LiveGatewayView's counter-delta model could be applied to infer module call patterns without
full span tracing — the same trade-off LiveGatewayView makes for its downstream services.

---

## 8. Summary: Reuse, Deviation, and Evolution

### Patterns directly reused
| Pattern | LiveGatewayView origin | MathQuest application |
|---|---|---|
| Synthesized health snapshot | Core abstraction for UI/API consumers | `GET /api/v1/modules/health` |
| Four-state service health | healthy / degraded / dead / (implicit) | registered / degraded / broken / pending_restart |
| View mode + admin mode | Operational access tiers | student / teacher / operator roles |
| Platform introspection | `/spec` endpoints | `GET /api/v1/modules/<id>/manifest` |
| Low-overhead observability | Counter deltas, no packet capture | No tracing, per-request DB writes only |
| Single operational map | Snapshot as primary API boundary | Module health response as operator boundary |

### Patterns intentionally avoided
| Pattern | Reason for avoidance |
|---|---|
| Polling heartbeat | Modules are in-process; no network boundary to poll across |
| Separate observer service | No external services to observe; single-process app |
| Snapshot as primary UI abstraction | Students need per-user state slices, not a platform-wide view |
| Distributed tracing | No inter-service communication; single process |
| Counter delta inference | No cross-module calls to infer; direct DB writes are authoritative |

### Evolution path where LiveGatewayView model becomes directly applicable
If MathQuest evolves to:
1. Extract modules as independent microservices (separate processes, network-callable)
2. Add a teacher-facing platform dashboard showing aggregate student activity across modules
3. Introduce inter-module communication (e.g., cross-subject progress unlocking)

…then:
- The core app takes on a LiveGatewayView-like control plane role
- A heartbeat/polling model for module health becomes appropriate
- The synthesized snapshot becomes the primary abstraction for the teacher dashboard
- Counter delta inference can surface call patterns between modules without full tracing

The current architecture is designed to make this transition **possible without a rewrite**:
`GET /api/v1/modules/health` and the module manifest system are already the right shape —
they just don't need a polling loop yet.

---

## 9. Architectural Position Statement

MathQuest is a **product application**, not an observability tool. It cannot replicate the
data/control plane separation of LiveGatewayView because it has no external system to observe —
it is the system.

The LiveGatewayView reference is most valuable as:
- A vocabulary source (snapshot, degraded state, view/admin mode)
- A future evolution template (if modules become microservices)
- A reminder to keep the operational surface area low and explicit (`modules/health`,
  module manifests) rather than building full observability infrastructure prematurely

The single most important structural borrowing is the **health snapshot pattern**:
one endpoint that synthesizes all module states into a single operational map,
consumed by operators rather than students. This is `GET /api/v1/modules/health`,
and it follows LiveGatewayView's snapshot abstraction directly.
