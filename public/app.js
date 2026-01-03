/**
 * StudyFlow - Application Logic (v6.3 - Final History Fix - Stable)
 */

// --- AUTH CHECK ---
const currentUser = JSON.parse(localStorage.getItem('studyflow_user') || 'null');
if (!currentUser) {
    window.location.href = '/landing.html';
}

// --- AUTH OBJECT ---
const auth = {
    async logout() {
        if(await ui.confirm('Sair do Sistema', 'Tem certeza que deseja desconectar?')) {
            localStorage.removeItem('studyflow_user');
            window.location.href = '/landing.html';
        }
    }
};

// --- UI HELPERS ---
const ui = {
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    },
    
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    },

    async confirm(title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            const el = document.createElement('div');
            el.className = 'fixed inset-0 bg-slate-900/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in';
            el.innerHTML = `
                <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 transform transition-all scale-100 animate-scale-in">
                    <h3 class="text-xl font-bold text-slate-900 mb-3">${title}</h3>
                    <p class="text-slate-500 mb-8 leading-relaxed">${message}</p>
                    <div class="flex gap-3">
                        ${cancelText ? `<button id="btn-cancel" class="flex-1 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition-colors">${cancelText}</button>` : ''}
                        <button id="btn-confirm" class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105">${confirmText}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(el);

            const close = (result) => {
                el.remove();
                resolve(result);
            };

            el.querySelector('#btn-confirm').onclick = () => close(true);
            if (cancelText) el.querySelector('#btn-cancel').onclick = () => close(false);
        });
    },

    toast(message, type = 'success') {
        const el = document.createElement('div');
        const color = type === 'success' ? 'bg-green-600' : 'bg-red-500';
        el.className = `fixed bottom-6 right-6 md:bottom-10 md:right-10 ${color} text-white px-6 py-4 rounded-2xl shadow-xl shadow-slate-200 font-bold z-[120] animate-slide-up flex items-center gap-3`;
        el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} text-xl"></i> ${message}`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
};

// --- API HELPER ---
const api = {
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id
        };
    },
    async get(endpoint) {
        const res = await fetch(`/api${endpoint}`, { headers: this.getHeaders() });
        if (res.status === 401) window.location.href = '/landing.html';
        return res.json();
    },
    async post(endpoint, data) {
        const res = await fetch(`/api${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    },
    async delete(endpoint) {
        const res = await fetch(`/api${endpoint}`, { 
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return res.json();
    },
    async patch(endpoint, data = {}) {
        const res = await fetch(`/api${endpoint}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    }
};

// --- ROUTER ---
const router = {
    navigate(viewName) {
        if(window.innerWidth < 1024) ui.closeSidebar();

        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`view-${viewName}`);
        
        if (target) {
            if (viewName === 'timer') {
                target.classList.remove('hidden');
                target.classList.add('flex');
            } else {
                target.classList.remove('hidden');
                document.getElementById('view-timer').classList.add('hidden');
                document.getElementById('view-timer').classList.remove('flex');
            }
            
            document.querySelectorAll('.nav-item').forEach(el => {
                el.classList.remove('bg-blue-50', 'text-blue-600');
                el.classList.add('text-slate-500');
            });
            
            const navBtn = document.querySelector(`button[data-target="view-${viewName}"]`);
            if (navBtn) {
                navBtn.classList.add('bg-blue-50', 'text-blue-600');
                navBtn.classList.remove('text-slate-500');
            }

            if (viewName === 'dashboard') dashboard.load();
            if (viewName === 'cycle') cycleManager.load();
            if (viewName === 'subjects') subjectsManager.load();
            if (viewName === 'revisions') revisionsManager.load();
            if (viewName === 'profile') profileManager.load();
        }
    }
};

