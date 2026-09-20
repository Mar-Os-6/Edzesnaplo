// ELEMEK KIJELÖLÉSE
const form = document.getElementById('workout-form');
const dateInput = document.getElementById('workout-date');
const muscleGroupSelect = document.getElementById('muscle-group');
const quickExercisesContainer = document.getElementById('quick-exercises');
const exerciseInput = document.getElementById('exercise');

const resistanceFields = document.getElementById('resistance-fields');
const setsContainer = document.getElementById('sets-container');
const addSetBtn = document.getElementById('add-set-btn');
const cardioFields = document.getElementById('cardio-fields');

const cardioTimeInput = document.getElementById('cardio-time');
const cardioInclineInput = document.getElementById('cardio-incline');
const cardioSpeedInput = document.getElementById('cardio-speed');

const noteInput = document.getElementById('note');
const historyHint = document.getElementById('history-hint');
const workoutList = document.getElementById('workout-list');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file');
const searchFilterInput = document.getElementById('search-filter');

// SABLON ELEMEK
const templateSelect = document.getElementById('template-select');
const startTemplateBtn = document.getElementById('start-template-btn');
const editTemplateBtn = document.getElementById('edit-template-btn');
const toggleNewTemplateBtn = document.getElementById('toggle-new-template-btn');
const deleteTemplateBtn = document.getElementById('delete-template-btn');

const createTemplateBox = document.getElementById('create-template-box');
const templateFormTitle = document.getElementById('template-form-title');
const newTemplateNameInput = document.getElementById('new-template-name');

const templateMuscleChips = document.getElementById('template-muscle-chips');
const templateAvailableExercises = document.getElementById('template-available-exercises');
const customTemplateExInput = document.getElementById('custom-template-ex-input');
const addCustomTemplateExBtn = document.getElementById('add-custom-template-ex-btn');
const templateSelectedExercises = document.getElementById('template-selected-exercises');

const saveNewTemplateBtn = document.getElementById('save-new-template-btn');
const cancelNewTemplateBtn = document.getElementById('cancel-new-template-btn');

const activeTemplateBanner = document.getElementById('active-template-banner');
const activeTemplateInfo = document.getElementById('active-template-info');
const cancelTemplateBtn = document.getElementById('cancel-template-btn');

dateInput.value = new Date().toISOString().split('T')[0];

const defaultExercises = {
    'Mell': ['Fekvenyomás', 'Incline Fekvenyomás', 'Tárogatás'],
    'Bicepsz': ['Bicepsz állva franciarúddal', 'Kalapács hajlítás'],
    'Hát': ['Mellhez húzás csigán', 'Evezés döntött törzzsel', 'Húzódzkodás'],
    'Tricepsz': ['Tricepsz letolás csigán', 'Lónyomás'],
    'Váll': ['Vállból nyomás kézisúlyzóval', 'Oldalemelés'],
    'Láb': ['Guggolás', 'Lábnyomás', 'Lábhajlítás gépen'],
    'Has': ['Hasprés', 'Lábelemelés függeszkedve'],
    'Kardió': ['Futópad (Incline walking)', 'Lépcsőzőgép', 'Szobakerékpár']
};

const defaultTemplates = [
    {
        name: "A nap: Mell - Tricepsz",
        muscleGroups: ["Mell", "Tricepsz"],
        exercises: ["Fekvenyomás", "Incline Fekvenyomás", "Tárogatás", "Tricepsz letolás csigán"]
    },
    {
        name: "B nap: Hát - Bicepsz",
        muscleGroups: ["Hát", "Bicepsz"],
        exercises: ["Húzódzkodás", "Mellhez húzás csigán", "Evezés döntött törzzsel", "Bicepsz állva franciarúddal"]
    },
    {
        name: "C nap: Láb - Váll",
        muscleGroups: ["Láb", "Váll"],
        exercises: ["Guggolás", "Lábnyomás", "Vállból nyomás kézisúlyzóval", "Oldalemelés"]
    }
];

// SABLON LÉTREHOZÓ / SZERKESZTŐ BELSŐ ÁLLAPOT
let editingTemplateIndex = null; // null = új, szám = szerkesztés
let builderSelectedMuscles = [];
let builderSelectedExercises = [];

// AKTÍV EDZÉSTERV ÁLLAPOT (AMIKOR EDZEL)
let activeSession = null;

