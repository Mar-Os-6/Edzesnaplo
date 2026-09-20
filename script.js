// ELEMEK KIJELÖLÉSE A HTML-BŐL
const form = document.getElementById('workout-form');
const dateInput = document.getElementById('workout-date');
const muscleGroupSelect = document.getElementById('muscle-group');
const quickExercisesContainer = document.getElementById('quick-exercises');
const exerciseInput = document.getElementById('exercise');
const weightInput = document.getElementById('weight');
const repsInput = document.getElementById('reps');
const noteInput = document.getElementById('note');
const historyHint = document.getElementById('history-hint');
const workoutList = document.getElementById('workout-list');
const exportBtn = document.getElementById('export-btn');
const searchFilterInput = document.getElementById('search-filter');

// Mai dátum beállítása
dateInput.value = new Date().toISOString().split('T')[0];

// ALAPÉRTELMEZETT GYAKORLATOK IZOMCSOPORTONKÉNT
const defaultExercises = {
    'Mell': ['Fekvenyomás', 'Incline Fekvenyomás', 'Tárogatás'],
    'Bicepsz': ['Bicepsz állva franciarúddal', 'Kalapács hajlítás'],
    'Hát': ['Mellhez húzás csigán', 'Evezés döntött törzzsel', 'Húzódzkodás'],
    'Tricepsz': ['Tricepsz letolás csigán', 'Lónyomás'],
    'Váll': ['Vállból nyomás kézisúlyzóval', 'Oldalemelés'],
    'Láb': ['Guggolás', 'Lábnyomás', 'Lábhajlítás gépen'],
    'Has': ['Hasprés', 'Lábelemelés függeszkedve'],
    'Kardió': ['Futópad', 'Szobakerékpár']
};

// 1. INDULÁSKOR BETÖLTÉS
document.addEventListener('DOMContentLoaded', () => {
    loadWorkouts();
    renderQuickExercises();
});

// 2. IZOMCSOPORT VÁLTOZÁSKOR A GOMBOK ÚJRAKÖZLÉSE
muscleGroupSelect.addEventListener('change', renderQuickExercises);

// MENTETT GYAKORLATOK LEKÉRÉSE / TÁROLÁSA BÖNGÉSZŐBŐL
function getCustomExercises() {
    const stored = localStorage.getItem('customExercises');
    return stored ? JSON.parse(stored) : defaultExercises;
}

function saveCustomExercises(exercises) {
    localStorage.setItem('customExercises', JSON.stringify(exercises));
}

// GYORSGYAKORLAT GOMBOK KIRAJZOLÁSA
function renderQuickExercises() {
    quickExercisesContainer.innerHTML = '';
    const selectedGroup = muscleGroupSelect.value;
    const allExercises = getCustomExercises();
    const groupExercises = allExercises[selectedGroup] || [];

    groupExercises.forEach(exName => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        
        // Rácoppintáskor kitölti a mezőt
        chip.innerHTML = `
            <span onclick="selectExercise('${exName}')">${exName}</span>
            <span class="delete-chip" onclick="deleteCustomExercise(event, '${selectedGroup}', '${exName}')">×</span>
        `;
        quickExercisesContainer.appendChild(chip);
    });
}

// RÁKATTINTÁS EGY GYORSGOMBRA
function selectExercise(name) {
    exerciseInput.value = name;
    checkPreviousWeight();
}

// GYAKORLAT TÖRLESE A LISTÁBÓL (A PIROS × GOMBBAL)
function deleteCustomExercise(event, group, name) {
    event.stopPropagation(); // Ne töltse ki a mezőt kattintáskor
    let allExercises = getCustomExercises();
    if (allExercises[group]) {
        allExercises[group] = allExercises[group].filter(item => item !== name);
        saveCustomExercises(allExercises);
        renderQuickExercises();
    }
}

// ÚJ GYAKORLAT NEVÉNEK ELMENTÉSE AZ IZOMCSOPORTI LISTÁBA
function addCustomExerciseToGroup(group, name) {
    let allExercises = getCustomExercises();
    if (!allExercises[group]) {
        allExercises[group] = [];
    }
    // Csak akkor adjuk hozzá, ha még nincs a listában
    const exists = allExercises[group].some(item => item.toLowerCase() === name.toLowerCase());
    if (!exists) {
        allExercises[group].push(name);
        saveCustomExercises(allExercises);
        renderQuickExercises();
    }
}

