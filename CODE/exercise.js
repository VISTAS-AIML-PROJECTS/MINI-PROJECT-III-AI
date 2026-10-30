// Exercise live tracking controller
let pollInterval = null;
let currentExerciseName = "Hand Open and Close";
let currentTarget = 10;
let isSessionActive = false;
let completionModal = null;

const exerciseTips = {
    "Hand Open and Close": "Keep your palm facing the webcam approximately 40 to 60 cm away. Open all five fingers fully, then close them completely into a fist.",
    "Finger Spreading": "Keep your hand open facing the camera. Spread your fingers apart as wide as possible, then bring them back together.",
    "Thumb Opposition": "Face your palm to the camera. Touch your thumb tip to your index fingertip to make a pinch circle, then release.",
    "Wrist Flexion and Extension": "Hold your hand upright with wrist visible. Slowly tilt your hand sideways or bend your wrist, then return to neutral.",
    "Grasp and Release": "Simulate grasping a round cup or ball by curling all fingers inward firmly, then open your palm completely flat."
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Modal
    const modalEl = document.getElementById('completionModal');
    if (modalEl) {
        completionModal = new bootstrap.Modal(modalEl);
    }

    const selectExercise = document.getElementById('selectExercise');
    const instructionBox = document.getElementById('exerciseInstructions');
    const btnStart = document.getElementById('btnStart');
    const btnStop = document.getElementById('btnStop');
    const btnReset = document.getElementById('btnReset');

    // Exercise dropdown change handler
    if (selectExercise) {
        currentExerciseName = selectExercise.value;
        selectExercise.addEventListener('change', (e) => {
            currentExerciseName = e.target.value;
            if (instructionBox) {
                instructionBox.innerText = exerciseTips[currentExerciseName] || "Follow the visual feedback on the camera screen.";
            }
        });
    }

    // Target radio selector handler
    const targetRadios = document.querySelectorAll('input[name="targetRadio"]');
    targetRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                currentTarget = parseInt(e.target.value, 10);
                document.getElementById('metricTargetCount').innerText = currentTarget;
                document.getElementById('badgeTargetCount').innerText = currentTarget;
            }
        });
    });

    // Start Button Click
    btnStart.addEventListener('click', async () => {
        try {
            btnStart.disabled = true;
            const res = await fetch('/api/start_session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exercise: currentExerciseName,
                    target: currentTarget
                })
            });
            const data = await res.json();
            if (data.success) {
                isSessionActive = true;
                btnStop.disabled = false;
                selectExercise.disabled = true;
                targetRadios.forEach(r => r.disabled = true);
                
                // Start polling session state
                if (pollInterval) clearInterval(pollInterval);
                pollInterval = setInterval(pollSessionStatus, 500);
            }
        } catch (err) {
            console.error("Start session failed:", err);
            btnStart.disabled = false;
        }
    });

    // Stop Button Click
    btnStop.addEventListener('click', async () => {
        try {
            btnStop.disabled = true;
            const res = await fetch('/api/stop_session', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                endTrackingUI();
            }
        } catch (err) {
            console.error("Stop session failed:", err);
            btnStop.disabled = false;
        }
    });

    // Reset Button Click
    btnReset.addEventListener('click', async () => {
        try {
            await fetch('/api/reset_session', { method: 'POST' });
            document.getElementById('metricRepCount').innerText = '0';
            document.getElementById('badgeProgressCount').innerText = '0';
            document.getElementById('exerciseProgressBar').style.width = '0%';
            document.getElementById('exerciseProgressBar').innerText = '0%';
        } catch (err) {
            console.error("Reset failed:", err);
        }
    });
});

async function pollSessionStatus() {
    try {
        const res = await fetch('/api/session_status');
        const data = await res.json();

        // Update Repetition Counters
        document.getElementById('metricRepCount').innerText = data.count;
        document.getElementById('badgeProgressCount').innerText = data.count;
        document.getElementById('metricTargetCount').innerText = data.target;
        document.getElementById('badgeTargetCount').innerText = data.target;

        // Update Progress Bar
        const pBar = document.getElementById('exerciseProgressBar');
        pBar.style.width = `${data.progress_percent}%`;
        pBar.innerText = `${data.progress_percent}%`;

        // Update Duration Timer
        document.getElementById('durationTimer').innerText = data.duration_formatted;

        // Update Hand Tracking Status Badges
        const handBadge = document.getElementById('handStatusBadge');
        const metricHand = document.getElementById('metricHandStatus');
        if (data.hand_status === 'Hand Detected') {
            handBadge.className = 'badge bg-success text-white fs-6 px-3 py-2 rounded-pill ms-2';
            handBadge.innerHTML = '<i class="bi bi-hand-index-thumb-fill me-1"></i> Hand Detected';
            metricHand.className = 'fw-bold text-success';
            metricHand.innerText = 'Hand Detected';
        } else {
            handBadge.className = 'badge bg-warning text-dark fs-6 px-3 py-2 rounded-pill ms-2';
            handBadge.innerHTML = '<i class="bi bi-hand-index me-1"></i> No Hand Detected';
            metricHand.className = 'fw-bold text-warning';
            metricHand.innerText = 'No Hand Detected';
        }

        // Update Session State Badges
        const sessBadge = document.getElementById('sessionStatusBadge');
        const metricSess = document.getElementById('metricSessionStatus');
        if (data.session_status === 'Running') {
            sessBadge.className = 'badge bg-primary fs-6 px-3 py-2 rounded-pill';
            sessBadge.innerHTML = '<i class="bi bi-record-circle me-1"></i> Tracking Active';
            metricSess.className = 'fw-bold text-primary';
            metricSess.innerText = 'Running';
        } else {
            sessBadge.className = 'badge bg-secondary fs-6 px-3 py-2 rounded-pill';
            sessBadge.innerHTML = `<i class="bi bi-circle-fill me-1 small"></i> ${data.session_status}`;
            metricSess.className = 'fw-bold text-secondary';
            metricSess.innerText = data.session_status;
        }

        // Update Session ID & Coach Message
        document.getElementById('metricSessionId').innerText = data.session_id;
        if (data.message) {
            document.getElementById('liveStatusMessage').innerText = data.message;
        }

        // Check if completed target
        if (data.completed && isSessionActive) {
            endTrackingUI();
            showCompletionModal(data);
        }
    } catch (e) {
        console.warn("Polling error:", e);
    }
}

function endTrackingUI() {
    isSessionActive = false;
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnStop').disabled = true;
    document.getElementById('selectExercise').disabled = false;
    document.querySelectorAll('input[name="targetRadio"]').forEach(r => r.disabled = false);
}

function showCompletionModal(data) {
    document.getElementById('modalTargetNum').innerText = data.target;
    document.getElementById('modalExerciseName').innerText = data.exercise_name;
    document.getElementById('modalReps').innerText = data.count;
    document.getElementById('modalDuration').innerText = data.duration_formatted;
    if (completionModal) {
        completionModal.show();
    }
}
