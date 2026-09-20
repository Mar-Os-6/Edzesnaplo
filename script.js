// --- ALAPÉRTELMEZETT ADATOK ÉS ÁLLAPOTOK ---
const defaultExercises = [
    { name: "Fekvenyomás", category: "Mell" },
    { name: "Incline fekvenyomás", category: "Mell" },
    { name: "Tárogatás", category: "Mell" },
    { name: "Guggolás", category: "Láb" },
    { name: "Lábtolás", category: "Láb" },
    { name: "Felhúzás", category: "Hát" },
    { name: "Mellről nyomás", category: "Váll" },
    { name: "Bicepsz franciarúddal", category: "Kar" },
    { name: "Futópad", category: "Kardió" }
];

let exercises = JSON.parse(localStorage.getItem('exercises')) || defaultExercises;
let workoutHistory = JSON.parse(localStorage.getItem('workoutHistory')) || [];
let workoutTemplates = JSON.parse(localStorage.getItem('workoutTemplates')) || [];
let selectedTemplateExercises = [];
let editingIndex = null;

// --- INICIALIZÁLÁS ---
document.addEventListener("DOMContentLoaded", () => {
    // Mai dátum beállítása alapértelmezetten
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    renderExerciseOptions();
    renderChips();
    renderTemplateSelect();
    renderHistory();

    // Egy alapértelmezett sorozat hozzáadása
    if (document.getElementById('sets-container').children.length === 0) {
        addSetRow();
    }

    // Időzítő inputok figyelése
    document.getElementById('cd-minutes')?.addEventListener('input', updateCountdownFromInputs);
    document.getElementById('cd-seconds')?.addEventListener('input', updateCountdownFromInputs);
});

// --- STOPPER ÉS IDŐZÍTŐ LOGIKA ---

function switchTimerTab(tab) {
    document.getElementById('tab-stopwatch').classList.toggle('active', tab === 'stopwatch');
    document.getElementById('tab-countdown').classList.toggle('active', tab === 'countdown');
    
    document.getElementById('stopwatch-view').classList.toggle('hidden', tab !== 'stopwatch');
    document.getElementById('countdown-view').classList.toggle('hidden', tab !== 'countdown');
}

// 1. STOPPER (Felfelé)
let swInterval = null;
let swSeconds = 0;

function toggleStopwatch() {
    const btn = document.getElementById('sw-start-btn');
    if (swInterval) {
        clearInterval(swInterval);
        swInterval = null;
        btn.textContent = 'Folytatás';
        btn.style.backgroundColor = 'var(--accent-color)';
        btn.style.color = '#000';
    } else {
        swInterval = setInterval(() => {
            swSeconds++;
            updateStopwatchDisplay();
        }, 1000);
        btn.textContent = 'Szünet';
        btn.style.backgroundColor = 'var(--danger-color)';
        btn.style.color = '#fff';
    }
}

function resetStopwatch() {
    clearInterval(swInterval);
    swInterval = null;
    swSeconds = 0;
    updateStopwatchDisplay();
    const btn = document.getElementById('sw-start-btn');
    btn.textContent = 'Indítás';
    btn.style.backgroundColor = 'var(--accent-color)';
    btn.style.color = '#000';
}