document.addEventListener('DOMContentLoaded', () => {
    loadWorkouts();
    renderQuickExercises();
    handleMuscleGroupChange();
    resetSetRows();
    loadTemplates();
});

// --- EDZÉSTERV SABLON LOGIKA ---
function getCustomTemplates() {
    const stored = localStorage.getItem('customTemplates');
    return stored ? JSON.parse(stored) : defaultTemplates;
}

function saveCustomTemplates(templates) {
    localStorage.setItem('customTemplates', JSON.stringify(templates));
}

function loadTemplates() {
    const templates = getCustomTemplates();
    templateSelect.innerHTML = '<option value="">-- Válassz edzéstervet --</option>';
    templates.forEach((t, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = t.name;
        templateSelect.appendChild(opt);
    });
}

// SABLON KÉSZÍTŐ ÉS SZERKESZTŐ NYITÁSA/ZÁRÁSA
toggleNewTemplateBtn.addEventListener('click', () => {
    openTemplateBuilder(null);
});

editTemplateBtn.addEventListener('click', () => {
    const val = templateSelect.value;
    if (val === '') {
        alert('Kérlek válaszd ki a szerkeszteni kívánt sablont!');
        return;
    }
    openTemplateBuilder(parseInt(val));
});

cancelNewTemplateBtn.addEventListener('click', () => {
    createTemplateBox.classList.add('hidden');
});

function openTemplateBuilder(templateIndex = null) {
    editingTemplateIndex = templateIndex;
    const templates = getCustomTemplates();

    if (templateIndex !== null && templates[templateIndex]) {
        const t = templates[templateIndex];
        templateFormTitle.textContent = '✏️ Sablon Szerkesztése';
        newTemplateNameInput.value = t.name;
        builderSelectedMuscles = t.muscleGroups ? [...t.muscleGroups] : [];
        builderSelectedExercises = t.exercises ? [...t.exercises] : [];
    } else {
        templateFormTitle.textContent = '✨ Új Sablon Létrehozása';
        newTemplateNameInput.value = '';
        builderSelectedMuscles = [];
        builderSelectedExercises = [];
    }

    renderTemplateMuscleChips();
    renderTemplateAvailableExercises();
    renderTemplateSelectedExercises();
    createTemplateBox.classList.remove('hidden');
}

// 1. IZOMCSOPORT CHIPEK KIRAJZOLÁSA
function renderTemplateMuscleChips() {
    templateMuscleChips.innerHTML = '';
    const allGroups = ['Mell', 'Bicepsz', 'Hát', 'Tricepsz', 'Váll', 'Láb', 'Has', 'Kardió'];

    allGroups.forEach(group => {
        const isSelected = builderSelectedMuscles.includes(group);
        const chip = document.createElement('div');
        chip.className = `chip ${isSelected ? 'active' : ''}`;
        chip.textContent = group;
        chip.onclick = () => {
            if (isSelected) {
                builderSelectedMuscles = builderSelectedMuscles.filter(m => m !== group);
            } else {
                builderSelectedMuscles.push(group);
            }
            renderTemplateMuscleChips();
            renderTemplateAvailableExercises();
        };
        templateMuscleChips.appendChild(chip);
    });
}

// 2. MEGLÉVŐ GYAKORLATOK KIRAJZOLÁSA A KIJELÖLT IZOMCSOPORTOK ALAPJÁN
function renderTemplateAvailableExercises() {
    templateAvailableExercises.innerHTML = '';
    const allExercises = getCustomExercises();

    let available = [];

    if (builderSelectedMuscles.length === 0) {
        // Ha nincs izomcsoport kijelölve, az összes létező gyakorlatot megmutatjuk
        for (const group in allExercises) {
            available = available.concat(allExercises[group]);
        }
    } else {
        // Csak a kijelölt izomcsoportok gyakorlatai
        builderSelectedMuscles.forEach(group => {
            if (allExercises[group]) {
                available = available.concat(allExercises[group]);
            }
        });
    }

    // Duplikációk szűrése
    available = [...new Set(available)];

    if (available.length === 0) {
        templateAvailableExercises.innerHTML = '<small style="color:#888;">Nincsenek gyakorlatok ehhez az izomcsoporthoz.</small>';
        return;
    }

    available.forEach(exName => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = `+ ${exName}`;
        chip.onclick = () => {
            builderSelectedExercises.push(exName);
            renderTemplateSelectedExercises();
        };
        templateAvailableExercises.appendChild(chip);
    });
}

