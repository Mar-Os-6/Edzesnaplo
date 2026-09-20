// ELEMEK KIJELÖLÉSE A HTML-BŐL
const form = document.getElementById('workout-form');
const dateInput = document.getElementById('workout-date');
const exerciseInput = document.getElementById('exercise');
const weightInput = document.getElementById('weight');
const repsInput = document.getElementById('reps');
const noteInput = document.getElementById('note');
const historyHint = document.getElementById('history-hint');
const workoutList = document.getElementById('workout-list');
const exportBtn = document.getElementById('export-btn');

// A mai dátum automatikus beállítása
dateInput.value = new Date().toISOString().split('T')[0];

// 1. ADATOK BETÖLTÉSE INDULÁSKOR
document.addEventListener('DOMContentLoaded', loadWorkouts);

// 2. ELŐZŐ SÚLY JAVASLATA BEÍRÁSKOR
exerciseInput.addEventListener('input', function() {
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
});

// 3. MENTÉS GOMB MEGNYOMÁSA
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const workouts = getWorkoutsFromStorage();
    
    const currentDate = dateInput.value;
    const currentExercise = exerciseInput.value.trim();
    const existingSets = workouts.filter(w => w.date === currentDate && w.exercise.toLowerCase() === currentExercise.toLowerCase());
    const setNumber = existingSets.length + 1;

    const workout = {
        id: Date.now(),
        date: currentDate,
        exercise: currentExercise,
        setNumber: setNumber,
        weight: weightInput.value,
        reps: repsInput.value,
        note: noteInput.value.trim()
    };

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
        <td><strong>${workout.exercise}</strong> <small>(${workout.setNumber}. soroz)</small></td>
        <td>${workout.weight} kg</td>
        <td>${workout.reps}x</td>
        <td>${workout.note || '-'}</td>
        <td><button class="delete-btn" onclick="deleteWorkout(${workout.id})">X</button></td>
    `;

    workoutList.insertBefore(tr, workoutList.firstChild);
}

// 5. TÁROLÁS
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

// 7. KÜLÖNÁLLÓ STOPPER LOGIKA (ALAPÉRTELMEZETTEN 60 MP)
let timerInterval = null;
let secondsLeft = 60; // 1 percre módosítva
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
                alert('⏱️ Lejárt a pihenőidő!');
            }
        }, 1000);
    }
});

document.getElementById('reset-timer-btn').addEventListener('click', function() {
    setTimer(60); // Visszaállítás 1 percre
});
