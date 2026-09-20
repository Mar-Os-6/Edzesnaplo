const form = document.getElementById('workout-form');
const exerciseInput = document.getElementById('exercise');
const weightInput = document.getElementById('weight');
const repsInput = document.getElementById('reps');
const workoutList = document.getElementById('workout-list');

// Betöltéskor beolvassuk a korábban elmentett edzéseket
document.addEventListener('DOMContentLoaded', loadWorkouts);

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const workout = {
        id: Date.now(),
        exercise: exerciseInput.value,
        weight: weightInput.value,
        reps: repsInput.value
    };

    addWorkoutToTable(workout);
    saveWorkoutToStorage(workout);

    // Mezők ürítése
    exerciseInput.value = '';
    weightInput.value = '';
    repsInput.value = '';
});

function addWorkoutToTable(workout) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', workout.id);

    tr.innerHTML = `
        <td><strong>${workout.exercise}</strong></td>
        <td>${workout.weight} kg</td>
        <td>${workout.reps}x</td>
        <td><button class="delete-btn" onclick="deleteWorkout(${workout.id})">X</button></td>
    `;

    workoutList.appendChild(tr);
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
    const workouts = getWorkoutsFromStorage();
    workouts.forEach(workout => addWorkoutToTable(workout));
}

function deleteWorkout(id) {
    // Törlés a képernyőről
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) row.remove();

    // Törlés a tárolóból
    let workouts = getWorkoutsFromStorage();
    workouts = workouts.filter(w => w.id !== id);
    localStorage.setItem('workouts', JSON.stringify(workouts));
}
