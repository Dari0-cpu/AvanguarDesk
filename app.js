const STORAGE_KEY = 'avanguardesk_data';
const THEME_KEY = 'avanguardesk_theme';

let clients = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let searchQuery = '';

// Elementi DOM
const activeGrid = document.getElementById('activeClients');
const doneList = document.getElementById('doneClients');
const addModal = document.getElementById('addModal');
const detailModal = document.getElementById('detailModal');
const supaModal = document.getElementById('supaModal');
const themeModal = document.getElementById('themeModal');

// Escape per evitare che il testo dell'utente rompa l'HTML delle card
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// ===== RICERCA =====
function matchesSearch(c) {
    if (!searchQuery) return true;
    const haystack = [c.nome, c.cognome, c.location, c.telefono, c.mail, c.descrizione]
        .filter(Boolean).join(' ').toLowerCase();
    // Tutte le parole cercate devono comparire (in qualsiasi ordine)
    return searchQuery.split(/\s+/).every(w => haystack.includes(w));
}

// ===== RENDER =====
function render() {
    activeGrid.innerHTML = '';
    doneList.innerHTML = '';

    // Ordine di data in cui sono stati aggiunti (crescente per i nuovi in fondo)
    const active = clients.filter(c => c.status === 'active' && matchesSearch(c)).sort((a, b) => a.dateAdded - b.dateAdded);
    const done = clients.filter(c => c.status === 'done' && matchesSearch(c)).sort((a, b) => b.dateAdded - a.dateAdded);

    active.forEach(c => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openDetail(c);
        card.innerHTML = `
            <h3 class="card-name">${esc(c.nome)} ${esc(c.cognome)}</h3>
            <div class="card-desc">${esc(c.descrizione) || '...'}</div>
            <span class="card-location">📍 ${esc(c.location) || 'N/D'}</span>
            <button class="check-btn" title="Completa" onclick="completeClient('${c.id}', event)">✓</button>
        `;
        activeGrid.appendChild(card);
    });

    done.forEach(c => {
        const card = document.createElement('div');
        card.className = 'done-card';
        card.onclick = () => openDetail(c);
        card.innerHTML = `
            <div class="done-info">
                <h4 class="done-name">${esc(c.nome)} ${esc(c.cognome)}</h4>
                <span class="done-meta">📍 ${esc(c.location) || 'N/D'} | 📞 ${esc(c.telefono) || 'N/D'}</span>
            </div>
            <button class="restore-btn" title="Riporta in lavorazione" onclick="restoreClient('${c.id}', event)">↩</button>
        `;
        doneList.appendChild(card);
    });

    // Messaggi di lista vuota
    if (!active.length) {
        activeGrid.innerHTML = `<p class="empty-state">${searchQuery ? 'Nessun risultato in lavorazione.' : 'Nessun cliente in lavorazione.'}</p>`;
    }
    if (!done.length) {
        doneList.innerHTML = `<p class="empty-state">${searchQuery ? 'Nessun risultato tra i completati.' : 'Nessun cliente completato.'}</p>`;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

// ===== AZIONI =====
window.completeClient = (id, e) => {
    e.stopPropagation();
    const client = clients.find(c => c.id === id);
    if (client) client.status = 'done';
    render();
};

// Recupero: riporta un cliente completato tra quelli in lavorazione
window.restoreClient = (id, e) => {
    e.stopPropagation();
    const client = clients.find(c => c.id === id);
    if (client) client.status = 'active';
    render();
};

window.openDetail = (c) => {
    document.getElementById('d_nome').textContent = `${c.nome} ${c.cognome || ''}`.trim();
    document.getElementById('d_location').textContent = c.location || '-';
    document.getElementById('d_telefono').textContent = c.telefono || '-';
    document.getElementById('d_mail').textContent = c.mail || '-';
    document.getElementById('d_descrizione').textContent = c.descrizione || '-';
    detailModal.classList.add('active');
};

// ===== FORM DI AGGIUNTA =====
document.getElementById('addForm').onsubmit = (e) => {
    e.preventDefault();
    clients.push({
        id: Date.now().toString(),
        nome: document.getElementById('i_nome').value,
        cognome: document.getElementById('i_cognome').value,
        location: document.getElementById('i_location').value,
        telefono: document.getElementById('i_telefono').value,
        mail: document.getElementById('i_mail').value,
        descrizione: document.getElementById('i_descrizione').value,
        status: 'active',
        dateAdded: Date.now()
    });
    stopDictation();
    hideSuggestions();
    e.target.reset();
    document.getElementById('micHint').textContent = '';
    closeModals();
    render();
};

// ===== GESTIONE MODAL =====
window.closeModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    stopDictation();
    hideSuggestions();
};
document.getElementById('fab').onclick = () => addModal.classList.add('active');
document.getElementById('btnSync').onclick = () => supaModal.classList.add('active');
document.getElementById('btnTheme').onclick = () => { renderThemes(); themeModal.classList.add('active'); };

