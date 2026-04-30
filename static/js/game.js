const Game = (() => {
    const MODE_LABELS = {
        explorer:     '🚀 Explorer',
        mission:      '📅 Missione del Giorno',
        speedrun:     '⚡ Speed Run',
        boss_battle:  '⚔️ Boss Battle',
        galaxy_cup:   '🏆 Galaxy Cup',
    };

    let state = {
        mode: null, table: null,
        sessionId: null, sessionKey: null,
        questions: [], currentIdx: 0,
        answers: [],
        startTime: null, questionStartTime: null,
        timerId: null,
        finished: false,
    };

    async function start(mode, table) {
        const gs = Guest.load();
        state = {
            mode, table,
            sessionId: null,
            sessionKey: gs._sessionKey || crypto.randomUUID(),
            questions: [], currentIdx: 0, answers: [],
            startTime: Date.now(), questionStartTime: null,
            timerId: null, finished: false,
        };

        // Persist session key for guest continuity
        const updated = Guest.load();
        updated._sessionKey = state.sessionKey;
        Guest.save(updated);

        document.getElementById('game-mode-label').textContent =
            MODE_LABELS[mode] || mode;

        try {
            const data = await API.post('/modules/moltiplicazioni/session/start', {
                mode, table, session_key: state.sessionKey
            });
            state.sessionId = data.session_id;
            state.questions = data.questions;

            if (mode === 'speedrun') {
                startSpeedRunTimer(60);
            }

            renderQuestion();
        } catch (err) {
            showError('Impossibile avviare la sessione. Riprova.');
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

        document.getElementById('answer-input').value = '';
        document.getElementById('feedback-area').innerHTML = '';

        const total = state.questions.length;
        const done  = state.currentIdx;
        document.getElementById('progress-fill').style.width =
            total ? `${(done / total) * 100}%` : '0%';
        document.getElementById('progress-text').textContent =
            total ? `${done} / ${total}` : `${done}`;

        state.questionStartTime = Date.now();

        // Auto-focus input (desktop); don't on mobile to avoid keyboard pop
        if (window.innerWidth > 640) {
            document.getElementById('answer-input').focus();
        }
    }

    async function submitAnswer(userAnswer) {
        if (state.finished || state.currentIdx >= state.questions.length) return;

        const q           = state.questions[state.currentIdx];
        const response_ms = Date.now() - state.questionStartTime;

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
        showFeedback(result);

        // Nav coin animation
        if (result.correct) {
            Rewards.playCorrect(result.coins_earned, result.xp_earned);
        }

        const delay = result.correct ? 1200 : 2500;
        setTimeout(() => {
            inputEl.disabled = false;
            state.currentIdx++;
            renderQuestion();
        }, delay);
    }

    function showFeedback(result) {
        const feedbackEl = document.getElementById('feedback-area');
        const ansEl      = document.getElementById('q-answer-display');
        ansEl.textContent = result.correct_ans;

        if (result.correct) {
            feedbackEl.innerHTML =
                `<span class="feedback feedback--correct">✓</span>`;
            ansEl.className = 'answer--correct';
        } else {
            feedbackEl.innerHTML =
                `<span class="feedback feedback--wrong">✗</span>`;
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
                    onclick="Game.start('${state.mode}', ${state.table})">
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
