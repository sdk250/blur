//JAVASCRIPT CONTENT
"use strict";
const that = this;
that.xhr = new window.XMLHttpRequest();
var player,
	background,
	bottom,
	picture,
	play,
	pause,
	next,
	lrcBackground,
	dark,
	oLRC,
	__eul,
	box,
	search,
	sPic,
	searchText,
	searchContent,
	currentLine,
	audio,
	musicInfo;

dark = new Dark();
dark.selectId("test").innerText = 4.6;
audio = new window.Audio();
background = dark.selectId("background");
player = dark.selectId("player");
bottom = dark.selectId("bottom");
picture = dark.selectId("picture");
play = dark.selectId("play");
pause = dark.selectId("pause");
next = dark.selectId("next");
musicInfo = dark.selectId("musicInfo");
box = dark.selectId("box");
__eul = dark.selectId("lrc");
search = dark.selectId("search");
sPic = dark.selectId("searchPic");
searchText = dark.selectId("searchText");
searchContent = dark.selectId("searchContent");
lrcBackground = dark.selectId("lrcBackground");


this.cache = [];

/* init Onplay code */
this.playCode = 0;

player.style.borderRadius = "15px 50px 30px 5px";

/* on window change */
window.onresize = function () {
	if (window.innerWidth * 0.7 < 400 && window.innerHeight * 0.2 < 200) {
		player.style.width = window.innerWidth * 0.7 + "px";
		player.style.height = window.innerHeight * 0.2 + "px";
	} else {
		player.style.width = "400px";
		player.style.height = "200px";
	}
	player.style.top = (window.innerHeight / 2.2 - player.clientHeight / 2) + "px";
	player.style.left = (window.innerWidth / 2 - player.clientWidth / 2) + "px";
	play.style.left = (bottom.clientWidth / 2 - 20) + "px";
	/* is Pause widget */
	pause.style.left = (bottom.clientWidth / 2 - 20) + "px";
	/* is Next widget */
	next.style.left = (bottom.clientWidth / 2 + bottom.offsetWidth * 0.2) + "px";
	/* is musicInfo widget */
	musicInfo.style.left = (bottom.clientWidth / 2 - 10) + "px";
	search.style.top = (window.innerHeight / 15) + "px";
	search.style.left = (window.innerWidth / 12) + "px";
	searchText.style.top = -10 + "px";
	searchText.style.left = 14 + "px";
	lrcBackground.style.top = (window.innerHeight / 2 - lrcBackground.clientHeight / 1.4) + "px";
	lrcBackground.style.left = (window.innerWidth / 2 - lrcBackground.clientWidth / 2) + "px";
	box.style.top = (window.innerHeight / 2 - box.clientHeight / 2) + "px";
	box.style.left = (window.innerWidth / 2 - box.clientWidth / 2) + "px";
	picture.style.height = picture.offsetWidth + "px";
	console.log("chenge!");
};
window.onresize();

