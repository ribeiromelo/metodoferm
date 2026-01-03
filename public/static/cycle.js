// Logic for the Study Cycle and Timer
let timerInterval;
let secondsElapsed = 0;
let isRunning = false;
let currentSubject = null;

// DOM Elements
const els = {
    loader: document.getElementById('loader'),
    container: document.getElementById('study-container'),
    subjectTag: document.getElementById('subject-tag'),
    subjectName: document.getElementById('subject-name'),
    topicName: document.getElementById('topic-name'),
    targetTime: document.getElementById('target-time'),
    timerDisplay: document.getElementById('timer-display'),
    btnToggle: document.getElementById('btn-toggle'),
    btnStop: document.getElementById('btn-stop'),
    btnText: document.getElementById('btn-text'),
    modal: document.getElementById('finish-modal'),
    modalContent: document.getElementById('modal-content'),
    form: document.getElementById('session-form'),
    btnCancel: document.getElementById('btn-cancel'),
    topicSelect: document.getElementById('topic-select')
};

// Initialize
async function init() {
    try {
        const res = await fetch('/api/cycle/next');
        const data = await res.json();
        
        if (data.next_subject) {
            setupUI(data);
            currentSubject = data.next_subject;
        } else {
            alert('Erro ao carregar ciclo. Verifique se há matérias cadastradas.');
            window.location.href = '/';
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão.');
    } finally {
        els.loader.classList.add('hidden');
        els.container.style.display = 'flex';
    }
}

function setupUI(data) {
    const { next_subject, suggested_topic, available_topics } = data;
    
    // Set Headers
    els.subjectName.textContent = next_subject.subject_name;
    els.subjectTag.textContent = next_subject.subject_name;
    els.subjectTag.style.color = next_subject.subject_color;
    els.subjectTag.style.borderColor = next_subject.subject_color;
    els.subjectTag.style.backgroundColor = next_subject.subject_color + '20'; // Opacity 20%
    
    els.targetTime.textContent = `${next_subject.duration_minutes} min`;
    
    if (suggested_topic) {
        els.topicName.textContent = `Foco: ${suggested_topic.name}`;
    } else {
        els.topicName.textContent = 'Revisão Geral / Questões';
    }

    // Populate Select
    els.topicSelect.innerHTML = '<option value="">Estudo Geral / Sem Tópico Específico</option>';
    if (available_topics && available_topics.length > 0) {
        available_topics.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            if (suggested_topic && t.id === suggested_topic.id) opt.selected = true;
            els.topicSelect.appendChild(opt);
        });
    }
}

function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function toggleTimer() {
    if (isRunning) {
        // Pause
        clearInterval(timerInterval);
        isRunning = false;
        els.btnText.textContent = "Continuar";
        els.btnToggle.querySelector('i').className = "fas fa-play";
        els.btnToggle.classList.remove('bg-yellow-500');
        els.btnToggle.classList.add('bg-blue-600');
    } else {
        // Start
        isRunning = true;
        els.btnStop.disabled = false;
        els.btnStop.classList.remove('opacity-50');
        
        els.btnText.textContent = "Pausar";
        els.btnToggle.querySelector('i').className = "fas fa-pause";
        els.btnToggle.classList.remove('bg-blue-600');
        els.btnToggle.classList.add('bg-yellow-500'); // Pause color
        
        timerInterval = setInterval(() => {
            secondsElapsed++;
            els.timerDisplay.textContent = formatTime(secondsElapsed);
        }, 1000);
    }
}

function stopTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    // Open Modal
    els.modal.classList.remove('hidden');
    // Simple animation
    setTimeout(() => {
        els.modalContent.classList.remove('scale-95', 'opacity-0');
        els.modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

// Event Listeners
els.btnToggle.addEventListener('click', toggleTimer);
els.btnStop.addEventListener('click', stopTimer);

els.btnCancel.addEventListener('click', () => {
    // Close Modal and Resume logic if needed, but usually cancel means discard? 
    // For now just close
    els.modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        els.modal.classList.add('hidden');
    }, 300);
});

els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        subject_id: currentSubject.subject_id,
        topic_id: els.topicSelect.value || null,
        duration_seconds: secondsElapsed,
        questions_total: document.getElementById('q-total').value,
        questions_correct: document.getElementById('q-correct').value,
        notes: document.getElementById('notes').value
    };

    try {
        const res = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            window.location.href = '/'; // Go back to dashboard
        } else {
            alert('Erro ao salvar sessão');
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao salvar');
    }
});

// Run
init();
