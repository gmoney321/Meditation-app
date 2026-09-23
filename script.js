// Constants & Configurations
const SESSION_DURATION_MS = 1800000;
const OUTRO_TRIGGER_MS = 174000;
const STORAGE_KEY = "meditationHistory";

// State Variables
let wakeLock = null;
let outroNotPlayed = true;
let timerId = null;
let targetTime = Date.now() + SESSION_DURATION_MS;

// Dom Elements
const timerDisplay = document.querySelector(".timer");
const historyDisplay = document.querySelector(".history")
const startBtn = document.querySelector(".start-btn");
const stopBtn = document.querySelector(".stop-btn");
const historyBtn = document.querySelector(".history-btn");
const chimeToggle = document.querySelector("#chime-toggle");

// Audio Assets
const outroChanting = new Audio('src_assets_audio_closing-chanting.mp3');
const introChanting = new Audio('src_assets_audio_intro-chanting.mp3');
const chimeAudio = new Audio("chime.mp3");

// Core Functions
async function requestWakeLock() {
	try {
		wakeLock = await navigator.wakeLock.request('screen');
		console.log('Screen Wake Lock is active!');
	} catch (err) {
		console.error(`Wake Lock error: ${err.name} ${err.message}`);
	}
}

function formatTime(ms) {
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.ceil((ms / 1000) % 60);
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function checkTime() {
	const remainingMilliseconds = targetTime - Date.now();

	if (remainingMilliseconds >= 0) {
		timerDisplay.textContent = formatTime(remainingMilliseconds)
	
		if (remainingMilliseconds <= OUTRO_TRIGGER_MS && outroNotPlayed) {
			if (chimeToggle.checked) {
				chimeAudio.play().catch(err => console.log("Chime play error:", err));
				console.log("Playing Chime Audio")
			} else{
			outroChanting.play().catch(err => console.log("Audio play error:", err));
			console.log("Playing Closing Audio");
		}
		outroNotPlayed = false;
	}
		timerId = setTimeout(checkTime, 1000);
	} else {
		handleSessionEnd();
	}
}

function logSession() {
	const timeLeft = targetTime - Date.now();
	const timeElapsed = Math.min(SESSION_DURATION_MS, SESSION_DURATION_MS - timeLeft);
	
	const session = {
		date: Date.now(),
		duration: timeElapsed,
	}

	const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
	history.push(session);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function resetAppUI() {
	startBtn.style.display = "inline-block";
	stopBtn.style.display = "none";
	timerDisplay.textContent = "30:00";

	introChanting.pause();
	introChanting.currentTime = 0;
	outroChanting.pause();
	outroChanting.currentTime = 0;
	chimeAudio.pause();
	chimeAudio.currentTime = 0;

	outroNotPlayed = true;
}

function handleSessionEnd() {
	clearTimeout(timerId);
	logSession();
	resetAppUI();
}

// Event Listeners

startBtn.addEventListener("click", function() {
	targetTime = Date.now() + SESSION_DURATION_MS;
	outroNotPlayed = true;

	outroChanting.play().then(() => {
		outroChanting.pause();
		outroChanting.currentTime = 0;
	}).catch(error => {
		console.log("Audio unlock failed:", error);
	});

	chimeAudio.play().then(() => {
		chimeAudio.pause();
		chimeAudio.currentTime = 0;
	}).catch(error => {
		console.log("Audio unlock failed:", error);
	});

	if (chimeToggle.checked) {
		chimeAudio.play().catch(err => console.log("Chime play error:", err));
        console.log("Playing Chime Audio");
	} else {
	introChanting.play();
	console.log("Playing Closing Audio");
	}
	requestWakeLock();
	checkTime();

	startBtn.style.display = "none";
	stopBtn.style.display = "inline-block";
});

stopBtn.addEventListener("click", function() {
	clearTimeout(timerId);
	logSession();
	resetAppUI();
});

historyBtn.addEventListener("click", () => {
	const rawData = localStorage.getItem(STORAGE_KEY);
	const parsedData = JSON.parse(rawData) || [];
	const dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
	
	const formattedData = parsedData.map(e => ({
			date: new Date(e.date).toLocaleDateString('en-US', dateOptions),
			duration: formatTime(e.duration)
	}));

	historyDisplay.textContent = JSON.stringify(formattedData, null, 2);

	historyDisplay.style.display = historyDisplay.style.display == "inline-block" ? "none" : "inline-block";
	
});