function updateStopwatchDisplay() {
    const hrs = String(Math.floor(swSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((swSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(swSeconds % 60).padStart(2, '0');
    document.getElementById('stopwatch-display').textContent = `${hrs}:${mins}:${secs}`;
}

// 2. VISSZASZÁMLÁLÓ (Lefelé)
let cdInterval = null;
let cdTotalSeconds = 60;

function setCountdownPreset(seconds) {
    resetCountdown();
    document.getElementById('cd-minutes').value = Math.floor(seconds / 60);
    document.getElementById('cd-seconds').value = seconds % 60;
    updateCountdownFromInputs();
}

function updateCountdownFromInputs() {
    const mins = parseInt(document.getElementById('cd-minutes').value) || 0;
    const secs = parseInt(document.getElementById('cd-seconds').value) || 0;
    cdTotalSeconds = (mins * 60) + secs;
    
    const displayMins = String(Math.floor(cdTotalSeconds / 60)).padStart(2, '0');
    const displaySecs = String(cdTotalSeconds % 60).padStart(2, '0');
    document.getElementById('countdown-display').textContent = `${displayMins}:${displaySecs}`;
}

function toggleCountdown() {
    const btn = document.getElementById('cd-start-btn');
    if (cdInterval) {
        clearInterval(cdInterval);
        cdInterval = null;
        btn.textContent = 'Folytatás';
        btn.style.backgroundColor = 'var(--accent-color)';
        btn.style.color = '#000';
    } else {
        if (cdTotalSeconds <= 0) updateCountdownFromInputs();
        if (cdTotalSeconds <= 0) return;

        cdInterval = setInterval(() => {
            cdTotalSeconds--;
            
            const displayMins = String(Math.floor(cdTotalSeconds / 60)).padStart(2, '0');
            const displaySecs = String(cdTotalSeconds % 60).padStart(2, '0');
            document.getElementById('countdown-display').textContent = `${displayMins}:${displaySecs}`;

            if (cdTotalSeconds <= 0) {
                clearInterval(cdInterval);
                cdInterval = null;
                btn.textContent = 'Indítás';
                btn.style.backgroundColor = 'var(--accent-color)';
                btn.style.color = '#000';
                alert('⏱️ Letelt az idő!');
            }
        }, 1000);

        btn.textContent = 'Szünet';
        btn.style.backgroundColor = 'var(--danger-color)';
        btn.style.color = '#fff';
    }
}

function resetCountdown() {
    clearInterval(cdInterval);
    cdInterval = null;
    updateCountdownFromInputs();
    const btn = document.getElementById('cd-start-btn');
    btn.textContent = 'Indítás';
    btn.style.backgroundColor = 'var(--accent-color)';
    btn.style.color = '#000';
}

// --- GYAKORLATOK SZŰRÉSE ÉS CSEMPÉK (CHIPEK) ---

function filterExercisesByCategory() {
    renderExerciseOptions();
    renderChips();
}

function renderExerciseOptions() {
    const select = document.getElementById('exercise-select');
    const selectedCategory = document.getElementById('workout-type').value;
    select.innerHTML = '<option value="">-- Válassz gyakorlatot --</option>';

    const filtered = selectedCategory === "Összes" 
        ? exercises 
        : exercises.filter(ex => ex.category === selectedCategory);

    filtered.forEach(ex => {
        const opt = document.createElement('option');
        opt.value = ex.name;
        opt.textContent = ex.name;
        select.appendChild(opt);
    });
}

function renderChips() {
    const chipContainer = document.getElementById('exercise-chips');
    const selectedCategory = document.getElementById('workout-type').value;
    chipContainer.innerHTML = '';

    const filtered = selectedCategory === "Összes" 
        ? exercises 
        : exercises.filter(ex => ex.category === selectedCategory);

    filtered.forEach(ex => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = ex.name;
        nameSpan.onclick = () => selectExerciseFromChip(ex.name);
        
        const delSpan = document.createElement('span');
        delSpan.className = 'delete-chip';
        delSpan.textContent = '×';
        delSpan.onclick = (e) => {
            e.stopPropagation();
            deleteCustomExercise(ex.name);
        };

        chip.appendChild(nameSpan);
        chip.appendChild(delSpan);
        chipContainer.appendChild(chip);
    });
}

function selectExerciseFromChip(name) {
    document.getElementById('exercise-select').value = name;
}

function addNewCustomExercise() {
    const input = document.getElementById('custom-exercise-input');
    const name = input.value.trim();
    const category = document.getElementById('workout-type').value === "Összes" ? "Mell" : document.getElementById('workout-type').value;

    if (!name) return;

    if (!exercises.some(ex => ex.name.toLowerCase() === name.toLowerCase())) {
        exercises.push({ name, category });
        localStorage.setItem('exercises', JSON.stringify(exercises));
        renderExerciseOptions();
        renderChips();
        document.getElementById('exercise-select').value = name;
        input.value = '';
    } else {
        alert('Ez a gyakorlat már létezik!');
    }
}

function deleteCustomExercise(name) {
    if (confirm(`Biztosan törlöd a(z) "${name}" gyakorlatot?`)) {
        exercises = exercises.filter(ex => ex.name !== name);
        localStorage.setItem('exercises', JSON.stringify(exercises));
        renderExerciseOptions();
        renderChips();
    }
}

// --- SOROZATOK KEZELÉSE ---

function addSetRow(weight = '', reps = '') {
    const container = document.getElementById('sets-container');
    const setIndex = container.children.length + 1;

    const row = document.createElement('div');
    row.className = 'set-row';
    row.innerHTML = `
        <span class="set-number">${setIndex}.</span>
        <input type="number" step="0.5" placeholder="Súly (kg)" value="${weight}" class="set-weight" required>
        <input type="number" placeholder="Ismétlés" value="${reps}" class="set-reps" required>
        <button type="button" class="remove-set-btn" onclick="removeSetRow(this)">×</button>
    `;

    container.appendChild(row);
    updateSetNumbers();
}

function removeSetRow(btn) {
    const container = document.getElementById('sets-container');
    if (container.children.length > 1) {
        btn.closest('.set-row').remove();
        updateSetNumbers();
    } else {
        alert('Legalább egy sorozatnak maradnia kell!');
    }
}

function updateSetNumbers() {
    const rows = document.querySelectorAll('.set-row');
    rows.forEach((row, idx) => {
        row.querySelector('.set-number').textContent = `${idx + 1}.`;
    });
}

// --- SABLONOK KEZELÉSE ---

function toggleCreateTemplateBox() {
    const box = document.getElementById('create-template-box');
    box.classList.toggle('hidden');
    if (!box.classList.contains('hidden')) {
        renderTemplateChips();
    }
}

function renderTemplateChips() {
    const container = document.getElementById('template-exercise-chips');
    container.innerHTML = '';

    exercises.forEach(ex => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        if (selectedTemplateExercises.includes(ex.name)) {
            chip.classList.add('selected-chip');
        }
        chip.textContent = ex.name;
        chip.onclick = () => toggleSelectTemplateExercise(ex.name);
        container.appendChild(chip);
    });
}

function toggleSelectTemplateExercise(name) {
    if (selectedTemplateExercises.includes(name)) {
        selectedTemplateExercises = selectedTemplateExercises.filter(item => item !== name);
    } else {
        selectedTemplateExercises.push(name);
    }
    renderTemplateChips();
    
    const textDiv = document.getElementById('selected-template-exercises-text');
    textDiv.textContent = selectedTemplateExercises.length > 0 
        ? `Kiválasztva: ${selectedTemplateExercises.join(', ')}` 
        : 'Nincs kiválasztva gyakorlat.';
}

function saveNewTemplate() {
    const nameInput = document.getElementById('new-template-name');
    const name = nameInput.value.trim();

    if (!name) {
        alert('Kérlek add meg a sablon nevét!');
        return;
    }
    if (selectedTemplateExercises.length === 0) {
        alert('Válassz ki legalább egy gyakorlatot!');
        return;
    }

    workoutTemplates.push({ name, exercises: [...selectedTemplateExercises] });
    localStorage.setItem('workoutTemplates', JSON.stringify(workoutTemplates));

    nameInput.value = '';
    selectedTemplateExercises = [];
    toggleCreateTemplateBox();
    renderTemplateSelect();
}

function renderTemplateSelect() {
    const select = document.getElementById('template-select');
    select.innerHTML = '<option value="">-- Válassz sablonok közül --</option>';

    workoutTemplates.forEach((tmpl, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = tmpl.name;
        select.appendChild(opt);
    });
}

function loadSelectedTemplate() {
    const select = document.getElementById('template-select');
    const idx = select.value;

    if (idx === "") return;

    const template = workoutTemplates[idx];
    document.getElementById('active-template-banner').classList.remove('hidden');
    document.getElementById('active-template-name').textContent = `Aktív sablon: ${template.name}`;
}

function clearActiveTemplate() {
    document.getElementById('template-select').value = "";
    document.getElementById('active-template-banner').classList.add('hidden');
}

// --- ŰRLAP BEKÜLDÉSE ÉS EDZÉS MENTÉSE ---

document.getElementById('workout-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const date = document.getElementById('date').value;
    const exercise = document.getElementById('exercise-select').value;

    if (!exercise) {
        alert('Kérlek válassz ki egy gyakorlatot!');
        return;
    }

    const sets = [];
    document.querySelectorAll('.set-row').forEach(row => {
        const weight = parseFloat(row.querySelector('.set-weight').value) || 0;
        const reps = parseInt(row.querySelector('.set-reps').value) || 0;
        sets.push({ weight, reps });
    });

    const newEntry = { date, exercise, sets };

    if (editingIndex !== null) {
        workoutHistory[editingIndex] = newEntry;
        editingIndex = null;
        document.getElementById('save-btn').textContent = 'Edzés Mentése';
    } else {
        workoutHistory.unshift(newEntry);
    }

    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
    renderHistory();

    // Űrlap alaphelyzetbe állítása
    document.getElementById('sets-container').innerHTML = '';
    addSetRow();
    document.getElementById('exercise-select').value = '';
});

// --- ELŐZMÉNYEK ÉS TÁBLÁZAT RENDERELÉSE ---

function renderHistory() {
    const tbody = document.getElementById('workout-history-body');
    tbody.innerHTML = '';

    workoutHistory.forEach((entry, idx) => {
        const tr = document.createElement('tr');

        // PR ellenőrzés (legnagyobb súly a gyakorlatnál)
        const isPR = checkPR(entry.exercise, entry.sets);

        const setsFormatted = entry.sets.map(s => `${s.weight}kg × ${s.reps}`).join('<br>');

        tr.innerHTML = `
            <td>${entry.date}</td>
            <td>
                <strong>${entry.exercise}</strong>
                ${isPR ? '<span class="pr-badge">PR</span>' : ''}
            </td>
            <td>${setsFormatted}</td>
            <td>
                <button class="edit-btn" onclick="editWorkout(${idx})">✏️</button>
                <button class="delete-btn" onclick="deleteWorkout(${idx})">🗑️</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function checkPR(exerciseName, sets) {
    const maxWeightInEntry = Math.max(...sets.map(s => s.weight));
    
    const allWeightsForExercise = workoutHistory
        .filter(item => item.exercise === exerciseName)
        .flatMap(item => item.sets.map(s => s.weight));

    const overallMax = Math.max(...allWeightsForExercise, 0);

    return maxWeightInEntry > 0 && maxWeightInEntry >= overallMax;
}

function editWorkout(idx) {
    const entry = workoutHistory[idx];
    editingIndex = idx;

    document.getElementById('date').value = entry.date;
    document.getElementById('exercise-select').value = entry.exercise;

    const container = document.getElementById('sets-container');
    container.innerHTML = '';

    entry.sets.forEach(s => {
        addSetRow(s.weight, s.reps);
    });

    document.getElementById('save-btn').textContent = 'Módosítás Mentése';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteWorkout(idx) {
    if (confirm('Biztosan törölni szeretnéd ezt az edzésbejegyzést?')) {
        workoutHistory.splice(idx, 1);
        localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
        renderHistory();
    }
}

// --- EXPORTÁLÁS ÉS IMPORTÁLÁS ---

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workoutHistory, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `edzes_naplo_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function triggerImport() {
    document.getElementById('import-file').click();
}

function importData(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        try {
            const importedHistory = JSON.parse(e.target.result);
            if (Array.isArray(importedHistory)) {
                workoutHistory = importedHistory;
                localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
                renderHistory();
                alert('Sikeres importálás!');
            } else {
                alert('Érvénytelen fájlformátum!');
            }
        } catch (err) {
            alert('Hiba történt a fájl beolvasása közben!');
        }
    };
    if (event.target.files[0]) {
        fileReader.readAsText(event.target.files[0]);
    }
}
