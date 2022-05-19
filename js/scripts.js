//JAVASCRIPT CONTENT
"use strict";
const that = this;
var player,
	background,
	buttom,
	picture,
	play,
	pause,
	next,
	lrcBakcground,
	dark,
	ppxx,
	oLRC,
	__eul,
	box,
	search,
	sPic,
	searchText,
	searchBackground,
	searchContent,
	searchContentBackground,
	currentLine,
	audio,
	musicInfo;

dark = new Dark();
dark.selectId("test").innerText = 3.0;
audio = new window.Audio();
background = dark.selectId("background");
player = dark.selectId("player");
buttom = dark.selectId("buttom");
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
searchBackground = dark.selectId("searchBackground");
searchContent = dark.selectId("searchContent");
searchContentBackground = dark.selectId("searchContentBackground");

this.cache = {};

/* init Onplay code */
this.playCode = 1;

player.style.top = (window.innerHeight / 2.2 - player.clientHeight / 2) + "px";
player.style.left = (window.innerWidth / 2 - player.clientWidth / 2) + "px";
player.style.borderRadius = "15px 50px 30px 5px";

play.style.left = (buttom.clientWidth / 2 - 20) + "px";
/* is Pause widget */
pause.style.left = (buttom.clientWidth / 2 - 20) + "px";
/* is Next widget */
next.style.left = (buttom.clientWidth / 2 + 40) + "px";
/* is musicInfo widget */
musicInfo.style.left = (buttom.clientWidth / 2 - 10) + "px";

search.style.top = (window.innerHeight / 15) + "px";
search.style.left = (window.innerWidth / 12) + "px";
searchText.style.top = -10 + "px";
searchText.style.left = 14 + "px";
searchBackground.style.top = (window.innerHeight / 16) + "px";
searchBackground.style.left = (window.innerWidth / 12) + "px";

lrcBakcground = dark.selectId("lrcBackground");
lrcBakcground.style.top = (window.innerHeight / 2 - lrcBakcground.clientHeight / 1.4) + "px";
lrcBakcground.style.left = (window.innerWidth / 2 - lrcBakcground.clientWidth / 2) + "px";

/* on window change */
window.onresize = function () {
	player.style.top = (window.innerHeight / 2.2 - player.clientHeight / 2) + "px";
	player.style.left = (window.innerWidth / 2 - player.clientWidth / 2) + "px";
	box.style.top = (window.innerHeight / 2 - box.clientHeight / 2) + "px";
	box.style.left = (window.innerWidth / 2 - box.clientWidth / 2) + "px";
	lrcBakcground.style.top = (window.innerHeight / 2 - lrcBakcground.clientHeight / 1.4) + "px";
	lrcBakcground.style.left = (window.innerWidth / 2 - lrcBakcground.clientWidth / 2) + "px";
	search.style.top = (window.innerHeight / 15) + "px";
	search.style.left = (window.innerWidth / 12) + "px";
	searchBackground.style.top = (window.innerHeight / 16) + "px";
	searchBackground.style.left = (window.innerWidth / 12) + "px";
	console.log("chenge!");
};

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
		console.log("sPic Error");
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
background.onclick = function() {
	if (that.lrcShow == false) {
		cShow();
		
	} else if (that.lrcShow == true) {
		aShow();
	} else {
		console.log("lrcShow Error!");
	}
};

play.addEventListener("click", Play);
pause.addEventListener("click", Pause);
next.addEventListener("click", Next);
picture.addEventListener("click", Previous);