this.searchShow = false;
sPic.onclick = function() {
	if (that.searchShow == false) {
		sPic.style.animationName = "zoomOut";
		sPic.style.animationDuration = "0.6s";
		sPic.style.animationTimingFunction = "linear";
		sPic.style.animationIterationCount = 1;
		searchText.style.animationName = "long";
		searchText.style.animationDuration = "1s";
		searchText.style.animationTimingFunction = "ease";
		searchText.style.animationIterationCount = 1;
		searchText.style.width = 120 + "px"; 
		searchText.style.display = "inline";
		sPic.style.display = "none";
		that.searchTimer = setTimeout(unLong, 3000);
		that.searchShow = true;
	} else {
		console.error("sPic Error");
	}
};
searchText.onblur = function() {
	if (that.searchTimer) {
		clearTimeout(that.searchTimer);
	}
	that.searchTimer = setTimeout(unLong, 3000);
};
searchText.onfocus = function() {
	if (that.searchTimer) {
		clearTimeout(that.searchTimer);
	}
	searchText.onkeydown = (event) => {
		if (event.keyCode == 13) {
			Pause(true);
			that.playCode++;
			that.playState = false;
			that.xhr.open("POST", "https://sdk250.cn/api/id", true);
			that.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			that.xhr.dataType = "json";
			that.xhr.responseType = "json";
			that.xhr.onload = (res) => {
				if (res.currentTarget.response.data == null) {
					console.log("The current song has no copyright, Please next song.");
					that.playerState = true;
					Next();
					return false;
				}
				that.cache[that.playCode] = {
					id: res.currentTarget.response.id,
					data: res.currentTarget.response.data,
					name: res.currentTarget.response.name,
					picture: res.currentTarget.response.picture,
					art: res.currentTarget.response.art,
					lyric: res.currentTarget.response.lyric
				};
				playerInitial(that.cache[that.playCode]);
			};
			that.xhr.send("key=" + event.target.value);
		}
	};
	/*
	searchText.onkeydown = function(e){
		if (e.keyCode == 13) {
			if (/[\u4e00-\u9fa5]+/.exec(this.value)[0] == "晴天" || this.value == "七里香") {
				musicPond(/[\u4e00-\u9fa5]+/.exec(this.value)[0]);
				return false;
			}
			function musicPond(name) {
				var artistsname, name, id, picurl;
				switch (name) {
					case "晴天":
						artistsname = "周杰伦";
						name = name;
						id = 186016;
						picurl = "https://img2.kuwo.cn/star/albumcover/500/64/96/2266534336.jpg";
						break;
					case "七里香":
						artistsname = "周杰伦";
						name = name;
						id = 186001;
						picurl = "https://img2.kuwo.cn/star/albumcover/500/30/97/4276557883.jpg";
						break;
					default:
						break;
				}
				that.cache[(window.Object.keys(that.cache).length + 1)] = window.JSON.stringify({
					"data": {
						"artistsname": artistsname,
						"name": name,
						"picurl": picurl,
						"url": "http://music.163.com/song/media/outer/url?id=" + id,
						"data": [{
							"url": "./music/" + artistsname + " - " + name + ".mp3",
						},{}]
					}
				});
				that.state = 0;
				that.playCode++;
				Pause(true);
				if (that.eli) {
					__eul.innerHTML = "";
				}
				playerInit(that.cache[that.playCode]);
				getMusicData(that.cache[that.playCode].data);
				getMusicLyric(that.cache[that.playCode]);
			}
		}
	};
	*/
};
this.lrcShow = false;
background.onclick = () => {
	if (that.lrcShow == false) {
		cShow();
	} else if (that.lrcShow == true) {
		aShow();
	} else {
		console.error("lrcShow Error!");
	}
};
lrcBackground.onclick = background.onclick;

play.addEventListener("click", Play);
pause.addEventListener("click", Pause);
next.addEventListener("click", Next);
picture.addEventListener("click", Previous);

const get = () => {
	that.xhr.open("GET", "https://api.uomg.com/api/rand.music?sort=热歌榜&format=json", true);
	that.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	that.xhr.dataType = "json";
	that.xhr.responseType = "json";
	that.xhr.onload = (res) => {
		let id = /url\?id\=(\d{3,12})/.exec(res.currentTarget.response.data.url)[1];
		that.playerState = false;
		that.xhr.open("POST", "https://sdk250.cn/api/id", true);
		that.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		that.xhr.dataType = "json";
		that.xhr.responseType = "json";
		that.xhr.onload = (res) => {
			if (res.currentTarget.response.data == null) {
				console.log("The current song has no copyright, Please next song.");
				that.playerState = true;
				Next();
				return false;
			}
			that.cache[window.Object.keys(that.cache).length] = {
				id: id,
				data: res.currentTarget.response.data,
				name: res.currentTarget.response.name,
				picture: res.currentTarget.response.picture,
				art: res.currentTarget.response.art,
				lyric: res.currentTarget.response.lyric
			};
			playerInitial(that.cache[window.Object.keys(that.cache).length - 1]);
		};
		that.xhr.send("songid=" + id);
	};
	that.xhr.send(null);
};
get();