// Chiusura cliccando sullo sfondo o con Esc
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModals(); });
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });

// ===== BARRA DI RICERCA =====
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');

btnSearch.onclick = () => {
    const open = searchBar.classList.toggle('open');
    btnSearch.classList.toggle('active', open);
    if (open) {
        searchInput.focus();
    } else {
        searchInput.value = '';
        searchQuery = '';
        render();
    }
};

searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    render();
});

document.getElementById('btnSearchClear').onclick = () => {
    searchInput.value = '';
    searchQuery = '';
    searchInput.focus();
    render();
};

// ===== TAVOLOZZA TEMI =====
const THEMES = [
    { id: 'light',  name: 'Chiaro',   colors: ['#f8fafc', '#10b981', '#3b82f6'] },
    { id: 'dark',   name: 'Scuro',    colors: ['#0f172a', '#6366f1', '#14b8a6'] },
    { id: 'ocean',  name: 'Oceano',   colors: ['#f0f9ff', '#0ea5e9', '#06b6d4'] },
    { id: 'forest', name: 'Foresta',  colors: ['#f4f5f0', '#52796f', '#84a98c'] },
    { id: 'sunset', name: 'Tramonto', colors: ['#fff1f2', '#f43f5e', '#fb923c'] }
];

function applyTheme(id) {
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem(THEME_KEY, id);
    // Allinea la barra di stato del browser/PWA al colore del tema
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
    }
    meta.content = primary;
}

function renderThemes() {
    const grid = document.getElementById('themeGrid');
    const current = localStorage.getItem(THEME_KEY) || 'light';
    grid.innerHTML = '';
    THEMES.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'theme-card' + (t.id === current ? ' selected' : '');
        btn.innerHTML = `
            <div class="theme-swatches">
                ${t.colors.map(c => `<span style="background:${c}"></span>`).join('')}
            </div>
            <span class="theme-name">${t.name}</span>
        `;
        btn.onclick = () => { applyTheme(t.id); renderThemes(); };
        grid.appendChild(btn);
    });
}

applyTheme(localStorage.getItem(THEME_KEY) || 'light');

// ===== AUTOCOMPLETE LOCATION (OpenStreetMap / Nominatim) =====
const locInput = document.getElementById('i_location');
const locBox = document.getElementById('locSuggestions');
let locTimer = null;
let locAbort = null;

function hideSuggestions() {
    locBox.classList.remove('open');
    locBox.innerHTML = '';
}

function showNote(text) {
    locBox.innerHTML = `<li class="note">${esc(text)}</li>`;
    locBox.classList.add('open');
}

async function searchPlaces(q) {
    if (locAbort) locAbort.abort();
    locAbort = new AbortController();

    const url = 'https://nominatim.openstreetmap.org/search'
        + '?format=jsonv2&addressdetails=1&limit=6&accept-language=it'
        + '&q=' + encodeURIComponent(q);

    try {
        showNote('Ricerca indirizzi...');
        const res = await fetch(url, { signal: locAbort.signal, headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        if (!data.length) { showNote('Nessun indirizzo trovato'); return; }

        locBox.innerHTML = '';
        data.forEach(place => {
            const parts = place.display_name.split(', ');
            const main = parts.slice(0, 2).join(', ');
            const sub = parts.slice(2).join(', ');
            const li = document.createElement('li');
            li.innerHTML = `<span class="sug-main">${esc(main)}</span>${sub ? `<span class="sug-sub">${esc(sub)}</span>` : ''}`;
            // mousedown: scatta prima del blur dell'input
            li.addEventListener('mousedown', (e) => {
                e.preventDefault();
                locInput.value = place.display_name;
                hideSuggestions();
            });
            locBox.appendChild(li);
        });
        locBox.classList.add('open');
    } catch (err) {
        if (err.name === 'AbortError') return;
        showNote('Suggerimenti non disponibili (offline?)');
    }
}

locInput.addEventListener('input', () => {
    clearTimeout(locTimer);
    const q = locInput.value.trim();
    if (q.length < 3) { hideSuggestions(); return; }
    // debounce: Nominatim chiede max ~1 richiesta al secondo
    locTimer = setTimeout(() => searchPlaces(q), 450);
});

locInput.addEventListener('blur', () => setTimeout(hideSuggestions, 150));
locInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideSuggestions(); });

// ===== DETTATURA VOCALE (Web Speech API) =====
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
const micBtn = document.getElementById('btnMic');
const micHint = document.getElementById('micHint');
const descInput = document.getElementById('i_descrizione');