// 3. EGYEDI GYAKORLAT HOZZÁADÁSA A SABLONHOZ
addCustomTemplateExBtn.addEventListener('click', () => {
    const val = customTemplateExInput.value.trim();
    if (val) {
        builderSelectedExercises.push(val);
        customTemplateExInput.value = '';
        renderTemplateSelectedExercises();
    }
});

// 4. A SABLONBA BEVÁLOGATOTT GYAKORLATOK MEGJELENÍTÉSE
function renderTemplateSelectedExercises() {
    templateSelectedExercises.innerHTML = '';

    if (builderSelectedExercises.length === 0) {
        templateSelectedExercises.innerHTML = '<small style="color:#888;">Még nem választottál ki gyakorlatot.</small>';
        return;
    }

    builderSelectedExercises.forEach((exName, index) => {
        const chip = document.createElement('div');
        chip.className = 'chip selected-chip';
        chip.innerHTML = `
            <span>${index + 1}. ${exName}</span>
            <span class="delete-chip" onclick="removeExerciseFromBuilder(${index})">×</span>
        `;
        templateSelectedExercises.appendChild(chip);
    });
}

function removeExerciseFromBuilder(index) {
    builderSelectedExercises.splice(index, 1);
    renderTemplateSelectedExercises();
}

// SABLON MENTÉSE
saveNewTemplateBtn.addEventListener('click', () => {
    const name = newTemplateNameInput.value.trim();

    if (!name) {
        alert('Kérlek add meg a sablon nevét!');
        return;
    }

    if (builderSelectedExercises.length === 0) {
        alert('Kérlek válassz ki legalább 1 gyakorlatot a sablonhoz!');
        return;
    }

    const templates = getCustomTemplates();
    const templateData = {
        name: name,
        muscleGroups: builderSelectedMuscles,
        exercises: builderSelectedExercises
    };

    if (editingTemplateIndex !== null) {
        // Szerkesztés felülírása
        templates[editingTemplateIndex] = templateData;
    } else {
        // Új hozzáadása
        templates.push(templateData);
    }

    saveCustomTemplates(templates);

    createTemplateBox.classList.add('hidden');
    loadTemplates();
    alert('✅ Sablon sikeresen elmentve!');
});

// SABLON TÖRLÉSE
deleteTemplateBtn.addEventListener('click', () => {
    const val = templateSelect.value;
    if (val === '') {
        alert('Kérlek válaszd ki a törölni kívánt sablont!');
        return;
    }
    let templates = getCustomTemplates();
    const tName = templates[val].name;
    if (confirm(`Biztosan törölni akarod a(z) "${tName}" sablont?`)) {
        templates.splice(val, 1);
        saveCustomTemplates(templates);
        loadTemplates();
    }
});

// SABLON INDÍTÁSA EDZÉSHEZ
startTemplateBtn.addEventListener('click', () => {
    const val = templateSelect.value;
    if (val === '') {
        alert('Kérlek válaszd ki az indítani kívánt sablont!');
        return;
    }
    const templates = getCustomTemplates();
    const selectedTemplate = templates[val];

    activeSession = {
        templateName: selectedTemplate.name,
        exercises: selectedTemplate.exercises,
        currentIndex: 0
    };

    updateActiveSessionUI();
});

cancelTemplateBtn.addEventListener('click', () => {
    activeSession = null;
    activeTemplateBanner.classList.add('hidden');
    exerciseInput.value = '';
    historyHint.textContent = '';
});

function updateActiveSessionUI() {
    if (!activeSession) {
        activeTemplateBanner.classList.add('hidden');
        return;
    }

    const total = activeSession.exercises.length;
    const currentNum = activeSession.currentIndex + 1;

    if (activeSession.currentIndex >= total) {
        alert(`🎉 Gratulálunk! Teljesítetted a "${activeSession.templateName}" edzéstervet!`);
        activeSession = null;
        activeTemplateBanner.classList.add('hidden');
        exerciseInput.value = '';
        historyHint.textContent = '';
        return;
    }

    const currentEx = activeSession.exercises[activeSession.currentIndex];
    activeTemplateInfo.textContent = `📋 ${activeSession.templateName} (${currentNum}/${total}: ${currentEx})`;
    activeTemplateBanner.classList.remove('hidden');

    exerciseInput.value = currentEx;
    autoDetectMuscleGroup(currentEx);
    checkPreviousWeight();
}

