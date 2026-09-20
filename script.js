let wakeLock = null;
let outroNotPlayed = true;
const targetTime = Date.now() + 1800000;
const timerDisplay = document.querySelector(".timer");
const startBtn = document.querySelector(".start-btn");
const outroChanting = new Audio('src_assets_audio_closing-chanting.mp3');
const introChanting = new Audio('src_assets_audio_intro-chanting.mp3');
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
		setTimeout(checkTime, 1000);
		timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
	}
	if (remainingMilliseconds <= 174000 && outroNotPlayed) {
		outroChanting.play();
		console.log("Playing Closing Audio");
		outroNotPlayed = false;
	}
}

startBtn.addEventListener("click", function() {
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
});