// --- PROFILE MANAGER ---
const profileManager = {
    async load() {
        const data = await api.get('/user/profile');
        
        // Populate Header
        document.getElementById('profile-name').innerText = data.user.name;
        document.getElementById('profile-nickname').innerText = data.user.nickname || `@${data.user.name.split(' ')[0].toLowerCase()}`;
        document.getElementById('profile-level').innerText = data.gamification.level;
        
        // Avatar & Cover
        const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${data.user.avatar_id || '1'}&backgroundColor=e0e7ff`;
        document.querySelector('#profile-avatar-container img').src = avatarUrl;
        
        // XP Bar
        document.getElementById('profile-xp-text').innerText = `${data.gamification.total_questions} / ${data.gamification.next_goal} Questões`;
        document.getElementById('profile-xp-bar').style.width = `${data.gamification.progress}%`;
        
        // Next Badge
        let nextBadge = "Lenda";
        const total = data.gamification.total_questions;
        if(total < 100) nextBadge = "Aprendiz";
        else if(total < 500) nextBadge = "Praticante";
        else if(total < 1000) nextBadge = "Veterano";
        else if(total < 2500) nextBadge = "Elite";
        else if(total < 5000) nextBadge = "Mestre";
        
        document.getElementById('profile-next-badge').innerText = nextBadge;

        // Populate Form
        document.getElementById('input-nickname').value = data.user.nickname || '';
        this.renderAvatarSelector(data.user.avatar_id || '1');
    },

    renderAvatarSelector(currentId) {
        const container = document.getElementById('avatar-selector');
        container.innerHTML = '';
        const seeds = ['Felix', 'Aneka', 'Bandit', 'Bella', 'Buster', 'Coco', 'Cookie', 'Gizmo', 'Jack', 'Leo', 'Loki', 'Luna'];
        
        seeds.forEach(seed => {
            const url = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=e0e7ff`;
            const div = document.createElement('div');
            const isSelected = seed === currentId;
            div.className = `w-12 h-12 rounded-full border-2 cursor-pointer overflow-hidden transition-all hover:scale-110 ${isSelected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent'}`;
            div.innerHTML = `<img src="${url}" class="w-full h-full">`;
            div.onclick = () => {
                document.getElementById('input-avatar-id').value = seed;
                this.renderAvatarSelector(seed); // Re-render to update selection
            };
            container.appendChild(div);
        });
        
        // Set initial hidden input
        if(!document.getElementById('input-avatar-id').value) {
            document.getElementById('input-avatar-id').value = currentId;
        }
    },

    async saveSettings(e) {
        e.preventDefault();
        const nickname = document.getElementById('input-nickname').value;
        const avatarId = document.getElementById('input-avatar-id').value;
        const password = document.getElementById('input-password').value;

        // Update Profile Info
        await api.patch('/user/profile', { nickname, avatar_id: avatarId });
        
        // Update Password if provided
        if(password) {
            const res = await api.patch('/user/password', { password });
            if(!res.success) {
                ui.toast(res.error, 'error');
                return;
            }
        }

        ui.toast('Perfil atualizado com sucesso! ✨');
        this.load();
        
        // Update Sidebar info immediately
        document.getElementById('user-name-display').innerText = nickname || currentUser.name;
        
        // Update Sidebar Avatar immediately
        const avatarContainer = document.querySelector('.border-t .w-10');
        if (avatarContainer) {
            const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${avatarId}&backgroundColor=e0e7ff`;
            avatarContainer.innerHTML = `<img src="${avatarUrl}" class="w-full h-full rounded-full object-cover">`;
            avatarContainer.classList.remove('bg-white', 'border-slate-200', 'text-slate-400');
            avatarContainer.classList.add('bg-indigo-50', 'border-indigo-100');
        }

        // Update LocalStorage to persist changes
        const updatedUser = { ...currentUser, nickname: nickname, avatar_id: avatarId };
        localStorage.setItem('studyflow_user', JSON.stringify(updatedUser));
    },
    
    toggleEditMode() {
        // Scroll to form
        document.querySelector('form').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('input-nickname').focus();
    }
};

// --- DASHBOARD ---
const dashboard = {
    charts: {},
    async load() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').innerText = new Date().toLocaleDateString('pt-BR', options);

        const data = await api.get('/stats');
        this.updateCards(data);
        this.renderDistributionChart(data.performance);
        this.renderActivityChart(data.activity);
        this.renderTopSubjects(data.performance);
    },

    updateCards(data) {
        // Today
        const seconds = data.today?.total_seconds || 0;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        document.getElementById('dash-today-time').innerText = `${h}h ${m}m`;
        document.getElementById('dash-today-sessions').innerText = `${data.today?.sessions_count || 0} sessões`;

        // Lifetime (Total Time)
        const totalSeconds = data.lifetime?.total_seconds || 0;
        const totalH = Math.floor(totalSeconds / 3600);
        const totalM = Math.floor((totalSeconds % 3600) / 60);
        document.getElementById('dash-total-time').innerText = `${totalH}h ${totalM}m`;

        // Accuracy
        let totalQ = 0;
        let correctQ = 0;
        data.performance.forEach(p => {
            totalQ += p.q_total || 0;
            correctQ += p.q_correct || 0;
        });
        const acc = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;
        document.getElementById('dash-accuracy').innerText = `${acc}%`;
        document.getElementById('dash-acc-bar').style.width = `${acc}%`;
        
        // Questions (Total Lifetime)
        document.getElementById('dash-questions').innerText = totalQ;
    },

    renderTopSubjects(performance) {
        const container = document.getElementById('top-subjects-list');
        const sorted = [...performance].sort((a, b) => (b.total_time || 0) - (a.total_time || 0)).slice(0, 5);
        
        container.innerHTML = '';
        
        if (sorted.length === 0 || sorted[0].total_time === 0) {
            container.innerHTML = '<div class="text-center py-8 text-slate-400"><i class="fas fa-chart-bar text-2xl mb-2"></i><p class="text-sm">Sem dados suficientes.</p></div>';
            return;
        }

        sorted.forEach((sub, index) => {
            if (sub.total_time > 0) {
                const h = Math.floor(sub.total_time / 3600);
                const m = Math.floor((sub.total_time % 3600) / 60);
                
                const el = document.createElement('div');
                el.className = 'flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100';
                el.innerHTML = `
                    <div class="flex-shrink-0 font-bold text-slate-400 w-4 text-center">#${index + 1}</div>
                    <div class="w-2 h-8 rounded-full" style="background-color: ${sub.color || '#cbd5e1'}"></div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-slate-700 truncate">${sub.name}</p>
                        <p class="text-xs text-slate-500">${h}h ${m}m estudados</p>
                    </div>
                `;
                container.appendChild(el);
            }
        });
    },

    renderDistributionChart(performance) {
        const ctx = document.getElementById('chart-distribution').getContext('2d');
        if (this.charts.distribution) this.charts.distribution.destroy();
        
        const sortedPerf = [...performance].sort((a, b) => (b.q_total || 0) - (a.q_total || 0)).slice(0, 5);

        this.charts.distribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedPerf.map(p => p.name),
                datasets: [
                    {
                        label: 'Acertos',
                        data: sortedPerf.map(p => p.q_correct || 0),
                        backgroundColor: '#22c55e',
                        borderRadius: 4
                    },
                    {
                        label: 'Erros',
                        data: sortedPerf.map(p => (p.q_total || 0) - (p.q_correct || 0)),
                        backgroundColor: '#ef4444',
                        borderRadius: 4
                    }
                ]
            },
            options: { 
                indexAxis: 'y',
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, grid: { display: false } }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    },

    renderActivityChart(activity) {
        const ctx = document.getElementById('chart-activity').getContext('2d');
        if (this.charts.activity) this.charts.activity.destroy();
        const labels = [];
        const data = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.getDate() + '/' + (d.getMonth() + 1));
            const found = activity.find(a => a.study_date === dateStr);
            data.push(found ? (found.seconds / 60) : 0);
        }
        this.charts.activity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Minutos', data: data, backgroundColor: '#3b82f6', borderRadius: 4, hoverBackgroundColor: '#1d4ed8' }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
};

// --- SUBJECTS MANAGER ---
const subjectsManager = {
    async load() {
        const subjects = await api.get('/subjects');
        const grid = document.getElementById('subjects-grid');
        grid.innerHTML = '';
        if(subjects.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                <i class="fas fa-book-open text-4xl mb-4 opacity-50"></i>
                <p>Nenhuma matéria cadastrada.</p>
                <button onclick="subjectsManager.openAddModal()" class="text-blue-600 font-bold mt-2 hover:underline">Começar agora</button>
            </div>`;
        }
        for (const sub of subjects) {
            grid.appendChild(await this.createSubjectCard(sub));
        }
    },

    async createSubjectCard(sub) {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group';
        div.innerHTML = `
            <div class="p-5 border-b border-slate-50 flex justify-between items-center relative overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-1.5" style="background-color: ${sub.color}"></div>
                <h3 class="font-bold text-slate-800 text-lg pl-2">${sub.name}</h3>
                <button onclick="subjectsManager.deleteSubject(${sub.id})" class="w-8 h-8 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center"><i class="fas fa-trash-alt text-sm"></i></button>
            </div>
            <div class="p-5 bg-slate-50/50 h-full">
                <div id="topics-list-${sub.id}" class="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    <div class="flex items-center justify-center h-10">
                         <i class="fas fa-circle-notch fa-spin text-slate-300"></i>
                    </div>
                </div>
                <div class="flex gap-2">
                    <input type="text" id="new-topic-${sub.id}" placeholder="Novo assunto..." class="flex-1 text-sm p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                    <button onclick="subjectsManager.addTopic(${sub.id})" class="bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 w-10 rounded-xl transition-all shadow-sm"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        `;
        this.loadTopics(sub.id);
        return div;
    },

    async loadTopics(subjectId) {
        const topics = await api.get(`/subjects/${subjectId}/topics`);
        const container = document.getElementById(`topics-list-${subjectId}`);
        container.innerHTML = '';
        if (topics.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-400 italic text-center py-2">Nenhum assunto ainda.</p>';
            return;
        }
        topics.forEach(t => {
            const el = document.createElement('div');
            el.className = 'flex items-center gap-3 text-sm group bg-white p-2 rounded-lg border border-transparent hover:border-slate-200 transition-all';
            el.innerHTML = `
                <button onclick="subjectsManager.toggleTopic(${t.id}, ${subjectId})" class="flex-shrink-0 w-5 h-5 rounded-md border ${t.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 text-transparent hover:border-blue-400'} flex items-center justify-center transition-all">
                    <i class="fas fa-check text-[10px]"></i>
                </button>
                <span class="${t.is_completed ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'} truncate select-none cursor-pointer flex-1" onclick="subjectsManager.toggleTopic(${t.id}, ${subjectId})">${t.name}</span>
            `;
            container.appendChild(el);
        });
    },

    async addTopic(subjectId) {
        const input = document.getElementById(`new-topic-${subjectId}`);
        if (!input.value.trim()) return;
        await api.post('/topics', { subject_id: subjectId, name: input.value });
        input.value = '';
        this.loadTopics(subjectId);
    },

    async toggleTopic(topicId, subjectId) {
        await api.patch(`/topics/${topicId}/toggle`);
        this.loadTopics(subjectId);
    },

    async deleteSubject(id) {
        if (await ui.confirm('Excluir Matéria', 'Tem certeza? Isso apagará todo histórico dessa matéria.', 'Excluir', 'Cancelar')) {
            await api.delete(`/subjects/${id}`);
            this.load();
            ui.toast('Matéria excluída');
        }
    },

    openAddModal() {
        document.getElementById('modal-add-subject').classList.remove('hidden');
        document.getElementById('modal-add-subject').classList.add('flex');
    },

    closeAddModal() {
        document.getElementById('modal-add-subject').classList.add('hidden');
        document.getElementById('modal-add-subject').classList.remove('flex');
    },

    async createSubject(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        // Pega do input hidden ou fallback pro azul
        const color = document.getElementById('subject-color-input').value || '#3b82f6';
        
        await api.post('/subjects', { name: formData.get('name'), color: color });
        this.closeAddModal();
        this.load();
        ui.toast('Matéria criada com sucesso!');
    },

    selectColor(btn, color) {
        // 1. Update Input
        document.getElementById('subject-color-input').value = color;

        // 2. Visual Update
        const container = document.getElementById('color-picker-container');
        const buttons = container.querySelectorAll('button');

        buttons.forEach(b => {
            // Reset styles
            b.className = `w-12 h-12 rounded-full hover:scale-110 transition-transform ring-transparent ring-offset-2 hover:ring-4 hover:ring-gray-100`;
            b.style.backgroundColor = b.getAttribute('onclick').match(/'(#[0-9a-f]{6})'/)[1]; // Restore bg from onclick param
            b.querySelector('i').classList.add('hidden');
        });

        // Set Active Style
        btn.className = `w-12 h-12 rounded-full hover:scale-110 transition-transform ring-4 ring-offset-2`;
        btn.style.backgroundColor = color;
        
        // Dynamic ring color based on selection
        let ringColor = 'ring-gray-300';
        if(color === '#3b82f6') ringColor = 'ring-blue-200';
        if(color === '#ef4444') ringColor = 'ring-red-200';
        if(color === '#22c55e') ringColor = 'ring-green-200';
        if(color === '#eab308') ringColor = 'ring-yellow-200';
        if(color === '#a855f7') ringColor = 'ring-purple-200';
        
        btn.classList.add(ringColor);
        btn.querySelector('i').classList.remove('hidden');
    }
};

