const Rewards = (() => {
    function playCorrect(coins, xp) {
        // Floating +coins text
        const feedbackEl = document.getElementById('feedback-area');
        if (feedbackEl && coins > 0) {
            const floater = document.createElement('div');
            floater.className = 'reward-floater';
            floater.textContent = `+${coins} 🪙`;
            floater.style.position = 'relative';
            feedbackEl.appendChild(floater);
            setTimeout(() => floater.remove(), 1200);
        }

        // Animate nav coin counter
        const counterEl = document.getElementById('coin-value');
        if (counterEl && coins > 0) {
            const current = parseInt(counterEl.textContent, 10) || 0;
            animateCounter(counterEl, current, current + coins, 600);
        }
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
        const root  = document.getElementById('toast-root');
        if (!root) return;
        const toast = document.createElement('div');
        toast.className = 'toast toast--badge';
        toast.innerHTML = `🏅 Nuovo badge: <strong>${badgeName}</strong>`;
        root.appendChild(toast);
        // Trigger transition
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('toast--visible'));
        });
        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    function showSummary(reward, badgeNames) {
        const names = badgeNames || {};
        (reward.badges_earned || []).forEach((bid, i) => {
            const name = names[bid] || bid;
            setTimeout(() => showBadgeToast(bid, name), 500 + i * 600);
        });
    }

    return { playCorrect, showBadgeToast, showSummary, animateCounter };
})();
