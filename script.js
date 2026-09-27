// =====================================
// 1. CONSTANTS & CONFIGURATIONS
// =====================================

// Sets timer duration to 30 minutes
const SESSION_DURATION_MS = 1800000;
// Sets final outro to start at 2 minutes 54 minutes
const OUTRO_TRIGGER_MS = 174000;
// Local storage key
const STORAGE_KEY = "meditationHistory";

const priorMeditationHours = 600;

// =====================================
// 2. STATE VARIABLES
// =====================================

// Initialzes wakeLock object
let wakeLock = null;
// Outro state sets to ready
let outroNotPlayed = true;
// Initilizes timerId for meditation countdown
let timerId = null;
// Sets a target time for 30 minutes from now
let targetTime = Date.now() + SESSION_DURATION_MS;
// Initialize current duration selector
let currentDuration = "day";
// Initialize current comparator selector
let currentComparator = "od"
let myChart = null;

// =====================================
// 3. DOM ELEMENTS
// =====================================

// Selects timer display element
const timerDisplay = document.querySelector(".timer");
// Selects history display
const historyDisplay = document.querySelector(".history")
// Selects start button
const startBtn = document.querySelector(".start-btn");
// Selects stop button
const stopBtn = document.querySelector(".stop-btn");
// Selects history button
const historyBtn = document.querySelector(".history-btn");
// Selects chime toggle
const chimeToggle = document.querySelector("#chime-toggle");
// Selects statistics button
const statisticsBtn = document.querySelector(".statistics-btn");
// Selects chart area
const chart = document.getElementById("meditationChart");
const durationSelect = document.querySelector('#duration-select')
const comparatorSelect = document.querySelector("#comparator-select")
const meditationHours = document.getElementById("meditation-hours")

// =====================================
// 4. AUDIO ASSETS
// =====================================

// Outro chanting audio object
const outroChanting = new Audio('assets/audio/out-chant.mp3');
// Intro chanting audio object
const introChanting = new Audio('assets/audio/intro-chant.mp3');
// Chime audio objects
const chimeAudio = new Audio("assets/audio/chime.mp3");

// =====================================
// 5. DATA LAYER
// =====================================

