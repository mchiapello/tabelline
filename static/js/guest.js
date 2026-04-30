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
        if (reward.streak_activity) {
            const today = new Date().toISOString().split('T')[0];
            if (s.last_practice_date !== today) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                s.streak_days = (s.last_practice_date === yesterday) ? s.streak_days + 1 : 1;
                s.last_practice_date = today;
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
