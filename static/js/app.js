// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
const state = {
  modalita: null,           // 'training' | 'verifica'
  domande: [],
  indiceDomanda: 0,
  risposte: [],
  timerPerDomanda: 0,       // 0 = nessun timer
  timerInterval: null,
  tempoRimanente: 0,
  inizioSessione: null,
  inizioDomanda: null,
  numDomande: 20,
};

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGAZIONE TRA VISTE
// ─────────────────────────────────────────────────────────────────────────────
function mostraVista(nome) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("view-" + nome).classList.add("active");
  document.getElementById("nav-" + nome).classList.add("active");
  if (nome === "stats") caricaStatistiche();
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERAZIONE DOMANDE
// ─────────────────────────────────────────────────────────────────────────────
function generaDomande(n, daMin, daMax, perMin, perMax) {
  // Costruisce il pool di tutte le combinazioni possibili (senza ripetizioni)
  const pool = [];
  for (let a = daMin; a <= daMax; a++) {
    for (let b = perMin; b <= perMax; b++) {
      pool.push({ a, b, risposta: a * b });
    }
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Se n > pool disponibile, permette ripetizioni completando con un secondo giro
  if (n <= pool.length) return pool.slice(0, n);

  const domande = [...pool];
  while (domande.length < n) {
    const extra = [...pool];
    for (let i = extra.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [extra[i], extra[j]] = [extra[j], extra[i]];
    }
    domande.push(...extra);
  }
  return domande.slice(0, n);
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAINING — AVVIO
// ─────────────────────────────────────────────────────────────────────────────
function avviaTraining() {
  const n = parseInt(document.getElementById("training-num").value) || 10;
  state.modalita = "training";
  state.numDomande = n;
  state.domande = generaDomande(n, 2, 10, 2, 10);
  state.indiceDomanda = 0;
  state.risposte = [];
  state.timerPerDomanda = 0;
  state.inizioSessione = Date.now();

  document.getElementById("training-setup").style.display = "none";
  document.getElementById("training-sessione").style.display = "block";
  document.getElementById("training-risultato").style.display = "none";

  mostraDomandaTraining();
}

function mostraDomandaTraining() {
  const d = state.domande[state.indiceDomanda];
  const tot = state.domande.length;
  const idx = state.indiceDomanda;

  document.getElementById("tr-progresso-label").textContent = `${idx + 1} / ${tot}`;
  document.getElementById("tr-progresso-bar").style.width = `${(idx / tot) * 100}%`;

  document.getElementById("tr-moltiplicazione").innerHTML =
    `<span>${d.a}</span> <span class="operatori">×</span> <span>${d.b}</span> <span class="operatori">=</span>`;

  const input = document.getElementById("tr-risposta-input");
  input.value = "";
  input.className = "risposta-input";
  input.focus();

  document.getElementById("tr-feedback").textContent = "";
  document.getElementById("tr-feedback").className = "feedback-msg";
  document.getElementById("tr-hint").className = "hint-risposta";
  document.getElementById("tr-hint").textContent = "";
  document.getElementById("btn-tr-conferma").textContent = "Conferma";
  document.getElementById("btn-tr-conferma").dataset.stato = "attesa";

  state.inizioDomanda = Date.now();
}

function confermaTraining() {
  const btn = document.getElementById("btn-tr-conferma");
  if (btn.dataset.stato === "avanti") {
    state.indiceDomanda++;
    if (state.indiceDomanda >= state.domande.length) {
      terminaSessione();
    } else {
      mostraDomandaTraining();
    }
    return;
  }

  const d = state.domande[state.indiceDomanda];
  const input = document.getElementById("tr-risposta-input");
  const valore = parseInt(input.value);
  const tempo = (Date.now() - state.inizioDomanda) / 1000;

  if (isNaN(valore)) { input.focus(); return; }

  const corretta = valore === d.risposta;

  state.risposte.push({
    moltiplicando: d.a,
    moltiplicatore: d.b,
    risposta_corretta: d.risposta,
    risposta_utente: valore,
    tempo_secondi: tempo,
    corretta,
  });

  const feedback = document.getElementById("tr-feedback");
  const hint = document.getElementById("tr-hint");
  input.className = "risposta-input " + (corretta ? "corretta" : "sbagliata");

  if (corretta) {
    feedback.textContent = "✓ Esatto!";
    feedback.className = "feedback-msg corretta";
    hint.className = "hint-risposta";
  } else {
    feedback.textContent = "✗ Sbagliato";
    feedback.className = "feedback-msg sbagliata";
    hint.textContent = `La risposta corretta è: ${d.a} × ${d.b} = ${d.risposta}`;
    hint.className = "hint-risposta sbagliata";
  }

  btn.textContent = state.indiceDomanda + 1 < state.domande.length ? "Prossima →" : "Vedi risultato";
  btn.dataset.stato = "avanti";
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICA — AVVIO
// ─────────────────────────────────────────────────────────────────────────────
function avviaVerifica() {
  const timer = parseInt(document.getElementById("ver-timer").value) || 0;
  state.modalita = "verifica";
  state.numDomande = 20;
  state.domande = generaDomande(20, 2, 10, 2, 10);
  state.indiceDomanda = 0;
  state.risposte = [];
  state.timerPerDomanda = timer;
  state.inizioSessione = Date.now();

  document.getElementById("verifica-setup").style.display = "none";
  document.getElementById("verifica-sessione").style.display = "block";
  document.getElementById("verifica-risultato").style.display = "none";

  mostraDomandaVerifica();
}

function mostraDomandaVerifica() {
  const d = state.domande[state.indiceDomanda];
  const tot = state.domande.length;
  const idx = state.indiceDomanda;

  document.getElementById("ver-progresso-label").textContent = `${idx + 1} / ${tot}`;
  document.getElementById("ver-progresso-bar").style.width = `${(idx / tot) * 100}%`;

  document.getElementById("ver-moltiplicazione").innerHTML =
    `<span>${d.a}</span> <span class="operatori">×</span> <span>${d.b}</span> <span class="operatori">=</span>`;

  const input = document.getElementById("ver-risposta-input");
  input.value = "";
  input.className = "risposta-input";
  input.focus();

  document.getElementById("ver-feedback").textContent = "";
  document.getElementById("ver-feedback").className = "feedback-msg";

  // Timer
  stopTimer();
  if (state.timerPerDomanda > 0) {
    state.tempoRimanente = state.timerPerDomanda;
    aggiornaDisplayTimer();
    state.timerInterval = setInterval(tickTimer, 1000);
    document.getElementById("ver-timer-display").classList.remove("hidden");
  } else {
    document.getElementById("ver-timer-display").classList.add("hidden");
  }

  state.inizioDomanda = Date.now();
}

function tickTimer() {
  state.tempoRimanente--;
  aggiornaDisplayTimer();
  if (state.tempoRimanente <= 0) {
    stopTimer();
    tempoScaduto();
  }
}

function aggiornaDisplayTimer() {
  const el = document.getElementById("ver-timer-display");
  el.textContent = `⏱ ${state.tempoRimanente}s`;
  el.className = "timer-display";
  if (state.tempoRimanente <= 3) el.classList.add("danger");
  else if (state.tempoRimanente <= Math.ceil(state.timerPerDomanda * 0.4)) el.classList.add("warning");
}

function tempoScaduto() {
  const d = state.domande[state.indiceDomanda];
  const tempo = state.timerPerDomanda;

  state.risposte.push({
    moltiplicando: d.a,
    moltiplicatore: d.b,
    risposta_corretta: d.risposta,
    risposta_utente: null,
    tempo_secondi: tempo,
    corretta: false,
  });

  const feedback = document.getElementById("ver-feedback");
  feedback.textContent = `⏰ Tempo scaduto! La risposta era ${d.risposta}`;
  feedback.className = "feedback-msg sbagliata";

  setTimeout(() => avanzaVerifica(), 1200);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function confermaVerifica() {
  const d = state.domande[state.indiceDomanda];
  const input = document.getElementById("ver-risposta-input");
  const valore = parseInt(input.value);
  const tempo = (Date.now() - state.inizioDomanda) / 1000;

  if (isNaN(valore)) { input.focus(); return; }

  stopTimer();

  const corretta = valore === d.risposta;

  state.risposte.push({
    moltiplicando: d.a,
    moltiplicatore: d.b,
    risposta_corretta: d.risposta,
    risposta_utente: valore,
    tempo_secondi: tempo,
    corretta,
  });

  const feedback = document.getElementById("ver-feedback");
  input.className = "risposta-input " + (corretta ? "corretta" : "sbagliata");

  if (corretta) {
    feedback.textContent = "✓ Corretto!";
    feedback.className = "feedback-msg corretta";
  } else {
    feedback.textContent = `✗ Era ${d.risposta}`;
    feedback.className = "feedback-msg sbagliata";
  }

  setTimeout(() => avanzaVerifica(), 700);
}

function avanzaVerifica() {
  state.indiceDomanda++;
  if (state.indiceDomanda >= state.domande.length) {
    terminaSessione();
  } else {
    mostraDomandaVerifica();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FINE SESSIONE
// ─────────────────────────────────────────────────────────────────────────────
async function terminaSessione() {
  stopTimer();
  const tempoTotale = (Date.now() - state.inizioSessione) / 1000;
  const corrette = state.risposte.filter(r => r.corretta).length;
  const tot = state.risposte.length;
  const perc = Math.round((corrette / tot) * 100);

  // Salva nel DB
  try {
    await fetch("/api/salva-verifica", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modalita: state.modalita,
        totale_domande: tot,
        risposte_corrette: corrette,
        tempo_totale: tempoTotale,
        timer_per_domanda: state.timerPerDomanda || null,
        risposte: state.risposte,
      }),
    });
  } catch (e) {
    console.error("Errore salvataggio:", e);
  }

  // Mostra risultato
  if (state.modalita === "training") {
    mostraRisultatoTraining(corrette, tot, perc, tempoTotale);
  } else {
    mostraRisultatoVerifica(corrette, tot, perc, tempoTotale);
  }
}

function livelloPunteggio(perc) {
  if (perc >= 90) return "ottimo";
  if (perc >= 70) return "buono";
  if (perc >= 50) return "scarso";
  return "critico";
}

function votoTesto(perc) {
  if (perc >= 90) return "🌟 Eccellente!";
  if (perc >= 70) return "👍 Bravo!";
  if (perc >= 50) return "📚 Continua a studiare";
  return "💪 Allenati ancora!";
}

function renderListaRisposte(contenitoreId) {
  const ul = document.getElementById(contenitoreId);
  ul.innerHTML = "";
  state.risposte.forEach(r => {
    const li = document.createElement("li");
    li.className = r.corretta ? "corretta" : "sbagliata";
    const rispTesto = r.risposta_utente !== null ? r.risposta_utente : "—";
    li.innerHTML = `
      <div class="operazione">${r.moltiplicando} × ${r.moltiplicatore} = ${r.risposta_corretta}</div>
      <div class="tua-risposta">Tu: ${rispTesto}</div>
    `;
    ul.appendChild(li);
  });
}

function mostraRisultatoTraining(corrette, tot, perc, tempoTotale) {
  document.getElementById("training-sessione").style.display = "none";
  document.getElementById("training-risultato").style.display = "block";

  const livello = livelloPunteggio(perc);
  document.getElementById("tr-cerchio").className = `punteggio-cerchio ${livello}`;
  document.getElementById("tr-punteggio-num").textContent = corrette;
  document.getElementById("tr-punteggio-tot").textContent = `/ ${tot}`;
  document.getElementById("tr-voto-testo").textContent = votoTesto(perc);
  document.getElementById("tr-tempo").textContent = `Tempo: ${formattaTempo(tempoTotale)}`;

  renderListaRisposte("tr-lista-risposte");
}

function mostraRisultatoVerifica(corrette, tot, perc, tempoTotale) {
  document.getElementById("verifica-sessione").style.display = "none";
  document.getElementById("verifica-risultato").style.display = "block";

  const livello = livelloPunteggio(perc);
  document.getElementById("ver-cerchio").className = `punteggio-cerchio ${livello}`;
  document.getElementById("ver-punteggio-num").textContent = corrette;
  document.getElementById("ver-punteggio-tot").textContent = `/ ${tot}`;
  document.getElementById("ver-voto-testo").textContent = votoTesto(perc);
  document.getElementById("ver-tempo").textContent = `Tempo totale: ${formattaTempo(tempoTotale)}`;
  document.getElementById("ver-percentuale").textContent = `${perc}% corretto`;

  renderListaRisposte("ver-lista-risposte");
}

function resetTraining() {
  document.getElementById("training-setup").style.display = "block";
  document.getElementById("training-sessione").style.display = "none";
  document.getElementById("training-risultato").style.display = "none";
}

function resetVerifica() {
  document.getElementById("verifica-setup").style.display = "block";
  document.getElementById("verifica-sessione").style.display = "none";
  document.getElementById("verifica-risultato").style.display = "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// TASTIERA NUMERICA
// ─────────────────────────────────────────────────────────────────────────────
function inputTastiera(targetId, val) {
  const input = document.getElementById(targetId);
  if (val === "del") {
    input.value = input.value.slice(0, -1);
  } else {
    if (input.value.length < 4) {
      input.value += val;
    }
  }
  input.focus();
}

// ─────────────────────────────────────────────────────────────────────────────
// STATISTICHE
// ─────────────────────────────────────────────────────────────────────────────
async function caricaStatistiche() {
  try {
    const res = await fetch("/api/statistiche");
    const data = await res.json();
    renderStatistiche(data);
  } catch (e) {
    console.error("Errore caricamento statistiche:", e);
  }
}

function renderStatistiche(data) {
  const { generale, per_coppia, ultime_verifiche } = data;

  // Riepilogo generale
  document.getElementById("stat-totale-verifiche").textContent = generale.totale_verifiche || 0;
  document.getElementById("stat-media").textContent =
    generale.media_punteggio != null ? Math.round(generale.media_punteggio) + "%" : "—";
  document.getElementById("stat-migliore").textContent =
    generale.miglior_punteggio != null ? Math.round(generale.miglior_punteggio) + "%" : "—";

  // Ultime verifiche
  const tbody = document.getElementById("stat-verifiche-tbody");
  if (!ultime_verifiche.length) {
    document.getElementById("stat-verifiche-empty").style.display = "block";
    document.getElementById("stat-verifiche-table").style.display = "none";
  } else {
    document.getElementById("stat-verifiche-empty").style.display = "none";
    document.getElementById("stat-verifiche-table").style.display = "block";
    tbody.innerHTML = ultime_verifiche.map(v => {
      const livello = livelloPunteggio(v.percentuale);
      const timer = v.timer_per_domanda ? `${v.timer_per_domanda}s` : "—";
      return `
        <tr>
          <td>${formatData(v.data)}</td>
          <td>${v.risposte_corrette} / ${v.totale_domande}</td>
          <td><span class="badge ${livello}">${v.percentuale}%</span></td>
          <td>${timer}</td>
          <td>${formattaTempo(v.tempo_totale_secondi)}</td>
        </tr>
      `;
    }).join("");
  }

  // Heatmap tabelline
  renderHeatmap(per_coppia);
}

function renderHeatmap(per_coppia) {
  const mappa = {};
  per_coppia.forEach(r => {
    mappa[`${r.moltiplicando}x${r.moltiplicatore}`] = r.percentuale_corrette;
  });

  const labelsEl = document.getElementById("heatmap-labels");
  const gridEl = document.getElementById("heatmap-grid");

  labelsEl.innerHTML = "";
  gridEl.innerHTML = "";

  for (let b = 2; b <= 10; b++) {
    const span = document.createElement("span");
    span.textContent = `×${b}`;
    labelsEl.appendChild(span);
  }

  for (let a = 2; a <= 10; a++) {
    for (let b = 2; b <= 10; b++) {
      const key = `${a}x${b}`;
      const perc = mappa[key];
      const cell = document.createElement("div");
      cell.className = "heatmap-cell";

      if (perc == null) {
        cell.classList.add("no-data");
        cell.title = `${a}×${b}: nessun dato`;
        cell.innerHTML = `<span>${a}×${b}</span>`;
      } else {
        let cl = "scarso";
        if (perc >= 90) cl = "ottimo";
        else if (perc >= 70) cl = "buono";
        else if (perc >= 50) cl = "medio";
        cell.classList.add(cl);
        cell.title = `${a}×${b} = ${a*b}: ${perc}% corretto`;
        cell.innerHTML = `<span>${a}×${b}</span><span>${perc}%</span>`;
      }
      gridEl.appendChild(cell);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────
function formattaTempo(sec) {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatData(str) {
  if (!str) return "—";
  const d = new Date(str.replace(" ", "T"));
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────────────────────
// KEYBOARD SUPPORT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const verSessione = document.getElementById("verifica-sessione");
    const trSessione = document.getElementById("training-sessione");
    if (verSessione && verSessione.style.display !== "none") {
      confermaVerifica();
    } else if (trSessione && trSessione.style.display !== "none") {
      confermaTraining();
    }
  }
});