function Play() {
	console.log("Play was click!");
	if (that.playerState == true) {
		audio.play();
	} else {
		console.log("state", that.playerState);
		return false;
	}
}
function Pause(bool) {
	console.log("Pause was click!");
	if (that.playerState == true) {
		audio.pause();
	} else {
		console.log("state", that.playerState);
		return false;
	}
	if (bool == true) {
		audio.src = null;
	}
}
function Next() {
	if (that.playerState != true) {
		console.log("Don't click");
		// return false;
	}
	if (that.playCode < window.Object.keys(that.cache).length - 1){
		Pause(true);
		playerInitial(that.cache[++that.playCode])
		return true;
	}
	get();
	that.playCode++;
	console.log("Next is click!");
	Pause(true);
	that.playerState = false;
	nextAnimation();
	next.addEventListener("animationend", function () {
		next.style.animationName = "none";
		console.log("Next animation is end.");
	});
}
function Previous() {
	if (window.Object.keys(that.cache).length < 2 || that.playCode <= 0) {
		console.log("No cache");
		return false;
	}
	Pause(true);
	playerInitial(that.cache[--that.playCode]);
}
const init_audio = (url) => {
	that.playerState = true;
	audio.src = url;
	audio.onpause = function() {
		pauseAnimation();
		console.log("BEEN PAUSE!");
	};
	audio.onplay = function() {
		playAnimation();
		console.log("BEEN PLAY!");
	};
	audio.onended = function(){
		Next();
		console.log("Restart");
	};
	if (window.Object.keys(that.cache).length > 1) {
		audio.oncanplay = function () {
			audio.play();
			console.log("AUTO PLAY");
		};
	}
};
audio.addEventListener("timeupdate", function () {
	for (currentLine = 0; currentLine < oLRC.ms.length; currentLine++) {
		if (this.currentTime < oLRC.ms[currentLine + 1].t){
			currentLine > 0 ? __eul.children[currentLine - 1].setAttribute("style", "color: auto") : null;
			currentLine > 1 ? __eul.children[currentLine - 2].setAttribute("style", "color: auto") : null;
			currentLine > 2 ? __eul.children[currentLine - 3].setAttribute("style", "color: auto") : null;
			currentLine > 3 ? __eul.children[currentLine - 4].setAttribute("style", "color: auto") : null;
			__eul.children[currentLine].setAttribute("style", "color: white");
			__eul.style.transform = "translateY(" + (box.clientHeight * 0.5 - __eul.children[currentLine].offsetTop) + "px)";
			break;
		}
	}
});

