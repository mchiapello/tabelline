// ─────────────────────────────────────────────────────────────────────────────
// COSTANTI
// ─────────────────────────────────────────────────────────────────────────────
const LIVELLI_ADDIZIONI = {
  "molto-facile": { min: 1, max: 10,  label: "Molto semplice (1–10)"  },
  "facile":       { min: 1, max: 20,  label: "Semplice (1–20)"        },
  "medio":        { min: 1, max: 50,  label: "Medio (1–50)"           },
  "difficile":    { min: 1, max: 100, label: "Difficile (1–100)"      },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
const state = {
  materia: null,         // 'tabelline' | 'addizioni'
  modalita: null,        // 'training' | 'verifica' | 'add-training' | 'add-verifica'
  operatore: "×",        // "×" o "+"
  livelloMax: null,      // solo addizioni
  domande: [],
  indiceDomanda: 0,
  risposte: [],
  timerPerDomanda: 0,
  timerInterval: null,
  tempoRimanente: 0,
  inizioSessione: null,
  inizioDomanda: null,
  numDomande: 20,
  authToken: localStorage.getItem('authToken') || null, // Store token
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────
function getAuthHeader() {
  const token = state.authToken;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function isLoggedIn() {
  return state.authToken !== null;
}

async function registerUser(username, password) {
  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      return true;
    } else {
      alert(`Registration failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('An error occurred during registration.');
    return false;
  }
}

async function loginUser(username, password) {
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (response.ok) {
      state.authToken = data.token;
      localStorage.setItem('authToken', data.token);
      alert('Login successful!');
      updateAuthUI(); // Update UI after login
      return true;
    } else {
      alert(`Login failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login.');
    return false;
  }
}

function logoutUser() {
  state.authToken = null;
  localStorage.removeItem('authToken');
  alert('Logged out successfully.');
  updateAuthUI(); // Update UI after logout
  mostraVista('landing'); // Redirect to landing page
}

function updateAuthUI() {
  const loggedInElements = document.querySelectorAll('.logged-in');
  const loggedOutElements = document.querySelectorAll('.logged-out');
  const usernameDisplay = document.getElementById('username-display');

  if (isLoggedIn()) {
    loggedInElements.forEach(el => el.style.display = 'block');
    loggedOutElements.forEach(el => el.style.display = 'none');
    // Decode token to get username (for display purposes only, not for auth)
    try {
      const tokenPayload = JSON.parse(atob(state.authToken.split('.')[1]));
      if (usernameDisplay) usernameDisplay.textContent = tokenPayload.username;
    } catch (e) {
      console.error("Error decoding token for UI display:", e);
      if (usernameDisplay) usernameDisplay.textContent = "User";
    }
  } else {
    loggedInElements.forEach(el => el.style.display = 'none');
    loggedOutElements.forEach(el => el.style.display = 'block');
    if (usernameDisplay) usernameDisplay.textContent = "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGAZIONE TRA VISTE
// ─────────────────────────────────────────────────────────────────────────────
function mostraVista(nome) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("view-" + nome).classList.add("active");
  document.getElementById("nav-" + nome).classList.add("active");
  if (nome === "stats") caricaStatistiche(window.DEFAULT_MATERIA || "tabelline");
  updateAuthUI(); // Ensure UI is updated on view change
}

// Initial UI update on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);

// ─────────────────────────────────────────────────────────────────────────────
// GENERAZIONE DOMANDE (unificata per × e +)
// ─────────────────────────────────────────────────────────────────────────────
function fisherYates(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generaDomande(n, op, min1, max1, min2, max2) {
  const calc = (a, b) => op === "+" ? a + b : a * b;
  const poolSize = (max1 - min1 + 1) * (max2 - min2 + 1);

  if (poolSize <= 600) {
    // Pool piccolo: shuffle completo, nessuna ripetizione garantita
    const pool = [];
    for (let a = min1; a <= max1; a++) {
      for (let b = min2; b <= max2; b++) {
        pool.push({ a, b, risposta: calc(a, b) });
      }
    }
    fisherYates(pool);
    if (n <= pool.length) return pool.slice(0, n);
    // n > pool: aggiungo giri shufflati extra
    const result = [...pool];
    while (result.length < n) {
      const extra = [...pool];
      fisherYates(extra);
      result.push(...extra);
    }
    return result.slice(0, n);
  } else {
    // Pool grande (es. 1–100 + 1–100 = 10 000 combinazioni):
    // campionamento casuale senza ripetizioni tramite Set
    const seen = new Set();
    const domande = [];
    while (domande.length < n) {
      const a = rand(min1, max1);
      const b = rand(min2, max2);
      const key = `${a},${b}`;
      if (!seen.has(key)) {
        seen.add(key);
        domande.push({ a, b, risposta: calc(a, b) });
      }
    }
    return domande;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TABELLINE — TRAINING
// ─────────────────────────────────────────────────────────────────────────────
function avviaTraining() {
  const n = parseInt(document.getElementById("training-num").value) || 10;
  state.materia    = "tabelline";
  state.modalita   = "training";
  state.operatore  = "×";
  state.livelloMax = null;
  state.numDomande = n;
  state.domande    = generaDomande(n, "×", 2, 10, 2, 10);
  state.indiceDomanda = 0;
  state.risposte   = [];
  state.timerPerDomanda = 0;
  state.inizioSessione = Date.now();

  document.getElementById("training-setup").style.display     = "none";
  document.getElementById("training-sessione").style.display  = "block";
  document.getElementById("training-risultato").style.display = "none";

  mostraDomandaTraining();
}

function mostraDomandaTraining() {
  const d   = state.domande[state.indiceDomanda];
  const tot = state.domande.length;
  const idx = state.indiceDomanda;

  document.getElementById("tr-progresso-label").textContent = `${idx + 1} / ${tot}`;
  document.getElementById("tr-progresso-bar").style.width   = `${(idx / tot) * 100}%`;
  document.getElementById("tr-moltiplicazione").innerHTML   =
    `<span>${d.a}</span> <span class="operatori">×</span> <span>${d.b}</span> <span class="operatori">=</span>`;

  const input = document.getElementById("tr-risposta-input");
  input.value = "";
  input.className = "risposta-input";
  input.focus();

  document.getElementById("tr-feedback").textContent  = "";
  document.getElementById("tr-feedback").className    = "feedback-msg";
  document.getElementById("tr-hint").className        = "hint-risposta";
  document.getElementById("tr-hint").textContent      = "";
  document.getElementById("btn-tr-conferma").textContent    = "Conferma";
  document.getElementById("btn-tr-conferma").dataset.stato  = "attesa";

  state.inizioDomanda = Date.now();
}

function confermaTraining() {
  const btn = document.getElementById("btn-tr-conferma");
  if (btn.dataset.stato === "avanti") {
    state.indiceDomanda++;
    if (state.indiceDomanda >= state.domande.length) terminaSessione();
    else mostraDomandaTraining();
    return;
  }

  const d     = state.domande[state.indiceDomanda];
  const input = document.getElementById("tr-risposta-input");
  const valore = parseInt(input.value);
  const tempo  = (Date.now() - state.inizioDomanda) / 1000;

  if (isNaN(valore)) { input.focus(); return; }

  const corretta = valore === d.risposta;
  state.risposte.push({ moltiplicando: d.a, moltiplicatore: d.b,
    risposta_corretta: d.risposta, risposta_utente: valore, tempo_secondi: tempo, corretta });

  const feedback = document.getElementById("tr-feedback");
  const hint     = document.getElementById("tr-hint");
  input.className = "risposta-input " + (corretta ? "corretta" : "sbagliata");

  if (corretta) {
    feedback.textContent = "✓ Esatto!";
    feedback.className   = "feedback-msg corretta";
    hint.className       = "hint-risposta";
  } else {
    feedback.textContent = "✗ Sbagliato";
    feedback.className   = "feedback-msg sbagliata";
    hint.textContent     = `La risposta corretta è: ${d.a} × ${d.b} = ${d.risposta}`;
    hint.className       = "hint-risposta sbagliata";
  }
  btn.textContent  = state.indiceDomanda + 1 < state.domande.length ? "Prossima →" : "Vedi risultato";
  btn.dataset.stato = "avanti";
}

// ─────────────────────────────────────────────────────────────────────────────
// TABELLINE — VERIFICA
// ─────────────────────────────────────────────────────────────────────────────
function avviaVerifica() {
  const timer = parseInt(document.getElementById("ver-timer").value) || 0;
  state.materia    = "tabelline";
  state.modalita   = "verifica";
  state.operatore  = "×";
  state.livelloMax = null;
  state.numDomande = 20;
  state.domande    = generaDomande(20, "×", 2, 10, 2, 10);
  state.indiceDomanda = 0;
  state.risposte   = [];
  state.timerPerDomanda = timer;
  state.inizioSessione = Date.now();

  document.getElementById("verifica-setup").style.display     = "none";
  document.getElementById("verifica-sessione").style.display  = "block";
  document.getElementById("verifica-risultato").style.display = "none";

  mostraDomandaVerifica();
}

function mostraDomandaVerifica() {
  const d   = state.domande[state.indiceDomanda];
  const tot = state.domande.length;
  const idx = state.indiceDomanda;

  document.getElementById("ver-progresso-label").textContent = `${idx + 1} / ${tot}`;
  document.getElementById("ver-progresso-bar").style.width   = `${(idx / tot) * 100}%`;
  document.getElementById("ver-moltiplicazione").innerHTML   =
    `<span>${d.a}</span> <span class="operatori">×</span> <span>${d.b}</span> <span class="operatori">=</span>`;

  const input = document.getElementById("ver-risposta-input");
  input.value = "";
  input.className = "risposta-input";
  input.focus();

  document.getElementById("ver-feedback").textContent = "";
  document.getElementById("ver-feedback").className   = "feedback-msg";

  avviaTimer("ver-timer-display");
  state.inizioDomanda = Date.now();
}

function confermaVerifica() {
  const d     = state.domande[state.indiceDomanda];
  const input = document.getElementById("ver-risposta-input");
  const valore = parseInt(input.value);
  const tempo  = (Date.now() - state.inizioDomanda) / 1000;
  if (isNaN(valore)) { input.focus(); return; }

  stopTimer();
  const corretta = valore === d.risposta;
  state.risposte.push({ moltiplicando: d.a, moltiplicatore: d.b,
    risposta_corretta: d.risposta, risposta_utente: valore, tempo_secondi: tempo, corretta });

  const feedback = document.getElementById("ver-feedback");
  input.className = "risposta-input " + (corretta ? "corretta" : "sbagliata");
  feedback.textContent = corretta ? "✓ Corretto!" : `✗ Era ${d.risposta}`;
  feedback.className   = "feedback-msg " + (corretta ? "corretta" : "sbagliata");

  setTimeout(() => { state.indiceDomanda++; avanzaOTermina("ver"); }, 700);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDIZIONI — TRAINING
// ─────────────────────────────────────────────────────────────────────────────
function avviaAddTraining() {
  const n      = parseInt(document.getElementById("add-tr-num").value) || 10;
  const livKey = document.getElementById("add-tr-livello").value;
  const lv     = LIVELLI_ADDIZIONI[livKey];

  state.materia    = "addizioni";
  state.modalita   = "add-training";
  state.operatore  = "+";
  state.livelloMax = lv.max;
  state.numDomande = n;
  state.domande    = generaDomande(n, "+", lv.min, lv.max, lv.min, lv.max);
  state.indiceDomanda = 0;
  state.risposte   = [];
  state.timerPerDomanda = 0;
  state.inizioSessione = Date.now();

  document.getElementById("add-training-setup").style.display     = "none";
  document.getElementById("add-training-sessione").style.display  = "block";
  document.getElementById("add-training-risultato").style.display = "none";

  mostraDomandaAddTraining();
}

function mostraDomandaAddTraining() {
  const d   = state.domande[state.indiceDomanda];
  const tot = state.domande.length;
  const idx = state.indiceDomanda;

  document.getElementById("add-tr-progresso-label").textContent = `${idx + 1} / ${tot}`;
  document.getElementById("add-tr-progresso-bar").style.width   = `${(idx / tot) * 100}%`;
  document.getElementById("add-tr-operazione").innerHTML        =
    `<span>${d.a}</span> <span class="operatori operatori-add">+</span> <span>${d.b}</span> <span class="operatori operatori-add">=</span>`;

  const input = document.getElementById("add-tr-risposta-input");
  input.value = "";
  input.className = "risposta-input";
  input.focus();

  document.getElementById("add-tr-feedback").textContent  = "";
  document.getElementById("add-tr-feedback").className    = "feedback-msg";
  document.getElementById("add-tr-hint").className        = "hint-risposta";
  document.getElementById("add-tr-hint").textContent      = "";
  document.getElementById("btn-add-tr-conferma").textContent    = "Conferma";
  document.getElementById("btn-add-tr-conferma").dataset.stato  = "attesa";

  state.inizioDomanda = Date.now();
}

function confermaAddTraining() {
  const btn = document.getElementById("btn-add-tr-conferma");
  if (btn.dataset.stato === "avanti") {
    state.indiceDomanda++;
    if (state.indiceDomanda >= state.domande.length) terminaSessione();
    else mostraDomandaAddTraining();
    return;
  }

  const d     = state.domande[state.indiceDomanda];
  const input = document.getElementById("add-tr-risposta-input");
  const valore = parseInt(input.value);
  const tempo  = (Date.now() - state.inizioDomanda) / 1000;

  if (isNaN(valore)) { input.focus(); return; }

  const corretta = valore === d.risposta;
  state.risposte.push({ moltiplicando: d.a, moltiplicatore: d.b,
    risposta_corretta: d.risposta, risposta_utente: valore, tempo_secondi: tempo, corretta });

  const feedback = document.getElementById("add-tr-feedback");
  const hint     = document.getElementById("add-tr-hint");
  input.className = "risposta-input " + (corretta ? "corretta" : "sbagliata");

  if (corretta) {
    feedback.textContent = "✓ Esatto!";
    feedback.className   = "feedback-msg corretta";
    hint.className       = "hint-risposta";
  } else {
    feedback.textContent = "✗ Sbagliato";
    feedback.className   = "feedback-msg sbagliata";
    hint.textContent     = `La risposta corretta è: ${d.a} + ${d.b} = ${d.risposta}`;
    hint.className       = "hint-risposta sbagliata";
  }
  btn.textContent   = state.indiceDomanda + 1 < state.domande.length ? "Prossima →" : "Vedi risultato";
  btn.dataset.stato = "avanti";
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDIZIONI — VERIFICA
// ─────────────────────────────────────────────────────────────────────────────
function avviaAddVerifica() {
  const timer  = parseInt(document.getElementById("add-ver-timer").value) || 0;
  const livKey = document.getElementById("add-ver-livello").value;
  const lv     = LIVELLI_ADDIZIONI[livKey];

  state.materia    = "addizioni";
  state.modalita   = "add-verifica";
  state.operatore  = "+";
  state.livelloMax = lv.max;
  state.numDomande = 20;
  state.domande    = generaDomande(20, "+", lv.min, lv.max, lv.min, lv.max);
  state.indiceDomanda = 0;
  state.risposte   = [];
  state.timerPerDomanda = timer;
  state.inizioSessione = Date.now();

  document.getElementById("add-verifica-setup").style.display     = "none";
  document.getElementById("add-verifica-sessione").style.display  = "block";
  document.getElementById("add-verifica-risultato").style.display = "none";

  mostraDomandaAddVerifica();
}

function mostraDomandaAddVerifica() {
  const d   = state.domande[state.indiceDomanda];
  const tot = state.domande.length;
  const idx = state.indiceDomanda;

  document.getElementById("add-ver-progresso-label").textContent = `${idx + 1} / ${tot}`;
  document.getElementById("add-ver-progresso-bar").style.width   = `${(idx / tot) * 100}%`;
  document.getElementById("add-ver-operazione").innerHTML        =
    `<span>${d.a}</span> <span class="operatori operatori-add">+</span> <span>${d.b}</span> <span class="operatori operatori-add">=</span>`;

  const input = document.getElementById("add-ver-risposta-input");
  input.value = "";
  input.className = "risposta-input";
  input.focus();

  document.getElementById("add-ver-feedback").textContent = "";
  document.getElementById("add-ver-feedback").className   = "feedback-msg";

  avviaTimer("add-ver-timer-display");
  state.inizioDomanda = Date.now();
}

function confermaAddVerifica() {
  const d     = state.domande[state.indiceDomanda];
  const input = document.getElementById("add-ver-risposta-input");
  const valore = parseInt(input.value);
  const tempo  = (Date.now() - state.inizioDomanda) / 1000;
  if (isNaN(valore)) { input.focus(); return; }

  stopTimer();
  const corretta = valore === d.risposta;
  state.risposte.push({ moltiplicando: d.a, moltiplicatore: d.b,
    risposta_corretta: d.risposta, risposta_utente: valore, tempo_secondi: tempo, corretta });

  const feedback = document.getElementById("add-ver-feedback");
  input.className = "risposta-input " + (corretta ? "corretta" : "sbagliata");
  feedback.textContent = corretta ? "✓ Corretto!" : `✗ Era ${d.risposta}`;
  feedback.className   = "feedback-msg " + (corretta ? "corretta" : "sbagliata");

  setTimeout(() => { state.indiceDomanda++; avanzaOTermina("add-ver"); }, 700);
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMER (condiviso tra verifica tabelline e addizioni)
// ─────────────────────────────────────────────────────────────────────────────
function avviaTimer(displayId) {
  stopTimer();
  state._timerDisplayId = displayId;
  const el = document.getElementById(displayId);
  if (state.timerPerDomanda > 0) {
    state.tempoRimanente = state.timerPerDomanda;
    aggiornaDisplayTimer();
    el.classList.remove("hidden");
    state.timerInterval = setInterval(tickTimer, 1000);
  } else {
    el.classList.add("hidden");
  }
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
  const el = document.getElementById(state._timerDisplayId);
  if (!el) return;
  el.textContent = `⏱ ${state.tempoRimanente}s`;
  el.className   = "timer-display";
  if (state.tempoRimanente <= 3) el.classList.add("danger");
  else if (state.tempoRimanente <= Math.ceil(state.timerPerDomanda * 0.4)) el.classList.add("warning");
}

function tempoScaduto() {
  const d = state.domande[state.indiceDomanda];
  state.risposte.push({ moltiplicando: d.a, moltiplicatore: d.b,
    risposta_corretta: d.risposta, risposta_utente: null,
    tempo_secondi: state.timerPerDomanda, corretta: false });

  const prefix   = state.materia === "addizioni" ? "add-ver" : "ver";
  const feedback = document.getElementById(`${prefix}-feedback`);
  feedback.textContent = `⏰ Tempo scaduto! La risposta era ${d.risposta}`;
  feedback.className   = "feedback-msg sbagliata";

  setTimeout(() => { state.indiceDomanda++; avanzaOTermina(prefix); }, 1200);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

// Avanza alla prossima domanda di verifica (tabelline o addizioni)
function avanzaOTermina(prefix) {
  if (state.indiceDomanda >= state.domande.length) {
    terminaSessione();
  } else {
    if (prefix === "ver")     mostraDomandaVerifica();
    else                      mostraDomandaAddVerifica();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FINE SESSIONE
// ─────────────────────────────────────────────────────────────────────────────
async function terminaSessione() {
  stopTimer();
  const tempoTotale = (Date.now() - state.inizioSessione) / 1000;
  const corrette    = state.risposte.filter(r => r.corretta).length;
  const tot         = state.risposte.length;
  const perc        = Math.round((corrette / tot) * 100);

  if (isLoggedIn()) {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeader()
      };
      await fetch("/api/math/salva-verifica", {
        method:  "POST",
        headers: headers,
        body: JSON.stringify({
          modalita:         state.modalita,
          materia:          state.materia,
          totale_domande:   tot,
          risposte_corrette: corrette,
          tempo_totale:     tempoTotale,
          timer_per_domanda: state.timerPerDomanda || null,
          livello_max:      state.livelloMax,
          risposte:         state.risposte,
        }),
      });
    } catch (e) {
      console.error("Errore salvataggio:", e);
      alert("Errore nel salvataggio del progresso. Riprova più tardi.");
    }
  } else {
    console.log("Utente non loggato, progresso non salvato.");
    // Optionally, show a message to the user that progress is not saved
  }

  switch (state.modalita) {
    case "training":     mostraRisultatoTraining(corrette, tot, perc, tempoTotale); break;
    case "verifica":     mostraRisultatoVerifica(corrette, tot, perc, tempoTotale); break;
    case "add-training": mostraRisultatoAddTraining(corrette, tot, perc, tempoTotale); break;
    case "add-verifica": mostraRisultatoAddVerifica(corrette, tot, perc, tempoTotale); break;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RISULTATI
// ─────────────────────────────────────────────────────────────────────────────
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

function renderListaRisposte(contenitoreId, op) {
  const ul = document.getElementById(contenitoreId);
  ul.innerHTML = "";
  state.risposte.forEach(r => {
    const li = document.createElement("li");
    li.className = r.corretta ? "corretta" : "sbagliata";
    const rispTesto = r.risposta_utente !== null ? r.risposta_utente : "—";
    li.innerHTML = `
      <div class="operazione">${r.moltiplicando} ${op} ${r.moltiplicatore} = ${r.risposta_corretta}</div>
      <div class="tua-risposta">Tu: ${rispTesto}</div>
    `;
    ul.appendChild(li);
  });
}

function popolaRisultato(prefix, corrette, tot, perc, tempoTotale, extraInfo) {
  const livello = livelloPunteggio(perc);
  document.getElementById(`${prefix}-cerchio`).className      = `punteggio-cerchio ${livello}`;
  document.getElementById(`${prefix}-punteggio-num`).textContent = corrette;
  document.getElementById(`${prefix}-punteggio-tot`).textContent = `/ ${tot}`;
  document.getElementById(`${prefix}-voto-testo`).textContent    = votoTesto(perc);
  if (extraInfo) document.getElementById(`${prefix}-extra`).textContent = extraInfo;
}

function mostraRisultatoTraining(corrette, tot, perc, tempoTotale) {
  document.getElementById("training-sessione").style.display  = "none";
  document.getElementById("training-risultato").style.display = "block";
  popolaRisultato("tr", corrette, tot, perc, tempoTotale,
    `Tempo: ${formattaTempo(tempoTotale)}`);
  renderListaRisposte("tr-lista-risposte", "×");
}

function mostraRisultatoVerifica(corrette, tot, perc, tempoTotale) {
  document.getElementById("verifica-sessione").style.display  = "none";
  document.getElementById("verifica-risultato").style.display = "block";
  popolaRisultato("ver", corrette, tot, perc, tempoTotale);
  document.getElementById("ver-tempo").textContent       = `Tempo totale: ${formattaTempo(tempoTotale)}`;
  document.getElementById("ver-percentuale").textContent = `${perc}% corretto`;
  renderListaRisposte("ver-lista-risposte", "×");
}

function mostraRisultatoAddTraining(corrette, tot, perc, tempoTotale) {
  document.getElementById("add-training-sessione").style.display  = "none";
  document.getElementById("add-training-risultato").style.display = "block";
  popolaRisultato("add-tr", corrette, tot, perc, tempoTotale,
    `Tempo: ${formattaTempo(tempoTotale)}`);
  renderListaRisposte("add-tr-lista-risposte", "+");
}

function mostraRisultatoAddVerifica(corrette, tot, perc, tempoTotale) {
  document.getElementById("add-verifica-sessione").style.display  = "none";
  document.getElementById("add-verifica-risultato").style.display = "block";
  popolaRisultato("add-ver", corrette, tot, perc, tempoTotale);
  document.getElementById("add-ver-tempo").textContent       = `Tempo totale: ${formattaTempo(tempoTotale)}`;
  document.getElementById("add-ver-percentuale").textContent = `${perc}% corretto`;
  renderListaRisposte("add-ver-lista-risposte", "+");
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────────────────────────────────────
function resetTraining() {
  document.getElementById("training-setup").style.display     = "block";
  document.getElementById("training-sessione").style.display  = "none";
  document.getElementById("training-risultato").style.display = "none";
}

function resetVerifica() {
  document.getElementById("verifica-setup").style.display     = "block";
  document.getElementById("verifica-sessione").style.display  = "none";
  document.getElementById("verifica-risultato").style.display = "none";
}

function resetAddTraining() {
  document.getElementById("add-training-setup").style.display     = "block";
  document.getElementById("add-training-sessione").style.display  = "none";
  document.getElementById("add-training-risultato").style.display = "none";
}

function resetAddVerifica() {
  document.getElementById("add-verifica-setup").style.display     = "block";
  document.getElementById("add-verifica-sessione").style.display  = "none";
  document.getElementById("add-verifica-risultato").style.display = "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// TASTIERA NUMERICA
// ─────────────────────────────────────────────────────────────────────────────
function inputTastiera(targetId, val) {
  const input = document.getElementById(targetId);
  if (val === "del") {
    input.value = input.value.slice(0, -1);
  } else {
    if (input.value.length < 4) input.value += val;
  }
  input.focus();
}

// ─────────────────────────────────────────────────────────────────────────────
// STATISTICHE
// ─────────────────────────────────────────────────────────────────────────────
async function caricaStatistiche(materia) {
  // Aggiorna tab attivi
  document.querySelectorAll(".stat-tab").forEach(t => t.classList.remove("active"));
  const tab = document.getElementById(`stat-tab-${materia}`);
  if (tab) tab.classList.add("active");

  // Mostra/nascondi sezioni specifiche per materia (elementi opzionali)
  const heatmapSection = document.getElementById("stat-heatmap-section");
  const livelliSection  = document.getElementById("stat-livelli-section");
  if (heatmapSection) heatmapSection.style.display = materia === "tabelline" ? "block" : "none";
  if (livelliSection)  livelliSection.style.display  = materia === "addizioni" ? "block" : "none";

  if (isLoggedIn()) {
    try {
      const headers = getAuthHeader();
      const res  = await fetch(`/api/math/statistiche?materia=${materia}`, { headers: headers });
      const data = await res.json();
      renderStatistiche(data, materia);
    } catch (e) {
      console.error("Errore caricamento statistiche:", e);
      alert("Errore nel caricamento delle statistiche. Assicurati di essere loggato.");
    }
  } else {
    // For guest users, clear stats or show a message
    console.log("Utente non loggato, statistiche non disponibili.");
    renderStatistiche({
      generale: {},
      per_coppia: [],
      per_livello: [],
      ultime_verifiche: []
    }, materia); // Render empty stats
    alert("Effettua il login per visualizzare le tue statistiche.");
  }
}

function nomeLivello(max) {
  const map = { 10: "Molto semplice", 20: "Semplice", 50: "Medio", 100: "Difficile" };
  return map[max] || `1–${max}`;
}

function renderStatistiche(data, materia) {
  const { generale, per_coppia, per_livello, ultime_verifiche } = data;

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
      const timer   = v.timer_per_domanda ? `${v.timer_per_domanda}s` : "—";
      const livTxt  = materia === "addizioni" && v.livello_max
        ? nomeLivello(v.livello_max) : "—";
      return `
        <tr>
          <td>${formatData(v.data)}</td>
          <td>${v.risposte_corrette} / ${v.totale_domande}</td>
          <td><span class="badge ${livello}">${v.percentuale}%</span></td>
          <td>${materia === "addizioni" ? livTxt : timer}</td>
          <td>${formattaTempo(v.tempo_totale_secondi)}</td>
        </tr>
      `;
    }).join("");
  }

  // Aggiorna intestazione 4ª colonna tabella
  const th4 = document.getElementById("stat-col4-header");
  if (th4) th4.textContent = materia === "addizioni" ? "Livello" : "Timer";

  if (materia === "tabelline") renderHeatmap(per_coppia);
  else                         renderLivelli(per_livello);
}

function renderHeatmap(per_coppia) {
  const mappa = {};
  per_coppia.forEach(r => { mappa[`${r.moltiplicando}x${r.moltiplicatore}`] = r.percentuale_corrette; });

  const labelsEl = document.getElementById("heatmap-labels");
  const gridEl   = document.getElementById("heatmap-grid");
  labelsEl.innerHTML = "";
  gridEl.innerHTML   = "";

  for (let b = 2; b <= 10; b++) {
    const span = document.createElement("span");
    span.textContent = `×${b}`;
    labelsEl.appendChild(span);
  }
  for (let a = 2; a <= 10; a++) {
    for (let b = 2; b <= 10; b++) {
      const key  = `${a}x${b}`;
      const perc = mappa[key];
      const cell = document.createElement("div");
      cell.className = "heatmap-cell";
      if (perc == null) {
        cell.classList.add("no-data");
        cell.title     = `${a}×${b}: nessun dato`;
        cell.innerHTML = `<span>${a}×${b}</span>`;
      } else {
        let cl = "scarso";
        if (perc >= 90) cl = "ottimo";
        else if (perc >= 70) cl = "buono";
        else if (perc >= 50) cl = "medio";
        cell.classList.add(cl);
        cell.title     = `${a}×${b} = ${a*b}: ${perc}% corretto`;
        cell.innerHTML = `<span>${a}×${b}</span><span>${perc}%</span>`;
      }
      gridEl.appendChild(cell);
    }
  }
}

function renderLivelli(per_livello) {
  const grid = document.getElementById("stat-livelli-grid");
  if (!per_livello || !per_livello.length) {
    grid.innerHTML = `<p style="color:var(--text-muted)">Nessuna verifica ancora.</p>`;
    return;
  }
  grid.innerHTML = per_livello.map(l => `
    <div class="livello-box">
      <div class="lv-nome">${nomeLivello(l.livello_max)}</div>
      <div class="lv-media">${l.media}%</div>
      <div class="lv-partite">${l.totale} verific${l.totale === 1 ? "a" : "he"}</div>
    </div>
  `).join("");
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
  if (e.key !== "Enter") return;
  const vis = id => {
    const el = document.getElementById(id);
    return el && el.style.display !== "none";
  };
  if      (vis("verifica-sessione"))     confermaVerifica();
  else if (vis("training-sessione"))     confermaTraining();
  else if (vis("add-verifica-sessione")) confermaAddVerifica();
  else if (vis("add-training-sessione")) confermaAddTraining();
});
