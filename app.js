const STORAGE_KEY = 'avanguardesk_data';
let clients = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// Elementi DOM
const activeGrid = document.getElementById('activeClients');
const doneList = document.getElementById('doneClients');
const addModal = document.getElementById('addModal');
const detailModal = document.getElementById('detailModal');
const supaModal = document.getElementById('supaModal');

// Renderizza l'interfaccia
function render() {
    activeGrid.innerHTML = '';
    doneList.innerHTML = '';

    // Ordine di data in cui sono stati aggiunti (crescente per i nuovi in fondo)
    const active = clients.filter(c => c.status === 'active').sort((a, b) => a.dateAdded - b.dateAdded);
    const done = clients.filter(c => c.status === 'done').sort((a, b) => b.dateAdded - a.dateAdded);

    active.forEach(c => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openDetail(c);
        card.innerHTML = `
            <h3 class="card-name">${c.nome} ${c.cognome}</h3>
            <div class="card-desc">${c.descrizione || '...'}</div>
            <span class="card-location">📍 ${c.location || 'N/D'}</span>
            <button class="check-btn" onclick="completeClient('${c.id}', event)">✓</button>
        `;
        activeGrid.appendChild(card);
    });

    done.forEach(c => {
        const card = document.createElement('div');
        card.className = 'done-card';
        card.onclick = () => openDetail(c);
        card.innerHTML = `
            <div class="done-info">
                <h4 class="done-name">${c.nome} ${c.cognome}</h4>
                <span class="done-meta">📍 ${c.location || 'N/D'} | 📞 ${c.telefono || 'N/D'}</span>
            </div>
        `;
        doneList.appendChild(card);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

// Azioni
window.completeClient = (id, e) => {
    e.stopPropagation();
    const client = clients.find(c => c.id === id);
    if(client) client.status = 'done';
    render();
};

window.openDetail = (c) => {
    document.getElementById('d_nome').textContent = `${c.nome} ${c.cognome}`;
    document.getElementById('d_location').textContent = c.location || '-';
    document.getElementById('d_telefono').textContent = c.telefono || '-';
    document.getElementById('d_mail').textContent = c.mail || '-';
    document.getElementById('d_descrizione').textContent = c.descrizione || '-';
    detailModal.classList.add('active');
};

// Form di Aggiunta
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
    e.target.reset();
    closeModals();
    render();
};

// Gestione Modal
window.closeModals = () => document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
document.getElementById('fab').onclick = () => addModal.classList.add('active');
document.getElementById('btnSync').onclick = () => supaModal.classList.add('active');

// Inizializza Credenziali Supabase
document.getElementById('s_url').value = localStorage.getItem('supa_url') || '';
document.getElementById('s_key').value = localStorage.getItem('supa_key') || '';

// Sincronizzazione Supabase (REST API base)
document.getElementById('supaForm').onsubmit = async (e) => {
    e.preventDefault();
    const url = document.getElementById('s_url').value;
    const key = document.getElementById('s_key').value;
    localStorage.setItem('supa_url', url);
    localStorage.setItem('supa_key', key);
    closeModals();
    
    try {
        const btn = document.getElementById('btnSync');
        btn.textContent = "⏳";
        
        // UPSERT base verso una tabella 'avanguardesk_clients'
        const response = await fetch(`${url}/rest/v1/avanguardesk_clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(clients)
        });

        if(response.ok) {
            btn.textContent = "✅";
            setTimeout(() => btn.textContent = "☁️", 2000);
        } else {
            alert("Errore Sync: Controlla che esista la tabella avanguardesk_clients");
            btn.textContent = "☁️";
        }
    } catch(err) {
        alert("Errore di connessione.");
        document.getElementById('btnSync').textContent = "☁️";
    }
};

// Avvio Iniziale
render();

// Registrazione Service Worker per uso Offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Fail: ', err));
    });
}