function playerInitial(parameter) {
	if ("res" in window.Object(parameter)) {
		init_audio(parameter.res);
	} else {
		let xhr = new window.XMLHttpRequest();
		xhr.open("GET", that.cache[that.playCode].data, true);
		xhr.responseType = "blob";
		xhr.onload = (res) => {
			parameter.res = window.URL.createObjectURL(res.currentTarget.response);
			init_audio(parameter.res);
		};
		xhr.send(null);
	}
	musicInfo.innerHTML = "<p id=\"mName\">" + parameter.name +
		"</p>" + "<p id=\"mPeo\" style=\"font-size: 10px;\">" + parameter.art + "</p>";
	if (document.getElementById("mName").scrollWidth > musicInfo.clientWidth) {
		console.log("Text is long.");
		musicNameAnimation();
	} else if (document.getElementById("mPeo").scrollWidth > musicInfo.clientWidth) {
		console.log("Text is long.");
		musicPeoAnimation();
	}
	if ("picRes" in window.Object(parameter)) {
		background.style.backgroundImage = "url(\"" + parameter.picRes + "\")";
		picture.style.backgroundImage = "url(\"" + parameter.picRes + "\")"; 
	} else {
		that.xhr.open("GET", parameter.picture, true);
		that.xhr.responseType = "blob";
		that.xhr.onload = (response) => {
			that.cache[that.playCode].picRes = window.URL.createObjectURL(response.currentTarget.response);
			background.style.backgroundImage = "url(\"" + that.cache[that.playCode].picRes + "\")";
			picture.style.backgroundImage = "url(\"" + that.cache[that.playCode].picRes + "\")"; 
		};
		that.xhr.send(null);
	}
	createLrcObj(parameter.lyric);
}
function createLrcObj(lrc) {
	oLRC = null;
	if(lrc.length == 0)
		return;
	var lrcs = lrc.split('\n');
	oLRC = {
		ti: "",
		ar: "",
		al: "",
		by: "",
		offset: 0,
		ms: []
	};
	currentLine = 0;
	for(var i in lrcs) {
		lrcs[i] = lrcs[i].replace(/(^\s*)|(\s*$)/g, "");
		var t = lrcs[i].substring(lrcs[i].indexOf("[") + 1, lrcs[i].indexOf("]"));
		var s = t.split(":");
		if (isNaN(parseInt(s[0]))) {
			for (var i in oLRC) {
				if (i != "ms" && i == s[0].toLowerCase()) {
					oLRC[i] = s[1];
				}
			}
		} else {
			var arr = lrcs[i].match(/\[(\d+:.+?)\]/g);
			var start = 0;
			for(var k in arr) {
				start += arr[k].length;
			}
			var content = lrcs[i].substring(start);
			for (var k in arr) {
				var t = arr[k].substring(1, arr[k].length-1);
				var s = t.split(":");
				oLRC.ms.push({
					t: (parseFloat(s[0])*60+parseFloat(s[1])).toFixed(3),
					c: content
				});
			}
		}
	}
	oLRC.ms[(window.Object.keys(oLRC.ms).length)] = {
		"t": (window.Math.floor(oLRC.ms[(window.Object.keys(oLRC.ms).length - 1)].t) + 3),
		"c": ""
	};
	console.log(oLRC.ms.length);
	__eul.innerHTML = "";
	for (var i in oLRC.ms) {
		that.eli = document.createElement("li");
		that.eli.innerText = oLRC.ms[i].c;
		__eul.appendChild(that.eli);
	}
}
searchText.oninput = function(e) {
	if (e.target.value == "") {
		searchContent.innerHTML = "";
		return false;
	}
	
	/*
	rq("GET", "https://api.obfs.dev/api/netease/search", {"s": e.target.value, "limit": 4}, "json", "json", function() {
		that.searchResult = this.response;
		searchContent.innerHTML = "";
		for (var i in that.searchResult.result.songs) {
			that.searchContents = document.createElement("li");
			that.searchContents.ids = i;
			that.searchContents.style.cursor = "pointer";
			that.searchContents.innerText = that.searchResult.result.songs[i].ar[0].name + " - " + that.searchResult.result.songs[i].name;
			searchContent.appendChild(that.searchContents);
			searchContent.appendChild(document.createElement("hr"));
		}
		that.searchContent.children[0].onclick = function() {
			getMusic(0);
		};
		that.searchContent.children[2].onclick = function() {
			getMusic(1);
		};
		that.searchContent.children[4].onclick = function() {
			getMusic(2);
		};
		that.searchContent.children[6].onclick = function() {
			getMusic(3);
		};
		function getMusic(parameter) {
			that.cache[(window.Object.keys(that.cache).length + 1)] = {
				"data": {
					"artistsname": that.searchResult.result.songs[parameter].ar[0].name,
					"name": that.searchResult.result.songs[parameter].name,
					"picurl": that.searchResult.result.songs[parameter].al.picUrl,
					"url": "http://music.163.com/song/media/outer/url?id=" + that.searchResult.result.songs[parameter].id
				}
			};
			audio.src = null;
			that.playCode++;
			Pause(true);
			playerInitial(that.cache[window.Object.keys(that.cache).length]);
		}
	});
	*/
};
function rq(method, URL, parameter, dataType, responseType, success) {
	dark.Ajax({
		"method": method,
		"url": URL,
		"headers": {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		"parameter": parameter,
		"dataType": dataType,
		"responseType": responseType,
		"success": success
	});
}
window.onkeydown = function(e) {
	if (e.keyCode == 32) {
		console.log("Speace!");
		if (that.audio.paused) {
			Play();
		} else {
			Pause();
		}
	}
	if (e.shiftKey && e.keyCode == 78) {
		console.log("NEXT");
		Next();
	}
	if (e.shiftKey && e.keyCode == 82) {
		console.log("PREVIOUS");
		Previous();
	}
	if (e.keyCode == 84) {
		console.log("Br.");
		background.onclick();
	}
	if (e.shiftKey && e.keyCode == 90) {
		console.log("Text Blur!");
		searchText.blur();
	}
};
function unLong() {
	searchText.style.animationName = "unLong";
	searchText.style.animationDuration = "1s";
	searchText.style.animationTimingFunction = "ease";
	searchText.style.animationIterationCount = "1";
	searchContent.innerHTML = "";
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
	box.style.top = (window.innerHeight / 2 - box.clientHeight / 2) + "px";
	box.style.left = (window.innerWidth / 2 - box.clientWidth / 2) + "px";
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
	player.style.top = (window.innerHeight / 2.2 - player.clientHeight / 2) + "px";
	player.style.left = (window.innerWidth / 2 - player.clientWidth / 2) + "px";
	that.lrcShow = false;
	window.onresize();
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
}
function nextAnimation() {
	if (player.style.display == "inline") {
		next.style.animationName = "sTurn";
		next.style.animationDuration = "0.2s";
		next.style.animationTimingFunction = "linear";
		next.style.animationIterationCount = 6;
		next.style.animationDirection = "alternate";
	}
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