function autoDetectMuscleGroup(exName) {
    const allEx = getCustomExercises();
    for (const group in allEx) {
        if (allEx[group].some(item => item.toLowerCase() === exName.toLowerCase())) {
            muscleGroupSelect.value = group;
            renderQuickExercises();
            handleMuscleGroupChange();
            return;
        }
    }
}

// --- DINAMIKUS SOROZAT KEZELÉS ---
addSetBtn.addEventListener('click', () => {
    addSetRow();
});

function addSetRow(weight = '', reps = '') {
    const rowCount = setsContainer.children.length + 1;
    const row = document.createElement('div');
    row.className = 'set-row';
    row.innerHTML = `
        <span class="set-number">${rowCount}.</span>
        <input type="number" class="set-weight" placeholder="Súly (kg)" step="0.5" value="${weight}">
        <input type="number" class="set-reps" placeholder="Ismétlés" value="${reps}">
        <button type="button" class="remove-set-btn" onclick="removeSetRow(this)">✕</button>
    `;
    setsContainer.appendChild(row);
    updateRemoveButtonsVisibility();
}

function removeSetRow(btn) {
    if (setsContainer.children.length > 1) {
        btn.closest('.set-row').remove();
        renumberSetRows();
    }
}

function renumberSetRows() {
    const rows = setsContainer.querySelectorAll('.set-row');
    rows.forEach((row, idx) => {
        row.querySelector('.set-number').textContent = `${idx + 1}.`;
    });
    updateRemoveButtonsVisibility();
}

function updateRemoveButtonsVisibility() {
    const rows = setsContainer.querySelectorAll('.set-row');
    rows.forEach(row => {
        const btn = row.querySelector('.remove-set-btn');
        if (rows.length === 1) {
            btn.style.visibility = 'hidden';
        } else {
            btn.style.visibility = 'visible';
        }
    });
}

function resetSetRows() {
    setsContainer.innerHTML = '';
    addSetRow();
}

muscleGroupSelect.addEventListener('change', () => {
    if (!activeSession) {
        exerciseInput.value = '';
        historyHint.textContent = '';
    }
    resetSetRows();
    renderQuickExercises();
    handleMuscleGroupChange();
});

function handleMuscleGroupChange() {
    const isCardio = muscleGroupSelect.value === 'Kardió';
    
    if (isCardio) {
        resistanceFields.classList.add('hidden');
        cardioFields.classList.remove('hidden');
        exerciseInput.placeholder = "pl. Futópad dőlésszöggel";
    } else {
        cardioFields.classList.add('hidden');
        resistanceFields.classList.remove('hidden');
        exerciseInput.placeholder = "pl. Fekvenyomás";
    }
}

function getCustomExercises() {
    const stored = localStorage.getItem('customExercises');
    return stored ? JSON.parse(stored) : defaultExercises;
}

function saveCustomExercises(exercises) {
    localStorage.setItem('customExercises', JSON.stringify(exercises));
}

function renderQuickExercises() {
    quickExercisesContainer.innerHTML = '';
    const selectedGroup = muscleGroupSelect.value;
    const allExercises = getCustomExercises();
    const groupExercises = allExercises[selectedGroup] || [];

    groupExercises.forEach(exName => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `
            <span onclick="selectExercise('${exName}')">${exName}</span>
            <span class="delete-chip" onclick="deleteCustomExercise(event, '${selectedGroup}', '${exName}')">×</span>
        `;
        quickExercisesContainer.appendChild(chip);
    });
}

function selectExercise(name) {
    exerciseInput.value = name;
    checkPreviousWeight();
}

function deleteCustomExercise(event, group, name) {
    event.stopPropagation();
    let allExercises = getCustomExercises();
    if (allExercises[group]) {
        allExercises[group] = allExercises[group].filter(item => item !== name);
        saveCustomExercises(allExercises);
        renderQuickExercises();
    }
}

