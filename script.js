// ELEMEK KIJELÖLÉSE
const form = document.getElementById('workout-form');
const dateInput = document.getElementById('workout-date');
const muscleGroupSelect = document.getElementById('muscle-group');
const quickExercisesContainer = document.getElementById('quick-exercises');
const exerciseInput = document.getElementById('exercise');

// SÚLYZÓS ÉS KARDIÓ CONTAINER-EK
const resistanceFields = document.getElementById('resistance-fields');
const setsContainer = document.getElementById('sets-container');
const addSetBtn = document.getElementById('add-set-btn');
const cardioFields = document.getElementById('cardio-fields');

// KARDIÓ INPUTOK
const cardioTimeInput = document.getElementById('cardio-time');
const cardioInclineInput = document.getElementById('cardio-incline');
const cardioSpeedInput = document.getElementById('cardio-speed');

const noteInput = document.getElementById('note');
const historyHint = document.getElementById('history-hint');
const workoutList = document.getElementById('workout-list');
const exportBtn = document.getElementById('export-btn');
const searchFilterInput = document.getElementById('search-filter');

// Mai dátum beállítása
dateInput.value = new Date().toISOString().split('T')[0];

// ALAPÉRTELMEZETT GYAKORLATOK
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

// 1. INDULÁSKOR BETÖLTÉS
document.addEventListener('DOMContentLoaded', () => {
    loadWorkouts();
    renderQuickExercises();
    handleMuscleGroupChange();
    resetSetRows();
});

// DINAMIKUS SOROZAT KEZELÉS A FORM-BAN
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

// 2. IZOMCSOPORT VÁLTOZÁSKOR
muscleGroupSelect.addEventListener('change', () => {
    exerciseInput.value = '';
    historyHint.textContent = '';
    resetSetRows();
    renderQuickExercises();
    handleMuscleGroupChange();
});

// MEZŐK VÁLTÁSA: KARDIÓ VS SÚLYZÓS EDZÉS
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

// MENTETT GYAKORLATOK LEKÉRÉSE / TÁROLÁSA
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

// ELŐZŐ SÚLY / KARDIÓ ADAT JAVASLAT
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

    // Mezők alaphelyzetbe állítása mentés után
    exerciseInput.value = '';
    cardioTimeInput.value = '';
    cardioInclineInput.value = '';
    cardioSpeedInput.value = '';
    noteInput.value = '';
    historyHint.textContent = '';
    resetSetRows();

    // Táblázat újratöltése a frissített sorszámokkal és sorozatszámítással
    loadWorkouts();
});

// 4. MEGJELENÍTÉS A TÁBLÁZATBAN
function addWorkoutToTable(workout, totalSetsCount, currentSetNum) {
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
        col4 = `${workout.weight} kg`;
        
        // Csak akkor írjuk ki a (X. sorozat) szöveget, ha 1-nél több sorozat van az adott napon!
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

// TÁROLÁS, BETÖLTÉS, TÖRLES, EXPORT ÉS STOPPER LOGIKA
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

    // Megszámoljuk, hogy az egyes (dátum + gyakorlat) párosokból hány sorozat létezik
    const setCounts = {};
    workouts.forEach(w => {
        if (!w.isCardio) {
            const key = `${w.date}_${w.exercise.toLowerCase()}`;
            setCounts[key] = (setCounts[key] || 0) + 1;
        }
    });

    // Nyomon követjük az aktuális sorozatszámot (1., 2., 3...)
    const setIndexes = {};

    workouts.forEach(workout => {
        let totalSets = 0;
        let currentSetNum = 1;

        if (!workout.isCardio) {
            const key = `${workout.date}_${workout.exercise.toLowerCase()}`;
            totalSets = setCounts[key] || 0;
            setIndexes[key] = (setIndexes[key] || 0) + 1;
            currentSetNum = setIndexes[key];
        }

        addWorkoutToTable(workout, totalSets, currentSetNum);
    });
}

function deleteWorkout(id) {
    let workouts = getWorkoutsFromStorage();
    workouts = workouts.filter(w => w.id !== id);
    localStorage.setItem('workouts', JSON.stringify(workouts));
    
    // Törlés után újratöltjük a táblázatot, hogy a megmaradt sorozatok automatikusan újraszámozódjanak
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

searchFilterInput.addEventListener('input', function() {
    const filterValue = this.value.toLowerCase();
    const rows = workoutList.querySelectorAll('tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filterValue) ? '' : 'none';
    });
});

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