// ELŐZŐ SÚLY ELLENŐRZÉSE
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
        historyHint.textContent = `Legutóbb: ${previous.weight} kg x ${previous.reps} (${previous.date})`;
    } else {
        historyHint.textContent = '';
    }
}

// 3. MENTÉS GOMB MEGNYOMÁSA
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const workouts = getWorkoutsFromStorage();
    const currentDate = dateInput.value;
    const currentMuscleGroup = muscleGroupSelect.value;
    const currentExercise = exerciseInput.value.trim();

    // Hányadik sorozat ma
    const existingSets = workouts.filter(w => w.date === currentDate && w.exercise.toLowerCase() === currentExercise.toLowerCase());
    const setNumber = existingSets.length + 1;

    const workout = {
        id: Date.now(),
        date: currentDate,
        muscleGroup: currentMuscleGroup,
        exercise: currentExercise,
        setNumber: setNumber,
        weight: weightInput.value,
        reps: repsInput.value,
        note: noteInput.value.trim()
    };

    // Elmentjük a gyakorlat nevet is a gombok közé a jövőre nézve
    addCustomExerciseToGroup(currentMuscleGroup, currentExercise);

    addWorkoutToTable(workout);
    saveWorkoutToStorage(workout);

    weightInput.value = '';
    repsInput.value = '';
    noteInput.value = '';
    historyHint.textContent = '';
});

// 4. MEGJELENÍTÉS A TÁBLÁZATBAN
function addWorkoutToTable(workout) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', workout.id);

    tr.innerHTML = `
        <td>${workout.date}</td>
        <td><small>${workout.muscleGroup || '-'}</small></td>
        <td><strong>${workout.exercise}</strong> <small>(${workout.setNumber}. sorozat)</small></td>
        <td>${workout.weight} kg</td>
        <td>${workout.reps}x</td>
        <td>${workout.note || '-'}</td>
        <td><button class="delete-btn" onclick="deleteWorkout(${workout.id})">X</button></td>
    `;

    workoutList.insertBefore(tr, workoutList.firstChild);
}

// 5. STORAGE KEZELÉS
function saveWorkoutToStorage(workout) {
    let workouts = getWorkoutsFromStorage();
    workouts.push(workout);
    localStorage.setItem('workouts', JSON.stringify(workouts));
}

function getWorkoutsFromStorage() {
    return localStorage.getItem('workouts') ? JSON.parse(localStorage.getItem('workouts')) : [];
}

function loadWorkouts() {
    const workouts = getWorkoutsFromStorage();
    workouts.forEach(workout => addWorkoutToTable(workout));
}

function deleteWorkout(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) row.remove();

    let workouts = getWorkoutsFromStorage();
    workouts = workouts.filter(w => w.id !== id);
    localStorage.setItem('workouts', JSON.stringify(workouts));
}

// 6. ADATOK EXPORTÁLÁSA
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

// 7. TÁBLÁZAT KERESŐ / SZŰRŐ LOGIKA
searchFilterInput.addEventListener('input', function() {
    const filterValue = this.value.toLowerCase();
    const rows = workoutList.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(filterValue)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// 8. STOPPER LOGIKA (REZGÉSSEL ÉS SÍPOLÓ HANGGAL)
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

// SÍPOLÓ HANG GENERÁLÁSA BÖNGÉSZŐBŐL (KÜLSŐ AUDIO FÁJL NÉLKÜL)
function playBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 800; // Hangmagasság (800 Hz)
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.8);
        setTimeout(() => osc.stop(), 800);
    } catch (e) {
        console.log('Audio nem támogatott');
    }
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
                
                // REZGÉS ÉS SÍPOLÁS LEJÁRTAKOR
                if ('vibrate' in navigator) {
                    navigator.vibrate([300, 100, 300, 100, 300]); // 3 rövid rezgés
                }
                playBeep(); // Sípoló hang megszólaltatása

                alert('⏱️ Lejárt a pihenőidő!');
            }
        }, 1000);
    }
});

document.getElementById('reset-timer-btn').addEventListener('click', function() {
    setTimer(60);
});