let recognition = null;
let recording = false;
let recBase = '';    // testo già presente prima di iniziare a dettare
let recFinal = '';   // frasi riconosciute come definitive

function stopDictation() {
    if (recognition && recording) recognition.stop();
}

if (!SpeechRec) {
    micBtn.style.display = 'none';
} else {
    recognition = new SpeechRec();
    recognition.lang = 'it-IT';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        recording = true;
        recBase = descInput.value ? descInput.value.trim() + ' ' : '';
        recFinal = '';
        micBtn.classList.add('recording');
        micHint.textContent = '🔴 In ascolto... premi di nuovo il microfono per fermare.';
    };

    recognition.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            const text = e.results[i][0].transcript;
            if (e.results[i].isFinal) recFinal += text + ' ';
            else interim += text;
        }
        descInput.value = (recBase + recFinal + interim).replace(/\s+/g, ' ');
    };

    recognition.onerror = (e) => {
        micHint.textContent = e.error === 'not-allowed'
            ? '⚠️ Microfono negato: autorizzalo nelle impostazioni del browser.'
            : '⚠️ Errore dettatura: ' + e.error;
    };

    recognition.onend = () => {
        recording = false;
        micBtn.classList.remove('recording');
        descInput.value = descInput.value.trim();
        if (micHint.textContent.startsWith('🔴')) micHint.textContent = '';
    };

    micBtn.onclick = () => {
        if (recording) { recognition.stop(); return; }
        micHint.textContent = '';
        try {
            recognition.start();
        } catch (err) {
            micHint.textContent = '⚠️ Dettatura non avviabile. Serve una pagina https:// o localhost.';
        }
    };
}


// ===== CONFIGURAZIONE SUPABASE HARDCODED =====
// Inserisci qui i dati del tuo progetto (gli stessi della palestra)
const SUPA_URL = 'https://rvodpmmzwvvdcvsiqxhr.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2b2RwbW16d3Z2ZGN2c2lxeGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjA2NTksImV4cCI6MjA5OTU5NjY1OX0.hcQaVKdaKPfLsTaH896t1NjE3aXfdkxOBezoqWZ5iWA';

document.getElementById('s_codice').value = localStorage.getItem('supa_codice') || '';

// --- SALVA IN CLOUD (PUSH) ---
document.getElementById('supaForm').onsubmit = async (e) => {
    e.preventDefault();
    const codice = document.getElementById('s_codice').value.trim();
    if (!codice) return;
    localStorage.setItem('supa_codice', codice);
    closeModals();

    const btn = document.getElementById('btnSync');
    btn.textContent = "⏳";

    // "Sporchiamo" temporaneamente i dati con il codice per salvarli sul DB
    const payload = clients.map(c => ({ ...c, sync_code: codice }));

    try {
        const res = await fetch(`${SUPA_URL}/rest/v1/avanguardesk_clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPA_KEY,
                'Authorization': `Bearer ${SUPA_KEY}`,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            btn.textContent = "✅";
        } else {
            alert("Errore: Tabella non trovata o permessi errati.");
        }
    } catch (err) {
        alert("Errore di connessione.");
    }
    setTimeout(() => btn.textContent = "☁️", 2000);
};

// --- RECUPERA DAL CLOUD (PULL) ---
document.getElementById('btnPull').onclick = async () => {
    const codice = document.getElementById('s_codice').value.trim();
    if (!codice) { alert("Inserisci un codice prima di recuperare."); return; }
    localStorage.setItem('supa_codice', codice);
    closeModals();

    const btn = document.getElementById('btnSync');
    btn.textContent = "⏳";

    try {
        // Chiediamo a Supabase solo i clienti che hanno questo esatto codice
        const res = await fetch(`${SUPA_URL}/rest/v1/avanguardesk_clients?sync_code=eq.${encodeURIComponent(codice)}`, {
            method: 'GET',
            headers: {
                'apikey': SUPA_KEY,
                'Authorization': `Bearer ${SUPA_KEY}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
                // Puliamo i dati rimuovendo il sync_code prima di salvarli in locale
                clients = data.map(c => {
                    const { sync_code, ...rest } = c;
                    return rest;
                });
                render();
                btn.textContent = "✅";
            } else {
                alert("Nessun salvataggio trovato per questo codice.");
                btn.textContent = "☁️";
                return;
            }
        } else {
            alert("Errore di recupero dal server.");
        }
    } catch (err) {
        alert("Errore di connessione.");
    }
    setTimeout(() => btn.textContent = "☁️", 2000);
};

// ===== AVVIO INIZIALE =====
render();

// Registrazione Service Worker per uso Offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Fail: ', err));
    });
}
