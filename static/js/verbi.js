/**
 * verbi.js — Logica frontend per la sezione Verbi Italiani
 *
 * Moduli:
 *   VerbSession   – gestisce la sessione di esercizi (carica dal server, avanza)
 *   MorphRenderer – color-coding morfologico radice/desinenza/soggetto
 *   VerbTransform – animazione di "trasformazione" per verbi irregolari
 *   FeedbackUI    – feedback visivo con spiegazione errore
 *   BadgeUI       – toast e griglia badge
 *   ErrorManager  – visualizza i Mostriciattoli
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// COSTANTI
// ─────────────────────────────────────────────────────────────────────────────
const TEMPO_LABELS = {
  presente:        "Presente",
  imperfetto:      "Imperfetto",
  futuro_semplice: "Futuro semplice",
};

const MODO_LABELS = {
  indicativo:    "Indicativo",
  congiuntivo:   "Congiuntivo",
  condizionale:  "Condizionale",
};

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
const stato = {
  livello:       "base",
  utente_id:     1,
  esercizi:      [],
  indice:        0,
  inizioEsercizio: null,
  inizioSessione:  null,
  risultati:     [],
};

// ─────────────────────────────────────────────────────────────────────────────
// MORPH RENDERER
// ─────────────────────────────────────────────────────────────────────────────
const MorphRenderer = {
  /**
   * Ritorna HTML con radice e desinenza colorati.
   * @param {string} radice
   * @param {string} desinenza
   * @param {boolean} isIrregular
   */
  renderForma(radice, desinenza, isIrregular = false) {
    const cls = isIrregular ? " verbo-irregolare" : "";
    if (!radice && !desinenza) return "";
    return `<span class="morph-wrap${cls}">` +
      (radice    ? `<span class="morph-radice">${radice}</span>`       : "") +
      (desinenza ? `<span class="morph-desinenza">${desinenza}</span>` : "") +
      `</span>`;
  },

  /**
   * Colora il soggetto nella frase di esercizio.
   * @param {string} soggetto – es. "noi"
   */
  renderSoggetto(soggetto) {
    return `<span class="morph-soggetto">${soggetto}</span>`;
  },

  /**
   * Colora verbo + soggetto in una frase completa.
   * Usato nel feedback per mostrare la frase corretta.
   */
  renderFrase(soggetto, radice, desinenza, isIrregular = false) {
    return `${this.renderSoggetto(soggetto)} ${this.renderForma(radice, desinenza, isIrregular)}`;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// VERB TRANSFORM — animazione irregolari
// ─────────────────────────────────────────────────────────────────────────────
const VerbTransform = {
  /**
   * Anima la trasformazione dall'infinito alla forma coniugata.
   * @param {HTMLElement} el – elemento contenitore
   * @param {string} infinito
   * @param {object} esercizio – {forma, radice, desinenza, isIrregular}
   */
  async animaTransformazione(el, infinito, esercizio) {
    if (!esercizio.isIrregular) {
      el.innerHTML = MorphRenderer.renderForma(
        esercizio.radice, esercizio.desinenza, false
      );
      return;
    }

    // Fase 1: mostra l'infinito
    el.textContent = infinito;
    el.classList.add("trasformazione-out");
    await _wait(380);

    // Fase 2: mostra la forma coniugata con coloring irregolare
    el.classList.remove("trasformazione-out");
    el.innerHTML = MorphRenderer.renderForma(
      esercizio.radice, esercizio.desinenza, true
    );
    el.classList.add("trasformazione-in");
    await _wait(450);
    el.classList.remove("trasformazione-in");
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK UI
// ─────────────────────────────────────────────────────────────────────────────
const FeedbackUI = {
  mostra(corretta, spiegazione, rispostaCorretta) {
    const box = document.getElementById("feedback-box");
    if (!box) return;

    box.className = "feedback-box visible " + (corretta ? "ok" : "ko");

    if (corretta) {
      box.innerHTML = `
        <span class="feedback-emoji">✅</span>
        <span class="feedback-titolo">Esatto!</span>
        <span class="feedback-testo">Ottimo lavoro!</span>`;
    } else if (spiegazione) {
      box.innerHTML = `
        <span class="feedback-emoji">${spiegazione.emoji || "⚠️"}</span>
        <span class="feedback-titolo">${spiegazione.messaggio}</span>
        <span class="feedback-testo">${spiegazione.suggerimento}</span>
        <span class="feedback-testo" style="margin-top:8px;display:block">
          Risposta corretta: <strong>${rispostaCorretta}</strong>
        </span>`;
    } else {
      box.innerHTML = `
        <span class="feedback-emoji">❌</span>
        <span class="feedback-titolo">Non è giusto</span>
        <span class="feedback-testo">La risposta corretta è: <strong>${rispostaCorretta}</strong></span>`;
    }
  },

  nascondi() {
    const box = document.getElementById("feedback-box");
    if (box) { box.className = "feedback-box"; box.innerHTML = ""; }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BADGE UI
// ─────────────────────────────────────────────────────────────────────────────
const BadgeUI = {
  async mostraToast(badge) {
    let toast = document.getElementById("badge-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "badge-toast";
      toast.className = "badge-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = `🏆 Nuovo badge: ${badge.nome}`;
    toast.classList.add("show");
    await _wait(3500);
    toast.classList.remove("show");
  },

  async mostraNuoviBadge(nuoviBadge) {
    for (const b of nuoviBadge) {
      await this.mostraToast(b);
      await _wait(400);
    }
  },

  async caricaEMostra() { // utenteId is now derived from token
    const headers = {};
    if (isLoggedIn()) {
      Object.assign(headers, getAuthHeader());
    } else {
      // If not logged in, no badges to show or fetch
      const grid  = document.getElementById("badge-grid");
      if (grid) grid.innerHTML = `<p style="color:var(--v-muted);text-align:center;padding:32px">Effettua il login per vedere i tuoi badge.</p>`;
      return;
    }

    const res   = await fetch(`/api/verbi/badge`, { headers: headers });
    const data  = await res.json();
    const grid  = document.getElementById("badge-grid");
    if (!grid) return;

    const conquistati = new Set(data.badge.map(b => b.badge_id));

    const TUTTI_BADGE = [
      { id: "prima_stella",         nome: "⭐ Prima Stella",          desc: "Completa la tua prima sessione" },
      { id: "mago_presente",        nome: "🧙 Mago del Presente",     desc: "5 verbi al presente appresi" },
      { id: "esploratore_futuro",   nome: "🚀 Esploratore del Futuro",desc: "3 verbi al futuro appresi" },
      { id: "cacciatore_irregolari",nome: "🦁 Cacciatore di Irregolari", desc: "3 irregolari domati" },
    ];

    grid.innerHTML = TUTTI_BADGE.map(b => `
      <div class="badge-item ${conquistati.has(b.id) ? "conquistato" : "bloccato"}">
        <div class="badge-icon">${b.nome.split(" ")[0]}</div>
        <div class="badge-nome">${b.nome.slice(b.nome.indexOf(" ") + 1)}</div>
        <div style="font-size:0.75rem;color:#6b7280;margin-top:4px">${b.desc}</div>
      </div>
    `).join("");
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ERROR MANAGER UI (Mostriciattoli)
// ─────────────────────────────────────────────────────────────────────────────
const MostriciattolUI = {
  async caricaEMostra() { // utenteId is now derived from token
    const headers = {};
    if (isLoggedIn()) {
      Object.assign(headers, getAuthHeader());
    } else {
      // If not logged in, no mostriciattoli to show or fetch
      const cont = document.getElementById("mostriciattoli-list");
      if (cont) cont.innerHTML = `<p style="color:var(--v-muted);text-align:center;padding:32px">Effettua il login per vedere i tuoi mostriciattoli.</p>`;
      return;
    }

    const res  = await fetch(`/api/verbi/mostriciattoli`, { headers: headers });
    const data = await res.json();
    const cont = document.getElementById("mostriciattoli-list");
    if (!cont) return;

    if (!data.mostriciattoli.length) {
      cont.innerHTML = `<p style="color:var(--v-muted);text-align:center;padding:32px">
        Nessun mostriciattolo! Ottimo lavoro 🎉</p>`;
      return;
    }

    cont.innerHTML = data.mostriciattoli.map(m => `
      <div class="mostro-card">
        <div class="mostro-icon">👾</div>
        <div>
          <div class="mostro-verbo">${m.infinito} — ${MODO_LABELS[m.modo] || m.modo}, ${TEMPO_LABELS[m.tempo] || m.tempo}, ${m.persona}</div>
          <div class="mostro-info">Risposta corretta: <strong>${m.risposta_corretta}</strong></div>
        </div>
        <div class="mostro-count">×${m.n_errori}</div>
      </div>
    `).join("");
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSION MANAGER
// ─────────────────────────────────────────────────────────────────────────────
const VerbSession = {
  async carica(livello, n = 10) {
    let url = `/api/verbi/sessione?livello=${livello}&n=${n}`;
    const headers = {};
    if (isLoggedIn()) {
      Object.assign(headers, getAuthHeader());
      // utente_id is now extracted from the token on the backend
    } else {
      // For guest users, we might still need a default utente_id for SRS,
      // but the backend should handle it as a guest session (no saving).
      // For now, we'll rely on the backend's default if no token is provided.
    }

    const res  = await fetch(url, { headers: headers });
    const data = await res.json();
    stato.esercizi        = data.esercizi;
    stato.indice          = 0;
    stato.risultati       = [];
    stato.livello         = livello;
    // stato.utente_id is no longer directly set from frontend for logged-in users
    stato.inizioSessione  = Date.now();
    return data.esercizi;
  },

  esercizioCorrente() {
    return stato.esercizi[stato.indice] || null;
  },

  async inviaSoluzione(rispostaData, conSuggerimento = false) {
    const e       = this.esercizioCorrente();
    if (!e) return null;

    const tempoSec = (Date.now() - stato.inizioEsercizio) / 1000;

    // Confronto case-insensitive, spazi rimossi
    const normalizza = s => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
    const corretta   = normalizza(rispostaData) === normalizza(e.forma);

    const headers = { "Content-Type": "application/json" };
    if (isLoggedIn()) {
      Object.assign(headers, getAuthHeader());
    }

    const body = {
      infinito:        e.infinito,
      modo:            e.modo,
      tempo:           e.tempo,
      persona:         e.persona,
      risposta_data:   rispostaData,
      corretta,
      tempo_secondi:   tempoSec,
      con_suggerimento: conSuggerimento,
    };
    // utente_id is now extracted from the token on the backend

    const res  = await fetch("/api/verbi/risposta", {
      method:  "POST",
      headers: headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();

    stato.risultati.push({ esercizio: e, corretta, risposta: rispostaData, ...data });

    // Mostra badge nuovi (se presenti)
    if (data.nuovi_badge?.length) {
      await BadgeUI.mostraNuoviBadge(data.nuovi_badge);
    }

    return { corretta, spiegazione: data.spiegazione, esercizio: e };
  },

  avanza() {
    stato.indice++;
    stato.inizioEsercizio = Date.now();
    return stato.indice < stato.esercizi.length;
  },

  percentualeCompletata() {
    return Math.round((stato.indice / stato.esercizi.length) * 100);
  },

  riepilogo() {
    const corrette = stato.risultati.filter(r => r.corretta).length;
    return {
      totale:    stato.risultati.length,
      corrette,
      perc:      Math.round((corrette / stato.risultati.length) * 100),
      tempoTot:  (Date.now() - stato.inizioSessione) / 1000,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER UI — collega tutto al DOM
// ─────────────────────────────────────────────────────────────────────────────
async function avviaSessioneVerbi(livello) {
  _mostraSezione("sessione");
  await VerbSession.carica(livello); // utente_id is handled by backend
  stato.inizioEsercizio = Date.now();
  _renderEsercizio();
}

function _renderEsercizio() {
  const e = VerbSession.esercizioCorrente();
  if (!e) { _mostraRiepilogo(); return; }

  // Progresso
  const pct = VerbSession.percentualeCompletata();
  const bar = document.getElementById("v-progress-bar");
  if (bar) bar.style.width = pct + "%";

  const label = document.getElementById("v-progresso-label");
  if (label) label.textContent = `${stato.indice + 1} / ${stato.esercizi.length}`;

  // Soggetto
  const sogg = document.getElementById("v-soggetto");
  if (sogg) sogg.innerHTML = MorphRenderer.renderSoggetto(e.persona);

  // Verbo (con animazione per irregolari)
  const verboEl = document.getElementById("v-verbo-display");
  if (verboEl) {
    verboEl.innerHTML = "";
    VerbTransform.animaTransformazione(verboEl, e.infinito, e).then(() => {
      // badge irregolare
      if (e.isIrregular) {
        const badge = document.createElement("span");
        badge.className   = "badge-irregular";
        badge.textContent = "Irregolare";
        verboEl.appendChild(badge);
      }
    });
  }

  // Modo e tempo
  const contestoEl = document.getElementById("v-contesto");
  if (contestoEl) {
    contestoEl.textContent =
      `${MODO_LABELS[e.modo] || e.modo} — ${TEMPO_LABELS[e.tempo] || e.tempo}`;
  }

  // Input
  const input = document.getElementById("v-input");
  if (input) {
    input.value     = "";
    input.className = "v-input";
    input.focus();
  }

  FeedbackUI.nascondi();
  _setBtnStato("attesa");
}

async function confermaRispostaVerbi() {
  const btn = document.getElementById("btn-v-conferma");
  if (btn?.dataset.stato === "avanti") {
    if (VerbSession.avanza()) _renderEsercizio();
    else _mostraRiepilogo();
    return;
  }

  const input = document.getElementById("v-input");
  if (!input || !input.value.trim()) { input?.focus(); return; }

  const risposta = input.value.trim();
  const risultato = await VerbSession.inviaSoluzione(risposta);
  if (!risultato) return;

  const { corretta, spiegazione, esercizio } = risultato;

  input.className = "v-input " + (corretta ? "corretta" : "sbagliata");
  FeedbackUI.mostra(corretta, spiegazione, esercizio.forma);
  _setBtnStato("avanti");
}

function _mostraRiepilogo() {
  _mostraSezione("riepilogo");
  const ris = VerbSession.riepilogo();

  const numEl = document.getElementById("ris-punteggio");
  if (numEl) numEl.textContent = `${ris.corrette} / ${ris.totale}`;

  const percEl = document.getElementById("ris-perc");
  if (percEl) percEl.textContent = `${ris.perc}%`;

  const tempoEl = document.getElementById("ris-tempo");
  if (tempoEl) tempoEl.textContent = _formattaTempo(ris.tempoTot);

  // Carica mostriciattoli e badge aggiornati
  MostriciattolUI.caricaEMostra(stato.utente_id);
  BadgeUI.caricaEMostra(stato.utente_id);
}

function _mostraSezione(nome) {
  ["setup", "sessione", "riepilogo"].forEach(s => {
    const el = document.getElementById(`v-sezione-${s}`);
    if (el) el.style.display = s === nome ? "block" : "none";
  });
}

function _setBtnStato(s) {
  const btn = document.getElementById("btn-v-conferma");
  if (!btn) return;
  btn.dataset.stato = s;
  btn.textContent   = s === "avanti"
    ? (stato.indice + 1 < stato.esercizi.length ? "Prossimo →" : "Vedi risultato")
    : "Conferma";
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────
function _wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function _formattaTempo(sec) {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// Enter → conferma
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const sessione = document.getElementById("v-sezione-sessione");
    if (sessione && sessione.style.display !== "none") {
      confermaRispostaVerbi();
    }
  }
});