// Data Function that logs session time to meditationHistory local storage
function logSession() {
	// Calculates time left
	const timeLeft = targetTime - Date.now();
	// Calculates time elapsed
	const timeElapsed = Math.min(SESSION_DURATION_MS, SESSION_DURATION_MS - timeLeft);
	
	// Creates a session object with date and duration keys, todays date and time elapsed values
	const session = {
		date: Date.now(),
		duration: timeElapsed,
	}

	// Sets any stored values to the history variable
	const history = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
	// Appends session to history variable
	history.push(session);
	// Appends history to local storage
	localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// Data function to parse meditationHistory and output a chart
function collectStatistics(duration) {
	const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
	// Loop that collections duration per day
	const totalsByDate = sessions.reduce((acc, session) => {
		const sessionDate = new Date(session.date);
	// Gets meditation history and parses as a json
	// Sets dateKey to clean string of session.date from meditaiton history
	if (duration === 'week') {
		sessionDate.setDate(sessionDate.getDate() - sessionDate.getDay());
	} else if (duration === 'month') {
		sessionDate.setDate(1);
	} else if (duration === 'year') {
		sessionDate.setMonth(0, 1)
	} else if (duration === 'day') {
		sessionDate.getDate();
	}

	const dateKey = getLocalDateKey(sessionDate);
	// If date is in accumulator add another duration
	if (dateKey in acc) {
    	acc[dateKey] += session.duration;
	// If date not in accumulator initialize date to first duration 
  	} else {
		acc[dateKey] = session.duration;
	}
  	// Updates the accumulator with newest values
	return acc;
}, {});
	// Returns object with unique dates and duration values
	return totalsByDate;
}

function calculateLifetimeHours() {
	const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
	
	const  appMeditationMilliseconds = sessions.reduce(
		(total, session) => total + session.duration,
		0
	);

	const appMeditationHours = appMeditationMilliseconds / 3600000;
	return priorMeditationHours + appMeditationHours;
}

// =====================================
// 6. FORMATTING & PRESENTATION
// =====================================

// Utility function to format time for use in other functions that display
function formatTime(ms) {
	// Sets minutes variable
	const minutes = Math.floor(ms / 60000);
	// Sets seconds variable
	const seconds = Math.ceil((ms / 1000) % 60);
	// Returns formatt such as 25:34
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

// Utility function
function getLocalDateKey(d) {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function generateChartData(duration, comparator) {
	const stats = collectStatistics(duration);
	let labels = [];
	let barValues = [];

	const today = new Date();

	for(let i = 0; i < 3; i++) {
		const targetDate = new Date(today);

		if (comparator === 'od') {
			targetDate.setDate(today.getDate() - i);
		} else if (comparator === 'ow') {
			targetDate.setDate(today.getDate() - (i * 7));
		} else if (comparator === 'om') {
			targetDate.setMonth(today.getMonth() - i);
		} else if (comparator === 'oy') {
			targetDate.setFullYear(today.getFullYear() - i);
		}

		if (duration === 'week') {
			targetDate.setDate(targetDate.getDate() - targetDate.getDay());
		} else if (duration === 'month') {
			targetDate.setDate(1);
		} else if (duration === 'year') {
			targetDate.setMonth(0, 1);
		}

		const dateKey = getLocalDateKey(targetDate);
		const labelString = targetDate.toLocaleDateString('en-US',{ month: 'short', day: 'numeric', year: 'numeric' });

		labels.unshift(labelString);
		barValues.unshift((stats[dateKey] || 0) / 60000);

	}

	return {
		labels: labels,
		datasets: [{
			label: `${currentDuration} (${currentComparator})`,
			data: barValues,
			backgroundColor: 'white',
			borderWidth: 1
		}]
	};
}

meditationHours.textContent = `Lifetime ${calculateLifetimeHours().toFixed(0)}`

// =====================================
// 7. TIMER & SESSION CONTROLLER
// =====================================

// API Async function runs when app opens asking to set a wake lock
async function requestWakeLock() {
	// Sets a try to catch errors
	try {
		// Sets wakelock to browser lock object once responce is received
		wakeLock = await navigator.wakeLock.request('screen');
		// Logs success
		console.log('Screen Wake Lock is active!');
	} catch (err) {
		// Logs error
		console.error(`Wake Lock error: ${err.name} ${err.message}`);
	}
}

// Controller Function counts down the timer
// Finds the remaining time on the timer
// Display remaining time
// Plays audio files
// Calls handleSessionEnd to reset timer and save data
function checkTime() {
	// Calculates remaining time
	const remainingMilliseconds = targetTime - Date.now();

	// Displays remaining formatted time
	if (remainingMilliseconds >= 0) {
		timerDisplay.textContent = formatTime(remainingMilliseconds)
	
		// If remaining time is below threshhold and outro not played 1 of 2 things
		// If chant-off toggle on, then play chime
		// If chant-off toggle off, then play outro chant
		if (remainingMilliseconds <= OUTRO_TRIGGER_MS && outroNotPlayed) {
			if (chimeToggle.checked) {
				chimeAudio.play().catch(err => console.log("Chime play error:", err));
				console.log("Playing Chime Audio")
			} else{
			outroChanting.play().catch(err => console.log("Audio play error:", err));
			console.log("Playing Closing Audio");
		}
		// Specifies outro is played if the chant or chime block runs
		outroNotPlayed = false;
	}
		// Runs checkTime every second and sets that object to timerId
		timerId = setTimeout(checkTime, 1000);
	} else {
		// Once timer hits zero handleSessionEnd is called and outNotPlayed reset
		handleSessionEnd();
		outroNotPlayed = true;
	}
}

// UI function to reset app UI
function resetAppUI() {
	// Makes start button visible
	startBtn.style.display = "inline-block";
	// Makes stop button hidden
	stopBtn.style.display = "none";
	// Resets timer to 30:00
	timerDisplay.textContent = "30:00";

	// Pauses all chanting and resets all audios to 0
	introChanting.pause();
	introChanting.currentTime = 0;
	outroChanting.pause();
	outroChanting.currentTime = 0;
	chimeAudio.pause();
	chimeAudio.currentTime = 0;

	// Resets outroNotPlayed to initial value
	outroNotPlayed = true;
}

// Controller function to call reset functions
function handleSessionEnd() {
	// Clears timer for timerId
	clearTimeout(timerId);
	// Logs session date and duration
	logSession();
	// resets UI to initial values
	resetAppUI();
}

// UI function to update chart values based on selectors
function updateChartData() {
	if (myChart) {
		myChart.data = generateChartData(
			currentDuration, 
			currentComparator
		);
		myChart.update();
	}
}

// =====================================
// 8. EVENT LISTENERS
// =====================================

startBtn?.addEventListener("click", function() {
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

stopBtn?.addEventListener("click", function() {
	clearTimeout(timerId);
	logSession();
	resetAppUI();
});

historyBtn?.addEventListener("click", () => {
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

durationSelect?.addEventListener("change", (e) => {
	currentDuration = e.target.value.toLowerCase();
	updateChartData();
});

comparatorSelect?.addEventListener("change", (e) => {
	currentComparator = e.target.value.toLowerCase();
	updateChartData();
});

// =====================================
// 9. INITIALIZATION
// =====================================

// If chart varaible exist in the page, 
if (chart) {
	// Creates a myChart variable for use in other functions
	myChart = new Chart(chart, {
		type: 'bar',
		data: generateChartData(currentDuration, currentComparator),
		options: {
			scales: {
				y: {
					title: { display: true, text: 'Minutes meditated' }
				}
			}
		}
	});
}