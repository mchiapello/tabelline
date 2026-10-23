const Game = (() => {
    const MODE_LABELS = {
        explorer:     '🚀 Explorer',
        mission:      '📅 Missione del Giorno',
        speedrun:     '⚡ Speed Run',
        boss_battle:  '⚔️ Boss Battle',
        galaxy_cup:   '🏆 Galaxy Cup',
        custom:       '🎯 Allenamento libero',
    };

    let state = {
        mode: null, table: null,
        sessionId: null, sessionKey: null,
        questions: [], currentIdx: 0,
        answers: [],
        startTime: null, questionStartTime: null,
        timerId: null,
        finished: false,
        timerSec: 0, facilitato: false, numQuestions: 10, tables: [],
        questionTimerId: null, awaitingContinue: false,
    };

    async function start(mode, table, opts = {}) {
        const gs = Guest.load();
        state = {
            mode, table,
            sessionId: null,
            sessionKey: gs._sessionKey || crypto.randomUUID(),
            questions: [], currentIdx: 0, answers: [],
            startTime: Date.now(), questionStartTime: null,
            timerId: null, finished: false,
            timerSec:     opts.timerSec || 0,
            facilitato:   !!opts.facilitato,
            numQuestions: opts.numQuestions || 10,
            tables:       (opts.tables && opts.tables.length) ? opts.tables.map(Number) : [table],
            questionTimerId: null, awaitingContinue: false,
        };

        // Persist session key for guest continuity
        const updated = Guest.load();
        updated._sessionKey = state.sessionKey;
        Guest.save(updated);

        document.getElementById('game-mode-label').textContent =
            MODE_LABELS[mode] || mode;

        try {
            const payload = { mode, table, session_key: state.sessionKey };
            if (mode === 'custom') {
                payload.num_questions = state.numQuestions;
                payload.tables = state.tables;
            }

            const data = await API.post('/modules/moltiplicazioni/session/start', payload);
            state.sessionId = data.session_id;
            state.questions = data.questions;

            if (mode === 'speedrun') {
                startSpeedRunTimer(60);
            }

            renderFacilitatoPanel();
            renderQuestion();
        } catch (err) {
            showError('Impossibile avviare la sessione. Riprova.');
        }
    }

    function renderFacilitatoPanel() {
        const panel = document.getElementById('facilitato-panel');
        if (!panel) return;
        if (state.mode === 'custom' && state.facilitato) {
            const blocks = state.tables.map(t => {
                const rows = Array.from({ length: 10 }, (_, i) => i + 1)
                    .map(m => `<div class="facilitato-row">${t} × ${m} = ${t * m}</div>`)
                    .join('');
                const label = state.tables.length > 1 ? `Tabella del ${t}` : `📋 Tabella del ${t}`;
                return `<div class="facilitato-block">
                    ${state.tables.length > 1 ? `<div class="facilitato-subtitle">${label}</div>` : ''}
                    <div class="facilitato-rows">${rows}</div>
                </div>`;
            }).join('');

            panel.innerHTML = state.tables.length > 1
                ? `<div class="facilitato-title">📋 Tabelline</div>${blocks}`
                : blocks;
            panel.hidden = false;
        } else {
            panel.hidden = true;
            panel.innerHTML = '';
        }
    }

    function renderQuestion() {
        if (state.finished) return;
        if (state.currentIdx >= state.questions.length) {
            return finishSession();
        }

        const q = state.questions[state.currentIdx];
        document.getElementById('q-a').textContent = q.multiplicand;
        document.getElementById('q-b').textContent = q.multiplier;

        const ansEl = document.getElementById('q-answer-display');
        ansEl.textContent = '?';
        ansEl.className   = '';

        const inputEl = document.getElementById('answer-input');
        inputEl.value    = '';
        inputEl.disabled = false;
        document.getElementById('feedback-area').innerHTML = '';

        state.awaitingContinue = false;
        const continueBtn = document.getElementById('btn-continue');
        if (continueBtn) continueBtn.hidden = true;

        const total = state.questions.length;
        const done  = state.currentIdx;
        document.getElementById('progress-fill').style.width =
            total ? `${(done / total) * 100}%` : '0%';
        document.getElementById('progress-text').textContent =
            total ? `${done} / ${total}` : `${done}`;

        state.questionStartTime = Date.now();

        if (state.mode === 'custom' && state.timerSec > 0) {
            startQuestionTimer(state.timerSec);
        }

        // Auto-focus input (desktop); don't on mobile to avoid keyboard pop
        if (window.innerWidth > 640) {
            inputEl.focus();
        }
    }

    function startQuestionTimer(seconds) {
        const el = document.getElementById('game-timer');
        el.hidden = false;
        el.classList.remove('timer--urgent');
        let remaining = seconds;
        el.textContent = remaining;

        if (state.questionTimerId) clearInterval(state.questionTimerId);
        state.questionTimerId = setInterval(() => {
            remaining--;
            el.textContent = remaining;
            if (remaining <= 1) el.classList.add('timer--urgent');
            if (remaining <= 0) {
                clearInterval(state.questionTimerId);
                state.questionTimerId = null;
                handleTimeout();
            }
        }, 1000);
    }

    function clearQuestionTimer() {
        if (state.questionTimerId) {
            clearInterval(state.questionTimerId);
            state.questionTimerId = null;
        }
        if (state.mode === 'custom') {
            document.getElementById('game-timer').hidden = true;
        }
    }

    function handleTimeout() {
        if (state.finished || state.awaitingContinue ||
            state.currentIdx >= state.questions.length) return;
        submitAnswer(null);
    }

    async function submitAnswer(userAnswer) {
        if (state.finished || state.currentIdx >= state.questions.length ||
            state.awaitingContinue) return;

        clearQuestionTimer();

        const isTimeout    = userAnswer === null;
        const q            = state.questions[state.currentIdx];
        const response_ms  = Date.now() - state.questionStartTime;

        // Optimistic UI: disable input while request is in-flight
        const inputEl = document.getElementById('answer-input');
        inputEl.disabled = true;

        let result;
        try {
            result = await API.post('/modules/moltiplicazioni/session/answer', {
                session_id:     state.sessionId,
                question_index: state.currentIdx,
                multiplicand:   q.multiplicand,
                multiplier:     q.multiplier,
                user_answer:    userAnswer,
                response_ms,
            });
        } catch {
            inputEl.disabled = false;
            return;
        }

        state.answers.push({ is_correct: result.correct, response_ms });
        showFeedback(result, isTimeout);

        // Nav coin animation
        if (result.correct) {
            Rewards.playCorrect(result.coins_earned, result.xp_earned);
        }

        // Custom mode: on a wrong/timed-out answer, wait for an explicit
        // "Continua" press so the learner has time to reflect before moving on.
        if (state.mode === 'custom' && !result.correct) {
            state.awaitingContinue = true;
            const continueBtn = document.getElementById('btn-continue');
            continueBtn.hidden = false;
            continueBtn.onclick = () => {
                state.awaitingContinue = false;
                inputEl.disabled = false;
                state.currentIdx++;
                renderQuestion();
            };
            return;
        }

        const delay = result.correct ? 1200 : 2500;
        setTimeout(() => {
            inputEl.disabled = false;
            state.currentIdx++;
            renderQuestion();
        }, delay);
    }

    function showFeedback(result, isTimeout = false) {
        const feedbackEl = document.getElementById('feedback-area');
        const ansEl      = document.getElementById('q-answer-display');
        ansEl.textContent = result.correct_ans;

        if (result.correct) {
            feedbackEl.innerHTML =
                `<span class="feedback feedback--correct">✓</span>`;
            ansEl.className = 'answer--correct';
        } else {
            const label = isTimeout ? '⏱ Tempo scaduto' : '✗';
            feedbackEl.innerHTML =
                `<span class="feedback feedback--wrong">${label}</span>`;
            ansEl.className = 'answer--wrong';
            const area = document.getElementById('question-area');
            area.classList.add('shake');
            setTimeout(() => area.classList.remove('shake'), 500);
        }
    }

    function startSpeedRunTimer(seconds) {
        const el = document.getElementById('game-timer');
        el.hidden = false;
        let remaining = seconds;
        el.textContent = remaining;

        state.timerId = setInterval(() => {
            remaining--;
            el.textContent = remaining;
            if (remaining <= 10) el.classList.add('timer--urgent');
            if (remaining <= 0) {
                clearInterval(state.timerId);
                state.timerId = null;
                finishSession();
            }
        }, 1000);
    }

    async function finishSession() {
        if (state.finished) return;
        state.finished = true;

        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        clearQuestionTimer();

        // Hide game UI
        document.getElementById('question-area').hidden = true;
        document.getElementById('answer-area').hidden   = true;

        let result;
        try {
            result = await API.post('/modules/moltiplicazioni/session/finish', {
                session_id:  state.sessionId,
                session_key: state.sessionKey,
            });
        } catch {
            showError('Errore nel salvataggio della sessione.');
            return;
        }

        // Guest: apply reward to localStorage
        if (!Guest.isLoggedIn()) {
            Guest.applyReward(result.reward);
        }

        // Update nav coins
        const gs = Guest.load();
        document.getElementById('coin-value').textContent = gs.coins;

        // Show badge toasts
        Rewards.showSummary(result.reward, result.badge_names || {});

        // Re-render planet map if a planet was unlocked
        if (result.reward.planet_unlocked) {
            Journey.onPlanetUnlocked(result.reward.planet_unlocked);
        }

        showSummary(result);
    }

    function showSummary(result) {
        const el = document.getElementById('session-summary');
        const s  = result.score;
        const r  = result.reward;
        const stars = starsFromScore(s.score_pct);

        const badgeHtml = (r.badges_earned || [])
            .map(bid => {
                const name = (result.badge_names || {})[bid] || bid;
                return `<span class="badge-chip badge-chip--gold">🏅 ${name}</span>`;
            }).join('');

        el.innerHTML = `
            <h2 class="summary-title">
                ${s.passed ? '🎉 Completato!' : '💪 Allenati ancora!'}
            </h2>
            <div class="summary-score">${s.correct}/${s.total} — ${s.score_pct}%</div>
            <div class="summary-stars">
                ${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}
            </div>
            <div class="summary-rewards">
                +${r.coins} 🪙 &nbsp;|&nbsp; +${r.xp} XP
            </div>
            ${badgeHtml ? `<div class="summary-badges">${badgeHtml}</div>` : ''}
            <div class="summary-actions">
                <button class="btn btn--primary"
                    onclick="window.location.href='/journey'">
                    🗺️ Torna alla mappa
                </button>
                <button class="btn btn--secondary"
                    onclick="Game.start('${state.mode}', ${state.table}, {
                        timerSec: ${state.timerSec}, facilitato: ${state.facilitato},
                        numQuestions: ${state.numQuestions}, tables: ${JSON.stringify(state.tables)}
                    })">
                    🔄 Gioca ancora
                </button>
            </div>`;

        el.hidden = false;
    }

    function starsFromScore(pct) {
        if (pct >= 90) return 3;
        if (pct >= 70) return 2;
        return 1;
    }

    function showError(msg) {
        document.getElementById('feedback-area').innerHTML =
            `<span style="color:var(--c-coral)">${msg}</span>`;
    }

    function initInputHandlers() {
        const input = document.getElementById('answer-input');
        if (!input) return;

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 0) submitAnswer(val);
            }
        });

        document.querySelectorAll('.numpad-key').forEach(key => {
            key.addEventListener('click', () => {
                if (state.finished) return;
                const v = key.dataset.value;
                if (v === 'back') {
                    input.value = input.value.slice(0, -1);
                } else if (v === 'confirm') {
                    const val = parseInt(input.value, 10);
                    if (!isNaN(val) && val >= 0) submitAnswer(val);
                } else {
                    if (input.value.length < 3) input.value += v;
                }
            });
        });
    }

    return { start, initInputHandlers };
})();

document.addEventListener('DOMContentLoaded', Game.initInputHandlers);