function addCustomExerciseToGroup(group, name) {
    let allExercises = getCustomExercises();
    if (!allExercises[group]) allExercises[group] = [];
    const exists = allExercises[group].some(item => item.toLowerCase() === name.toLowerCase());
    if (!exists) {
        allExercises[group].push(name);
        saveCustomExercises(allExercises);
        renderQuickExercises();
    }
}

exerciseInput.addEventListener('input', checkPreviousWeight);

function checkPreviousWeight() {
    const query = exerciseInput.value.trim().toLowerCase();
    if (!query) {
        historyHint.textContent = '';
        return;
    }
    const workouts = getWorkoutsFromStorage();
    const previous = workouts.slice().reverse().find(w => w.exercise.toLowerCase() === query);
    
    if (previous) {
        if (previous.isCardio) {
            historyHint.textContent = `Legutóbb: ${previous.time} perc (${previous.incline || '-'}, ${previous.speed ? previous.speed + ' km/h' : '-'})`;
        } else {
            historyHint.textContent = `Legutóbb: ${previous.weight} kg x ${previous.reps} (${previous.date})`;
        }
    } else {
        historyHint.textContent = '';
    }
}

// 3. MENTÉS GOMB
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const currentDate = dateInput.value;
    const currentMuscleGroup = muscleGroupSelect.value;
    const currentExercise = exerciseInput.value.trim();
    const isCardio = currentMuscleGroup === 'Kardió';

    if (isCardio) {
        let workout = {
            id: Date.now(),
            date: currentDate,
            muscleGroup: currentMuscleGroup,
            exercise: currentExercise,
            isCardio: true,
            time: cardioTimeInput.value,
            incline: cardioInclineInput.value.trim(),
            speed: cardioSpeedInput.value,
            note: noteInput.value.trim()
        };
        saveWorkoutToStorage(workout);
    } else {
        const rows = setsContainer.querySelectorAll('.set-row');

        rows.forEach((row, index) => {
            const weightVal = row.querySelector('.set-weight').value;
            const repsVal = row.querySelector('.set-reps').value;

            if (weightVal !== '' || repsVal !== '') {
                let workout = {
                    id: Date.now() + index,
                    date: currentDate,
                    muscleGroup: currentMuscleGroup,
                    exercise: currentExercise,
                    isCardio: false,
                    weight: weightVal || '0',
                    reps: repsVal || '0',
                    note: noteInput.value.trim()
                };
                saveWorkoutToStorage(workout);
            }
        });
    }

    addCustomExerciseToGroup(currentMuscleGroup, currentExercise);

    exerciseInput.value = '';
    cardioTimeInput.value = '';
    cardioInclineInput.value = '';
    cardioSpeedInput.value = '';
    noteInput.value = '';
    historyHint.textContent = '';
    resetSetRows();

    loadWorkouts();

    if (activeSession) {
        activeSession.currentIndex++;
        updateActiveSessionUI();
    }
});

function addWorkoutToTable(workout, totalSetsCount, currentSetNum, isPR) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', workout.id);

    let col4 = '';
    let col5 = '';

    if (workout.isCardio) {
        col4 = `⏱️ ${workout.time || '0'} perc`;
        let details = [];
        if (workout.incline) details.push(`Dőlés/Fokozat: ${workout.incline}`);
        if (workout.speed) details.push(`${workout.speed} km/h`);
        col5 = details.join(' | ') || '-';
    } else {
        const prTag = isPR ? `<span class="pr-badge">🏆 PR</span>` : '';
        col4 = `${workout.weight} kg ${prTag}`;
        
        if (totalSetsCount > 1) {
            col5 = `${workout.reps}x <small>(${currentSetNum}. sorozat)</small>`;
        } else {
            col5 = `${workout.reps}x`;
        }
    }

    tr.innerHTML = `
        <td>${workout.date}</td>
        <td><small>${workout.muscleGroup || '-'}</small></td>
        <td><strong>${workout.exercise}</strong></td>
        <td>${col4}</td>
        <td>${col5}</td>
        <td>${workout.note || '-'}</td>
        <td><button class="delete-btn" onclick="deleteWorkout(${workout.id})">X</button></td>
    `;

    workoutList.insertBefore(tr, workoutList.firstChild);
}

function saveWorkoutToStorage(workout) {
    let workouts = getWorkoutsFromStorage();
    workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));
}