get();
function get() {
	rq("GET", "https://api.uomg.com/api/rand.music", {"sort": "热歌榜","format": "json"}, "json", "json", function () {
		that.cache[(window.Object.keys(that.cache).length + 1)] = this.response;
		that.playerState = null;
		playerInitial(this.response);
	}, true);
}
function getMusicURL(parameter) {
	rq("POST", "http://106.13.205.72:5000/req", {"songids": /url\?id\=(\d{3,12})/.exec(parameter.data.url)[1]}, "json", "json", function () {
		if (window.JSON.parse(this.response[0]).data[0].url == null) {
			console.log("The current song has no copyright, Please next song.");
			that.playerState = true;
			Next();
			return false;
		}
		that.cache[that.playCode].data.lryicRes = window.JSON.parse(this.response[1]).lyric;
		createLrcObj(window.JSON.parse(this.response[1]).lrc.lyric);
		getMusicData(window.JSON.parse(this.response[0]));
	}, true);
}
function getMusicData(parameter) {
	rq("GET", parameter.data[0].url, null, null, "blob", function () {
		that.cache[that.playCode].data.res = window.URL.createObjectURL(this.response);
		that.playerState = true;
		audio.src = that.cache[that.playCode].data.res;
		audio.onpause = function() {
			Pause();
			console.log("BEEN PAUSE!");
		};
		audio.onplay = function() {
			Play();
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
		audio.addEventListener("timeupdate", function () {
			for (currentLine = 0; currentLine < oLRC.ms.length; currentLine++) {
				if (this.currentTime < oLRC.ms[currentLine + 1].t){
					currentLine > 0 ? __eul.children[currentLine - 1].setAttribute("style", "color: auto") : null;
					currentLine > 1 ? __eul.children[currentLine - 2].setAttribute("style", "color: auto") : null;
					currentLine > 2 ? __eul.children[currentLine - 3].setAttribute("style", "color: auto") : null;
					currentLine > 3 ? __eul.children[currentLine - 4].setAttribute("style", "color: auto") : null;
					__eul.children[currentLine].setAttribute("style", "color: white");
					__eul.style.transform = "translateY(" + (ppxx - __eul.children[currentLine].offsetTop) + "px)";
					break;
				}
			}
		});
	}, true);
}
this.state = 1;
function Play() {
	console.log("Play was click!");
	if (that.state == 1 && that.playerState == true) {
		audio.play();
		playAnimation();
	} else {
		console.log("state", that.state, that.playerState);
		return false;
	}
}
function Pause(bool) {
	console.log("Pause was click!");
	if (that.state == 0 && that.playerState == true) {
		audio.pause();
		pauseAnimation();
	} else {
		console.log("state", that.state, that.playerState);
		return false;
	}
	if (bool == true) {
		audio.src = null;
	}
}
function Next() {
	if (that.playerState != true) {
		console.log("Don't click");
		return false;
	}
	if (that.playCode < window.Object.keys(that.cache).length){
		that.playCode++;
		Pause(true);
		playerInitial(that.cache[that.playCode])
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
function playerInitial(parameter) {
	playerInit(parameter);
	getMusicPicture(parameter);
	getMusicURL(parameter);
	// getMusicLyric(parameter);
}
function playerInit(result) {
	musicInfo.innerHTML = "<p id=\"mName\">" + result.data.name + "</p>" + "<p id=\"mPeo\" style=\"font-size: 10px;\">" + result.data.artistsname + "</p>";
	if (document.getElementById("mName").scrollWidth > musicInfo.clientWidth) {
		console.log("Text is long.");
		musicNameAnimation();
	} else if (document.getElementById("mPeo").scrollWidth > musicInfo.clientWidth) {
		console.log("Text is long.");
		musicPeoAnimation();
	}
}
function getMusicPicture(parameter) {
	rq("GET", parameter.data.picurl, null, null, "blob", function() {
		that.cache[that.playCode].data.picRes = window.URL.createObjectURL(this.response);
		document.body.style.backgroundImage = "url(\"" + that.cache[that.playCode].data.picRes + "\")";
		background.style.backgroundImage = "url(\"" + that.cache[that.playCode].data.picRes + "\")";
		picture.style.backgroundImage = "url(\"" + that.cache[that.playCode].data.picRes + "\")"; 
	});
}
function Previous() {
	if (window.Object.keys(that.cache).length < 2 || that.playCode <= 0) {
		console.log("No cache");
		return false;
	}
	that.playCode--;
	audio.src = null;
	Pause(true);
	playerInitial(that.cache[that.playCode]);
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
	ppxx = 100;
	console.log(oLRC.ms.length);
	__eul.innerHTML = "";
	for (var i in oLRC.ms) {
		that.eli = document.createElement("li");
		that.eli.innerText = oLRC.ms[i].c;
		__eul.appendChild(that.eli);
	}
}
function getMusicLyric(parameter) {
	rq("GET", "https://api.obfs.dev/api/netease/lyric", {"id": /url\?id\=(\d{3,12})/.exec(parameter.data.url)[1]}, "json", "json", function () {
		that.cache[that.playCode].data.lryicRes = this.response;
		if (that.cache[that.playCode].data.lryicRes == true) {
			createLrcObj("[00:00.00] 纯音乐，请欣赏\n[06:66.66] ");
		} else {
			createLrcObj(that.cache[that.playCode].data.lryicRes.lrc.lyric);
		}
	});
}
searchText.oninput = function(e) {
	if (e.target.value == "") {
		searchContent.innerHTML = "";
		searchContentBackground.style.display = "none";
		return false;
	}
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
		searchContentBackground.style.display = "inline";
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
			that.state = 0;
			that.playCode++;
			Pause(true);
			playerInitial(that.cache[window.Object.keys(that.cache).length]);
		}
	});
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
		if (that.state == 1) {
			Play();
		} else if (that.state == 0) {
			Pause();
		} else {
			console.log("Error!");
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