// --- CYCLE MANAGER ---
const cycleManager = {
    async load() {
        const cycle = await api.get('/cycle');
        const list = document.getElementById('cycle-list');
        const empty = document.getElementById('cycle-empty');
        const nextCard = document.getElementById('cycle-next-card');

        list.innerHTML = '';
        if (cycle.length === 0) {
            empty.classList.remove('hidden');
            nextCard.classList.add('hidden');
            return;
        }

        empty.classList.add('hidden');
        nextCard.classList.remove('hidden');

        // Logic: Find next pending item
        const today = new Date().toLocaleDateString('en-CA');
        const isStudiedToday = (utcString) => {
            if (!utcString) return false;
            const studiedDate = new Date(utcString.replace(' ', 'T') + 'Z'); 
            return studiedDate.toLocaleDateString('en-CA') === today;
        };
        
        const pendingItems = cycle.filter(item => !isStudiedToday(item.last_studied_at));
        const next = pendingItems.length > 0 ? pendingItems[0] : null;
        
        // All done check
        const allDone = pendingItems.length === 0 && cycle.length > 0;

        if (allDone) {
            // UI All Done - Show Finish Day Button
            document.getElementById('cycle-next-subject').innerText = "Ciclo Concluído!";
            document.getElementById('cycle-next-duration').innerText = "0";
            const btn = document.getElementById('btn-start-cycle');
            btn.innerHTML = '<i class="fas fa-flag-checkered text-lg"></i> <span>Encerrar por Hoje</span>';
            btn.className = "w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-green-200 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3";
            btn.onclick = () => cycleManager.finishDay();
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            // UI Normal - Show Start Button
            document.getElementById('cycle-next-subject').innerText = next.subject_name;
            document.getElementById('cycle-next-duration').innerText = next.duration_minutes;
            const btn = document.getElementById('btn-start-cycle');
            btn.innerHTML = '<i class="fas fa-play text-lg"></i> <span>Começar Agora</span>';
            btn.className = "w-full md:w-auto bg-white text-blue-700 hover:bg-blue-50 font-bold py-4 px-8 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3";
            btn.onclick = () => timer.start(next.subject_id, next.subject_name, next.duration_minutes);
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        cycle.forEach((item, index) => {
            const isDone = isStudiedToday(item.last_studied_at);
            const isNext = !allDone && next && item.id === next.id;
            
            const el = document.createElement('div');
            
            let bgClass = 'bg-white';
            let borderClass = 'border-l-4 border-transparent';
            let textClass = 'text-slate-800';
            
            if (isDone) {
                bgClass = 'bg-slate-50 opacity-60';
                borderClass = 'border-l-4 border-green-500';
                textClass = 'text-slate-400 line-through';
            } else if (isNext) {
                bgClass = 'bg-blue-50/50';
                borderClass = 'border-l-4 border-blue-500';
            }

            el.className = `p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group ${borderClass} ${bgClass} first:rounded-t-none last:rounded-b-2xl`;
            
            el.innerHTML = `
                <div class="flex items-center gap-5">
                    <span class="text-slate-300 font-mono text-sm w-6 font-bold text-right">${index + 1}</span>
                    <div class="w-3 h-3 rounded-full shadow-sm ring-2 ring-white" style="background-color: ${item.subject_color}"></div>
                    <div>
                        <p class="font-bold text-lg ${textClass}">${item.subject_name}</p>
                        <p class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                            ${isDone ? '<i class="fas fa-check text-green-500 mr-1"></i> Concluído hoje' : `${item.duration_minutes} min`}
                        </p>
                    </div>
                </div>
                <button onclick="cycleManager.deleteItem(${item.id})" class="w-10 h-10 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"><i class="fas fa-trash-alt"></i></button>
            `;
            list.appendChild(el);
        });

        // Load History
        this.loadHistory();
    },

    async loadHistory() {
        const history = await api.get('/cycle/history');
        const container = document.getElementById('cycle-history-list');
        container.innerHTML = '';

        if (!history || history.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-sm">Nenhum histórico registrado.</p>';
            return;
        }

        history.forEach(day => {
            // Parse date manually to avoid timezone shift
            const [y_str, m_str, d_str] = day.date.split('-');
            const date = new Date(y_str, m_str-1, d_str).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
            
            const hours = Math.floor(day.total_minutes / 60);
            const minutes = day.total_minutes % 60; // Renamed 'm' to 'minutes'

            const el = document.createElement('div');
            el.className = 'bg-white p-4 rounded-xl border border-slate-100 flex flex-col gap-2 opacity-75 hover:opacity-100 transition-opacity';
            el.innerHTML = `
                <div class="flex items-center justify-between w-full">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                            <i class="fas fa-check"></i>
                        </div>
                        <div>
                            <p class="font-bold text-slate-800">${date}</p>
                            <p class="text-xs text-slate-500">${day.total_subjects} matérias concluídas</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold text-slate-700">${hours}h ${minutes}m</p>
                        <span class="text-[10px] uppercase tracking-wide text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">Finalizado</span>
                    </div>
                </div>
                ${day.subjects_text ? `<div class="pl-14 text-xs text-slate-400 border-t border-slate-50 pt-2 w-full truncate"><i class="fas fa-book mr-1"></i> ${day.subjects_text}</div>` : ''}
            `;
            container.appendChild(el);
        });
    },

    async deleteItem(id) {
        if (await ui.confirm('Remover do Ciclo', 'Deseja remover esta matéria da fila?')) {
            await api.delete(`/cycle/${id}`);
            this.load();
        }
    },

    async openAddModal() {
        const subjects = await api.get('/subjects');
        if (subjects.length === 0) {
            ui.toast('Cadastre matérias primeiro!', 'error');
            router.navigate('subjects');
            return;
        }
        const select = document.getElementById('cycle-subject-select');
        select.innerHTML = '';
        subjects.forEach(s => { select.innerHTML += `<option value="${s.id}">${s.name}</option>`; });
        document.getElementById('modal-add-cycle').classList.remove('hidden');
        document.getElementById('modal-add-cycle').classList.add('flex');
    },

    closeAddModal() {
        document.getElementById('modal-add-cycle').classList.add('hidden');
        document.getElementById('modal-add-cycle').classList.remove('flex');
    },

    async addToCycle(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        await api.post('/cycle', { subject_id: formData.get('subject_id'), duration_minutes: formData.get('duration') });
        this.closeAddModal();
        this.load();
        ui.toast('Adicionado à fila!');
    },

    async finishDay() {
        if(await ui.confirm('Encerrar Ciclo', 'Deseja finalizar o dia e salvar no histórico?')) {
            // Get Local Date (YYYY-MM-DD) correctly
            const localDate = new Date().toLocaleDateString('en-CA');
            const res = await api.post('/cycle/finish', { date: localDate });
            if(res.success) {
                ui.toast('Ciclo do dia finalizado! Bom descanso. 🌙');
                this.load(); // Reload to show history
            } else {
                ui.toast(res.message || 'Erro ao finalizar', 'error');
            }
        }
    }
};

// --- REVISIONS MANAGER ---
const revisionsManager = {
    async load() {
        const revisions = await api.get('/revisions');
        const container = document.getElementById('revisions-list');
        const empty = document.getElementById('revisions-empty');
        
        container.innerHTML = '';
        
        if (revisions.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        revisions.forEach(rev => {
            // Fix Timezone Display: Append 'Z' to treat DB time as UTC
            const dateStr = rev.created_at.endsWith('Z') ? rev.created_at : rev.created_at + 'Z';
            const date = new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            
            const h = Math.floor(rev.duration_seconds / 3600);
            const minutes = Math.floor((rev.duration_seconds % 3600) / 60);
            
            // Format Method Name
            let methodLabel = rev.method;
            if(rev.method === 'questions') methodLabel = 'Questões';
            if(rev.method === 'flashcard') methodLabel = 'Flashcards';
            if(rev.method === 'summary') methodLabel = 'Resumo';
            if(rev.method === 'class') methodLabel = 'Aula';

            const el = document.createElement('div');
            el.className = 'p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors';
            el.innerHTML = `
                <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-history"></i>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-slate-800">${rev.subject_name}</h4>
                        <span class="text-xs text-slate-400">${date}</span>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-1 mb-2">
                        <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">${methodLabel}</span>
                        <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200"><i class="far fa-clock mr-1"></i>${h}h ${minutes}m</span>
                        ${rev.questions_total > 0 ? `<span class="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-bold">${rev.questions_correct}/${rev.questions_total} Acertos</span>` : ''}
                    </div>
                    ${rev.notes ? `<p class="text-sm text-slate-500 bg-yellow-50/50 p-2 rounded-lg border border-yellow-100/50 italic">"${rev.notes}"</p>` : ''}
                </div>
            `;
            container.appendChild(el);
        });
    },

    async openStartModal() {
        const subjects = await api.get('/subjects');
        if (subjects.length === 0) {
            ui.toast('Cadastre matérias primeiro!', 'error');
            return;
        }
        
        const modalHtml = `
            <div id="modal-pick-revision" class="fixed inset-0 bg-slate-900/60 z-[130] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-scale-in relative">
                    <button onclick="document.getElementById('modal-pick-revision').remove()" class="absolute top-4 right-4 text-slate-300 hover:text-slate-500"><i class="fas fa-times"></i></button>
                    <h3 class="text-xl font-bold text-slate-800 mb-6">Iniciar Revisão</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">Qual matéria?</label>
                            <select id="revision-subject-select" class="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                                ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                            </select>
                        </div>
                        <button id="btn-start-rev" class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all">Começar</button>
                    </div>
                </div>
            </div>
        `;
        
        const el = document.createElement('div');
        el.innerHTML = modalHtml;
        document.body.appendChild(el.firstElementChild);
        
        document.getElementById('btn-start-rev').onclick = () => {
            const select = document.getElementById('revision-subject-select');
            const subjectId = select.value;
            const subjectName = select.options[select.selectedIndex].text;
            
            document.getElementById('modal-pick-revision').remove();
            
            // Start Timer in Revision Mode
            timer.start(subjectId, subjectName, 0, true); // true = isRevision
        };
    }
};

// --- TIMER ---
const timer = {
    interval: null,
    state: {
        active: false,
        isRevision: false,
        subjectId: null,
        subjectName: null,
        startTime: null,
        elapsed: 0,
        paused: true, // Start paused to allow setup
        mode: 'stopwatch', // 'stopwatch' | 'countdown'
        targetSeconds: 3600 // Default 60 min for countdown
    },

    init() {
        const saved = localStorage.getItem('studyflow_timer');
        if (saved) {
            this.state = JSON.parse(saved);
            if (this.state.active) {
                this.restoreUI();
                if (!this.state.paused) {
                    this.startTicker();
                } else {
                    this.updateDisplay();
                }
                router.navigate('timer');
                this.loadTopicsForSession(this.state.subjectId);
            }
        }
    },

    saveState() {
        localStorage.setItem('studyflow_timer', JSON.stringify(this.state));
    },

    clearState() {
        this.state = { 
            active: false, isRevision: false, subjectId: null, subjectName: null, 
            startTime: null, elapsed: 0, paused: true, mode: 'stopwatch', targetSeconds: 3600 
        };
        localStorage.removeItem('studyflow_timer');
        document.getElementById('mobile-timer-indicator').classList.add('hidden');
    },

    start(subjectId, subjectName, plannedMinutes, isRevision = false) {
        this.state = {
            active: true,
            isRevision: isRevision,
            subjectId: subjectId,
            subjectName: subjectName,
            startTime: Date.now(),
            elapsed: 0,
            paused: true, // Start paused so user can choose mode
            mode: 'stopwatch',
            targetSeconds: (plannedMinutes > 0 ? plannedMinutes : 60) * 60
        };
        
        // Reset UI to Stopwatch
        this.setMode('stopwatch');
        
        this.saveState();
        this.restoreUI();
        router.navigate('timer');
        this.loadTopicsForSession(subjectId);
    },

    setMode(mode) {
        this.state.mode = mode;
        const btnStop = document.getElementById('btn-mode-stopwatch');
        const btnCount = document.getElementById('btn-mode-countdown');
        const inputContainer = document.getElementById('timer-input-container');

        if (mode === 'stopwatch') {
            btnStop.className = "px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white text-indigo-600 shadow-sm";
            btnCount.className = "px-4 py-2 rounded-lg text-sm font-bold transition-all text-slate-500 hover:text-indigo-600";
            inputContainer.classList.add('hidden');
        } else {
            btnCount.className = "px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white text-indigo-600 shadow-sm";
            btnStop.className = "px-4 py-2 rounded-lg text-sm font-bold transition-all text-slate-500 hover:text-indigo-600";
            // Show input to edit time initially
            if (this.state.elapsed === 0) {
                inputContainer.classList.remove('hidden');
                document.getElementById('timer-input-min').value = Math.floor(this.state.targetSeconds / 60);
                document.getElementById('timer-input-min').focus();
            }
        }
        this.updateDisplay();
        this.saveState();
    },

    editTime() {
        if (this.state.mode === 'countdown' && this.state.paused) {
            document.getElementById('timer-input-container').classList.remove('hidden');
            document.getElementById('timer-input-min').value = Math.floor(this.state.targetSeconds / 60);
            document.getElementById('timer-input-min').focus();
        }
    },

    saveTime() {
        const mins = parseInt(document.getElementById('timer-input-min').value) || 1;
        this.state.targetSeconds = mins * 60;
        this.state.elapsed = 0; // Reset progress if time changed
        document.getElementById('timer-input-container').classList.add('hidden');
        this.updateDisplay();
        this.saveState();
    },

    restoreUI() {
        document.getElementById('timer-subject-display').innerText = (this.state.isRevision ? '[Revisão] ' : '') + this.state.subjectName;
        
        const btnToggle = document.getElementById('btn-timer-toggle');
        if (this.state.paused) {
            btnToggle.innerHTML = '<i class="fas fa-play pl-1"></i>';
        } else {
            btnToggle.innerHTML = '<i class="fas fa-pause"></i>';
        }

        const mobInd = document.getElementById('mobile-timer-indicator');
        mobInd.classList.remove('hidden');
        mobInd.classList.add('flex');
        
        // Update header color based on mode
        const headerBadge = document.querySelector('#view-timer .text-center span');
        if(this.state.isRevision) {
            headerBadge.className = "text-[10px] uppercase tracking-widest text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full";
            headerBadge.innerText = "Modo Revisão";
        } else {
            headerBadge.className = "text-[10px] uppercase tracking-widest text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full";
            headerBadge.innerText = "Foco Total";
        }
        
        this.setMode(this.state.mode); // Restore tabs
    },

    startTicker() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            if (!this.state.paused) {
                this.state.elapsed++;
                
                // Countdown Finished Check
                if (this.state.mode === 'countdown' && this.state.elapsed >= this.state.targetSeconds) {
                    this.state.paused = true;
                    this.state.elapsed = this.state.targetSeconds; // Clamp
                    this.updateDisplay();
                    this.finish(); // Auto finish/open modal
                    ui.toast('Tempo esgotado! Bom trabalho. ⏰');
                    // Play sound here if desired
                }

                if(this.state.elapsed % 5 === 0) this.saveState(); 
                this.updateDisplay();
            }
        }, 1000);
    },

    updateDisplay() {
        let displaySeconds = this.state.elapsed;
        
        // If countdown, show remaining time
        if (this.state.mode === 'countdown') {
            displaySeconds = Math.max(0, this.state.targetSeconds - this.state.elapsed);
        }

        const h = Math.floor(displaySeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((displaySeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (displaySeconds % 60).toString().padStart(2, '0');
        
        const display = document.getElementById('timer-display');
        if(display) display.innerText = `${h}:${m}:${s}`;
        
        document.title = `(${h}:${m}) Método FERM`;

        const mobTime = document.getElementById('mobile-timer-time');
        if(mobTime) mobTime.innerText = `${h}:${m}:${s}`;
    },

    toggle() {
        // If countdown and time is up, reset elapsed? No, just finish.
        if (this.state.mode === 'countdown' && this.state.elapsed >= this.state.targetSeconds) {
            this.finish();
            return;
        }

        this.state.paused = !this.state.paused;
        const btnToggle = document.getElementById('btn-timer-toggle');
        
        if (this.state.paused) {
            btnToggle.innerHTML = '<i class="fas fa-play pl-1"></i>';
            clearInterval(this.interval);
        } else {
            btnToggle.innerHTML = '<i class="fas fa-pause"></i>';
            this.startTicker();
        }
        this.saveState();
    },

    minimize() {
        if(this.state.isRevision) router.navigate('revisions');
        else router.navigate('dashboard');
    },

    async cancel() {
        if (await ui.confirm('Cancelar Sessão', 'Todo o progresso será perdido.', 'Sim, cancelar', 'Não')) {
            clearInterval(this.interval);
            const wasRev = this.state.isRevision;
            this.clearState();
            document.title = 'Método FERM';
            if(wasRev) router.navigate('revisions');
            else router.navigate('dashboard');
        }
    },

    finish() {
        clearInterval(this.interval);
        this.state.paused = true; 
        
        // Inject Revision specific fields if needed
        const form = document.getElementById('form-finish-session');
        const container = form.querySelector('.grid');
        
        // Remove existing method select if present to avoid dupes
        const existingMethod = document.getElementById('finish-method-select');
        if(existingMethod) existingMethod.parentElement.remove();

        if(this.state.isRevision) {
            const methodDiv = document.createElement('div');
            methodDiv.className = 'col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100';
            methodDiv.innerHTML = `
                <label class="block text-xs font-bold text-slate-500 mb-1 uppercase">Método de Revisão</label>
                <select id="finish-method-select" class="w-full bg-transparent font-medium text-slate-800 outline-none">
                    <option value="questions">Questões</option>
                    <option value="flashcard">Flashcards</option>
                    <option value="summary">Resumo / Leitura</option>
                    <option value="class">Vídeo Aula</option>
                    <option value="other">Outro</option>
                </select>
            `;
            container.prepend(methodDiv);
        }

        document.getElementById('modal-finish').classList.remove('hidden');
        document.getElementById('modal-finish').classList.add('flex');
    },

    async saveSession(e) {
        e.preventDefault();
        
        if (!this.state.subjectId) {
            ui.toast('Erro de estado. Recarregue a página.', 'error');
            return;
        }

        const topicId = document.getElementById('timer-topic-select').value;
        const qTotal = document.getElementById('finish-q-total').value;
        const qCorrect = document.getElementById('finish-q-correct').value;
        const notes = document.getElementById('finish-notes').value;
        
        // Check if revision
        const methodEl = document.getElementById('finish-method-select');
        const isRev = !!methodEl;
        const method = methodEl ? methodEl.value : null;

        try {
            if (isRev) {
                // SAVE REVISION
                await api.post('/revisions', {
                    subject_id: this.state.subjectId,
                    topic_id: topicId || null,
                    duration_seconds: this.state.elapsed,
                    method: method,
                    questions_total: qTotal,
                    questions_correct: qCorrect,
                    notes: notes
                });
                ui.toast('Revisão registrada com sucesso! 📚');
            } else {
                // SAVE STUDY SESSION
                await api.post('/sessions', {
                    subject_id: this.state.subjectId,
                    topic_id: topicId || null,
                    duration_seconds: this.state.elapsed,
                    questions_total: qTotal,
                    questions_correct: qCorrect,
                    notes: notes
                });
                // Rotate only on normal study
                await api.post('/cycle/rotate', { subject_id: this.state.subjectId });
                ui.toast('Sessão salva! Ciclo atualizado. 🚀');
            }

        } catch (err) {
            console.error(err);
            ui.toast('Erro ao salvar. Tente novamente.', 'error');
            return;
        }

        this.clearState();
        document.getElementById('modal-finish').classList.add('hidden');
        document.getElementById('modal-finish').classList.remove('flex');
        document.title = 'Método FERM';
        document.getElementById('form-finish-session').reset();

        if(isRev) router.navigate('revisions');
        else router.navigate('dashboard');
    },

    async loadTopicsForSession(subjectId) {
        const topics = await api.get(`/subjects/${subjectId}/topics`);
        const select = document.getElementById('timer-topic-select');
        select.innerHTML = '<option value="">Apenas a matéria geral</option>';
        topics.forEach(t => {
            select.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        });
    }
};

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    // 1. Setup User Info in Sidebar
    const nameDisplay = document.getElementById('user-name-display');
    const avatarContainer = document.querySelector('.border-t .w-10'); // Sidebar avatar container
    
    if (nameDisplay) nameDisplay.innerText = currentUser.nickname || currentUser.name;
    
    // Update Sidebar Avatar if exists
    if (currentUser.avatar_id && avatarContainer) {
        const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${currentUser.avatar_id}&backgroundColor=e0e7ff`;
        avatarContainer.innerHTML = `<img src="${avatarUrl}" class="w-full h-full rounded-full object-cover">`;
        avatarContainer.classList.remove('bg-white', 'border-slate-200', 'text-slate-400'); // Remove default generic styles
        avatarContainer.classList.add('bg-indigo-50', 'border-indigo-100'); // Add nice border
    }

    timer.init();
    if (!timer.state.active) router.navigate('dashboard');
});