function getWorkoutsFromStorage() {
    return localStorage.getItem('workouts') ? JSON.parse(localStorage.getItem('workouts')) : [];
}

function loadWorkouts() {
    workoutList.innerHTML = '';
    const workouts = getWorkoutsFromStorage();

    const maxWeights = {};
    workouts.forEach(w => {
        if (!w.isCardio) {
            const exName = w.exercise.toLowerCase();
            const weightNum = parseFloat(w.weight) || 0;
            if (!maxWeights[exName] || weightNum > maxWeights[exName]) {
                maxWeights[exName] = weightNum;
            }
        }
    });

    const setCounts = {};
    workouts.forEach(w => {
        if (!w.isCardio) {
            const key = `${w.date}_${w.exercise.toLowerCase()}`;
            setCounts[key] = (setCounts[key] || 0) + 1;
        }
    });

    const setIndexes = {};

    workouts.forEach(workout => {
        let totalSets = 0;
        let currentSetNum = 1;
        let isPR = false;

        if (!workout.isCardio) {
            const exName = workout.exercise.toLowerCase();
            const key = `${workout.date}_${exName}`;
            totalSets = setCounts[key] || 0;
            setIndexes[key] = (setIndexes[key] || 0) + 1;
            currentSetNum = setIndexes[key];

            const currentWeight = parseFloat(workout.weight) || 0;
            if (currentWeight > 0 && currentWeight === maxWeights[exName]) {
                isPR = true;
            }
        }

        addWorkoutToTable(workout, totalSets, currentSetNum, isPR);
    });
}

function deleteWorkout(id) {
    let workouts = getWorkoutsFromStorage();
    workouts = workouts.filter(w => w.id !== id);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    loadWorkouts();
}

exportBtn.addEventListener('click', function() {
    const workouts = getWorkoutsFromStorage();
    if (workouts.length === 0) {
        alert('Még nincsenek elmentett adatok!');
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workouts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `edzesnaplo_mentes_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

importBtn.addEventListener('click', () => {
    importFileInput.click();
});

importFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                if (confirm(`Biztosan be akarod tölteni ezt a ${importedData.length} edzésbejegyzést?`)) {
                    const currentWorkouts = getWorkoutsFromStorage();
                    const existingIds = new Set(currentWorkouts.map(w => w.id));
                    const newWorkouts = importedData.filter(w => !existingIds.has(w.id));
                    
                    const mergedWorkouts = [...currentWorkouts, ...newWorkouts];
                    localStorage.setItem('workouts', JSON.stringify(mergedWorkouts));
                    
                    loadWorkouts();
                    alert('✅ Adatok sikeresen importálva!');
                }
            } else {
                alert('⚠️ Helytelen fájlformátum!');
            }
        } catch (err) {
            alert('⚠️ Hiba történt a fájl beolvasása közben!');
        }
    };
    reader.readAsText(file);
    this.value = '';
});

searchFilterInput.addEventListener('input', function() {
    const filterValue = this.value.toLowerCase();
    const rows = workoutList.querySelectorAll('tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filterValue) ? '' : 'none';
    });
});

// STOPPER LOGIKA
let timerInterval = null;
let secondsLeft = 60;
let isTimerRunning = false;

function updateTimerDisplay() {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    document.getElementById('timer-display').textContent = 
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function setTimer(seconds) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    secondsLeft = seconds;
    document.getElementById('start-timer-btn').textContent = 'Start';
    updateTimerDisplay();
}

function playBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 800;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.8);
        setTimeout(() => osc.stop(), 800);
    } catch (e) {}
}

document.getElementById('start-timer-btn').addEventListener('click', function() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        this.textContent = 'Start';
    } else {
        isTimerRunning = true;
        this.textContent = 'Szünet';
        timerInterval = setInterval(() => {
            if (secondsLeft > 0) {
                secondsLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                isTimerRunning = false;
                document.getElementById('start-timer-btn').textContent = 'Start';
                if ('vibrate' in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
                playBeep();
                alert('⏱️ Lejárt a pihenőidő!');
            }
        }, 1000);
    }
});

document.getElementById('reset-timer-btn').addEventListener('click', function() {
    setTimer(60);
});

// SERVICE WORKER REGISZTRÁCIÓ (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker sikeresen regisztrálva:', reg))
            .catch(err => console.log('Service Worker hiba:', err));
    });
}
