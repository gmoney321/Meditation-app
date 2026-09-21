let wakeLock = null;
let outroNotPlayed = true;
let timerId = null;
let targetTime = Date.now() + 1800000;
const timerDisplay = document.querySelector(".timer");
const historyDisplay = document.querySelector(".history")
const startBtn = document.querySelector(".start-btn");
const outroChanting = new Audio('src_assets_audio_closing-chanting.mp3');
const introChanting = new Audio('src_assets_audio_intro-chanting.mp3');
const stopBtn = document.querySelector(".stop-btn")
const historyBtn = document.querySelector(".history-btn")
async function requestWakeLock() {
	try {
		wakeLock = await navigator.wakeLock.request('screen');
		console.log('Screen Wake Lock is active!');
	} catch (err) {
		console.error(`Wake Lock error: ${err.name} ${err.message}`);
	}
}

function checkTime() {
	const remainingMilliseconds = targetTime - Date.now();
	let minutes = Math.floor(remainingMilliseconds / 60000);
	let seconds = Math.ceil((remainingMilliseconds / 1000) % 60);
	console.log(minutes);
	console.log(seconds);
	console.log(remainingMilliseconds)
	if (remainingMilliseconds >= 0) {
		timerId = setTimeout(checkTime, 1000);
		timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
	}
	if (remainingMilliseconds <= 174000 && outroNotPlayed) {
		outroChanting.play();
		console.log("Playing Closing Audio");
		outroNotPlayed = false;
	}
}

function logTimeLeft() {
	let timeLeft = targetTime -Date.now();
	let timeElapsed = 1800000 - timeLeft
	const session = {
		date: new Date().toLocaleString(),
		duration: timeElapsed
	}

	let history = JSON.parse(localStorage.getItem("meditationHistory")) || [];
	
	history.push(session);

	localStorage.setItem("meditationHistory", JSON.stringify(history));
}

startBtn.addEventListener("click", function() {
	targetTime = Date.now() + 1800000;
	checkTime();

	outroChanting.play().then(() => {
		outroChanting.pause();
		outroChanting.currentTime = 0;
	}).catch(error => {
		console.log("Audio unlock failed:", error);
	});

	introChanting.play();
	console.log("Playing Closing Audio");
	requestWakeLock();

	stopBtn.style.display = "inline-block";
	startBtn.style.display = "none";
});

stopBtn.addEventListener("click", function() {
	startBtn.style.display = "inline-block";
	stopBtn.style.display = "none";
	clearTimeout(timerId);
	timerDisplay.textContent = "30:00"
	logTimeLeft()
});

historyBtn.addEventListener("click", function() {
	let rawData = localStorage.getItem("meditationHistory");
	console.log(rawData);
	console.log("history clicked")
	let parsedData = JSON.parse(rawData) || [];
	historyDisplay.style.display = "inline-block";
	historyDisplay.textContent = JSON.stringify(parsedData, null, 2);
	
});