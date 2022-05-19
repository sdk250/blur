function unLong() {
	searchText.style.animationName = "unLong";
	searchText.style.animationDuration = "1s";
	searchText.style.animationTimingFunction = "ease";
	searchText.style.animationIterationCount = "1";
	searchContent.innerHTML = "";
	searchContentBackground.style.display = "none";
	searchText.style.display = "none";
	sPic.style.animationName = "zoomIn";
	sPic.style.animationDuration = "0.6s";
	sPic.style.animationTimingFunction = "linear";
	sPic.style.animationIterationCount = 1;
	sPic.style.display = "inline";
	that.searchShow = false;
}
function cShow() {
	player.style.animationName = "cShow, zoomOut";
	player.style.animationDuration = "0.3s, 0.5s";
	player.style.animationTimingFunction = "linear, linear";
	player.style.animationIterationCount = "1, 1";
	player.style.display = "none";
	box.style.animationName = "show, zoomIn";
	box.style.animationDuration = "0.3s, 0.5s";
	box.style.animationTimingFunction = "linear. linear";
	box.style.animationIterationCount = "1, 1";
	box.style.display = "inline";
	lrcBakcground.style.display = "inline";
	box.style.top = (window.innerHeight / 2 - box.clientHeight / 2) + "px";
	box.style.left = (window.innerWidth / 2 - box.clientWidth / 2) + "px";
	lrcBakcground.style.top = (window.innerHeight / 2 - lrcBakcground.clientHeight / 1.4) + "px";
	lrcBakcground.style.left = (window.innerWidth / 2 - lrcBakcground.clientWidth / 2) + "px";
	that.lrcShow = true;
}
function aShow() {
	player.style.animationName = "show, zoomIn";
	player.style.animationDuration = "0.3s, 0.3s";
	player.style.animationTimingFunction = "linear, linear";
	player.style.animationIterationCount = "1, 1";
	player.style.display = "inline";
	box.style.animationName = "cShow, zoomOut";
	box.style.animationDuration = "0.3s, 0,3s";
	box.style.animationTimingFunction = "linear, linear";
	box.style.animationIterationCount = "1, 1";
	box.style.display = "none";
	lrcBakcground.style.display = "none";
	player.style.top = (window.innerHeight / 2.2 - player.clientHeight / 2) + "px";
	player.style.left = (window.innerWidth / 2 - player.clientWidth / 2) + "px";
	that.lrcShow = false;
}
function playAnimation() {
	picture.style.animationPlayState = "running";
	play.style.animationName = "cShow, zoomOut";
	play.style.animationDuration = "0.4s, 0.15s";
	play.style.animationTimingFunction = "linear, linear";
	play.style.animationIterationCount = "1, 1";
	play.style.display = "none";
	pause.style.animationName = "show, zoomIn";
	pause.style.animationDuration = "0.4s, 0.15s";
	pause.style.animationTimingFunction = "linear, linear";
	pause.style.animationIterationCount = "1, 1";
	pause.style.display = "inline";
	that.state = 0;
}
function pauseAnimation() {
	picture.style.animationPlayState = "paused";
	pause.style.animationName = "cShow, zoomOut";
	pause.style.animationDuration = "0.4s, 0.15s";
	pause.style.animationTimingFunction = "linear, linear";
	pause.style.animationIterationCount = "1, 1";
	pause.style.display = "none";
	play.style.animationName = "show, zoomIn";
	play.style.animationDuration = "0.4s, 0.15s";
	play.style.animationTimingFunction = "linear, linear";
	play.style.animationIterationCount = "1, 1";
	play.style.display = "inline";
	that.state = 1;
}
function nextAnimation() {
	next.style.animationName = "sTurn";
	next.style.animationDuration = "0.2s";
	next.style.animationTimingFunction = "linear";
	next.style.animationIterationCount = 6;
	next.style.animationDirection = "alternate";
}
function musicNameAnimation() {
	document.getElementById("mName").style.animationName = "wordsLoop";
	document.getElementById("mName").style.animationDuration = "6s";
	document.getElementById("mName").style.animationTimingFunction = "linear";
	document.getElementById("mName").style.animationIterationCount = "infinite";
}
function musicPeoAnimation() {
	document.getElementById("mPeo").style.animationName = "wordsLoop";
	document.getElementById("mPeo").style.animationDuration = "6s";
	document.getElementById("mPeo").style.animationTimingFunction = "linear";
	document.getElementById("mPeo").style.animationIterationCount = "infinite";
}