const Journey = (() => {
    const PLANET_ORDER = [2, 5, 10, 3, 4, 6, 9, 7, 8];
    const PLANET_NAMES = {
        2:'Duo', 5:'Cinque', 10:'Decima', 3:'Trio',
        4:'Quadra', 6:'Hexa', 9:'Nova', 7:'Septem', 8:'Octo'
    };

    let _serverProgress = null;

    async function init() {
        if (Guest.isLoggedIn()) {
            try {
                _serverProgress = await API.get('/user/progress');
                // Sync nav coins
                if (_serverProgress.wallet) {
                    document.getElementById('coin-value').textContent =
                        _serverProgress.wallet.coins || 0;
                }
            } catch (e) {
                _serverProgress = null;
            }
        }
        render('planet-path');
        updateNavProgress();
    }

    function getUnlocked() {
        if (_serverProgress) return _serverProgress.planets_unlocked || [];
        return Guest.load().planets_unlocked;
    }

    function stateOf(table) {
        const unlocked = getUnlocked();
        const idx = PLANET_ORDER.indexOf(table);
        if (unlocked.includes(table)) return 'mastered';
        if (idx === 0 || unlocked.includes(PLANET_ORDER[idx - 1])) return 'available';
        return 'locked';
    }

    function render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        PLANET_ORDER.forEach((table, i) => {
            // Connector line before each planet (except first)
            if (i > 0) {
                const prev  = PLANET_ORDER[i - 1];
                const conn  = document.createElement('div');
                const bothUnlocked = getUnlocked().includes(table) || getUnlocked().includes(prev);
                conn.className = 'planet-connector' + (bothUnlocked ? ' planet-connector--unlocked' : '');
                container.appendChild(conn);
            }

            const state = stateOf(table);
            const node  = document.createElement('div');
            node.className = 'planet-node';
            node.dataset.table = table;
            node.dataset.state = state;
            node.dataset.index = i;
            node.setAttribute('aria-label', `Tabella del ${table} — ${state}`);

            node.innerHTML = `
                <span class="planet-node__number">${table}</span>
                <span class="planet-node__name">${PLANET_NAMES[table]}</span>
                ${state === 'mastered' ? '<span class="planet-node__badge">★</span>' : ''}
                ${state === 'locked'   ? '<span class="planet-node__badge">🔒</span>' : ''}
            `;

            if (state !== 'locked') {
                node.addEventListener('click', () => openPlanetMenu(table, state));
            }

            container.appendChild(node);
        });
    }

    function openPlanetMenu(table, state) {
        Modal.open('planet-menu', { table, state });
    }

    function updateNavProgress() {
        const unlocked = getUnlocked().length;
        const navEl    = document.getElementById('nav-progress');
        if (navEl) {
            navEl.innerHTML = `
                <span style="font-size:var(--text-sm);color:var(--c-text-dim)">
                    🪐 ${unlocked}/${PLANET_ORDER.length} pianeti
                </span>`;
        }
    }

    // Called after a game session unlocks a new planet
    function onPlanetUnlocked(table) {
        if (!Guest.isLoggedIn()) {
            // already applied in Guest.applyReward
        }
        render('planet-path');
        updateNavProgress();
        // Celebration pulse on the newly unlocked node
        setTimeout(() => {
            const node = document.querySelector(`.planet-node[data-table="${table}"]`);
            if (node) {
                node.style.animation = 'none';
                void node.offsetWidth;
                node.style.animation = '';
            }
        }, 100);
    }

    // Profile heatmap rendering
    async function renderHeatmap(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let data;
        try {
            data = await API.get('/user/heatmap');
        } catch {
            container.innerHTML = '<p style="color:var(--c-text-dim)">Nessun dato disponibile</p>';
            return;
        }

        const tables = [2, 5, 10, 3, 4, 6, 9, 7, 8];
        const mults  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        container.innerHTML = '';

        // Column headers
        const headerRow = document.createElement('div');
        headerRow.className = 'heatmap-row heatmap-header';
        headerRow.innerHTML = '<div class="heatmap-label"></div>' +
            mults.map(m => `<div class="heatmap-cell heatmap-header-cell">×${m}</div>`).join('');
        container.appendChild(headerRow);

        for (const t of tables) {
            const row = document.createElement('div');
            row.className = 'heatmap-row';

            const label = document.createElement('div');
            label.className = 'heatmap-label';
            label.textContent = `${t}×`;
            row.appendChild(label);

            for (const m of mults) {
                const key  = `${t}_${m}`;
                const fact = data.facts[key];
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                cell.title = fact
                    ? `${t}×${m}=${t*m}: ${fact.accuracy}% (${fact.attempts} tentativi)`
                    : `${t}×${m}=${t*m}: mai praticato`;
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

    return { init, render, stateOf, onPlanetUnlocked, renderHeatmap, PLANET_ORDER };
})();

document.addEventListener('DOMContentLoaded', Journey.init);
