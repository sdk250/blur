"use strict";
console.log("Ver: 4.46");
window.onload = function () {
	var player,
		background,
		buttom,
		picture,
		play,
		pause,
		next,
		musicInfo,
		bar,
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
		currentLine;

	/* init Dark & DecodeAudio widget */
	dark = new Dark();
	var audio = new Audio();

	/* init Background widget */
	background = dark.selectId("background");
	buttom = dark.selectId("buttom");
	picture = dark.selectId("picture");
	play = dark.selectId("play");
	pause = dark.selectId("pause");
	next = dark.selectId("next");
	musicInfo = dark.selectId("musicInfo");
	bar = dark.selectId("bar");
	box = dark.selectId("box");
	__eul = dark.selectId("lrc");
	search = dark.selectId("search");
	sPic = dark.selectId("searchPic");
	searchText = dark.selectId("searchText");
	searchBackground = dark.selectId("searchBackground");
	searchContent = dark.selectId("searchContent");
	searchContentBackground = dark.selectId("searchContentBackground");

	/* init Player position */
	player = dark.selectId("player");
	player.style.top = (window.innerHeight / 2.2 - player.clientHeight / 2) + "px";
	player.style.left = (window.innerWidth / 2 - player.clientWidth / 2) + "px";
	player.style.borderRadius = "15px 50px 30px 5px";

	/* init Search position */
	search.style.top = (window.innerHeight / 12) + "px";
	search.style.left = (window.innerWidth / 12) + "px";
	searchText.style.top = -14.5 + "px";
	searchText.style.left = 14 + "px";
	searchBackground.style.top = (window.innerHeight / 16) + "px";
	searchBackground.style.left = (window.innerWidth / 12) + "px";

	/* Keep window pointer */
	const that = this;

	/* init Audio Cache */
	this.cache = {};

	/* init Player status */
	this.status = 0;

	/* init Onplay code */
	this.playCode = 0;

	/**
	 * init Player widget
	 * 
	**/
	play.style.left = (buttom.clientWidth / 2 - 20) + "px";
	// play.style.backgroundImage = "url(\"" + playPic + "\")";
	/* is Pause widget */
	pause.style.left = (buttom.clientWidth / 2 - 20) + "px";
	// pause.style.backgroundImage = "url(\"" + pausePic + "\")";
	/* is Next widget */
	next.style.left = (buttom.clientWidth / 2 + 40) + "px";
	// next.style.backgroundImage = "url(\"" + nextPic + "\")";
	/* is musicInfo widget */
	musicInfo.style.left = (buttom.clientWidth / 2 - 10) + "px";

	/* is Lyric widget */
	var lrcBakcground = dark.selectId("lrcBackground");
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
		search.style.top = (window.innerHeight / 16) + "px";
		search.style.left = (window.innerWidth / 12) + "px";
		searchBackground.style.top = (window.innerHeight / 16) + "px";
		searchBackground.style.left = (window.innerWidth / 12) + "px";
		console.log("chenge!");
	};

	/* on click Event */
	play.addEventListener("click", Play);
	pause.addEventListener("click", Pause);
	next.addEventListener("click", Next);
	picture.addEventListener("click", Previous);
	rq();
	function rq() {
		dark.Ajax({
			"method": "GET",
			"url": "https://api.uomg.com/api/rand.music",
			"headers": {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			"parameter": {
				"sort": "热歌榜",
				"format": "json"
			},
			"dataType": "json",
			"responseType": "json",
			"success": function () {
				that.cache[(window.Object.keys(that.cache).length + 1)] = window.JSON.stringify(this.response);
				that.playCode++;
				getMusicURL(this.response);
				playerInit(this.response);
				getMusicLyric(this.response);
			},
			"timeout": function () {
				console.log("Request timeout", this);
				this.abort();
				Next();
			},
			"fail": function () {
				console.log("Request failed", this);
				this.abort();
				Next();
			}
		});
	}
	function getMusicURL(that) {
		dark.Ajax({
			"method": "POST",
			"url": "http://106.13.11.200:5000/req",
			"headers": {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			"parameter": {
				"songids": /url\?id\=(\d{3,12})/.exec(that.data.url)[1]
			},
			"dataType": "json",
			"responseType": "json",
			"success": function () {
				if (window.JSON.parse(this.response[0]).data[0].url == null) {
					messages("The current song has no copyright, Please next song.");
					this.abort();
					Next();
					return false;
				}
				getMusicData(window.JSON.parse(this.response[0]));
			},
			"timeout": function () {
				console.log("Request timeout", this);
				this.abort();
				Next();
			},
			"fail": function () {
				console.log("Request failed", this);
				this.abort();
				Next();
			}
		});
	}
	function getMusicData(parameter) {
		dark.Ajax({
			"method": "GET",
			"url": parameter.data[0].url,
			"headers": {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			"responseType": "blob",
			"success": function () {
				audio.src = window.URL.createObjectURL(this.response);
				that.status = 1;
				audio.addEventListener("canplay", function () {
					barAnimation(window.Math.floor(this.duration));
				});
				audio.addEventListener("ended", function(){
					Next();
					messages("Restart");
				});
				that.nextClick = false;
				if (that.timer) {
					console.log("Clear timer.");
					clearTimeout(that.timer);
				}
				if (that.audioNext == true) {
					Play();
					that.audioNext == false;
				}
			},
			"timeout": function () {
				console.log("Request timeout", this);
				this.abort();
				Next();
			},
			"fail": function () {
				console.log("Request failed", this);
				this.abort();
				Next();
			}
		});
	}
	function getMusicLyric(that) {
		dark.Ajax({
			"method": "GET",
			"url": "https://api.obfs.dev/api/netease/lyric",
			"headers": {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			"parameter": {
				"id": /url\?id\=(\d{3,12})/.exec(that.data.url)[1]
			},
			"dataType": "json",
			"responseType": "json",
			"success": function() {
				if (this.response.nolyric == true) {
					createLrcObj("[00:00.00] 纯音乐，请欣赏\n[06:66.66] ");
				} else {
					createLrcObj(this.response.lrc.lyric);
				}
			}
		});
	}
	this.searchShow = false;
	sPic.onclick = function() {
		if (that.searchTimer) {
			clearTimeout(that.searchTimer);
		}
		searchText.removeEventListener("animationend", uLo);
		if (that.searchShow == false) {
			sPic.style.animationName = "sTurn";
			sPic.style.animationDuration = "0.6s";
			sPic.style.animationTimingFunction = "linear";
			sPic.style.animationIterationCount = 1;
			sPic.addEventListener("animationend", turn);
			that.searchTimer = setTimeout(function() {
				searchText.style.animationName = "unLong";
				searchText.style.animationDuration = "1s";
				searchText.style.animationTimingFunction = "ease";
				searchText.style.animationIterationCount = "1";
				console.log("click2");
				searchText.addEventListener("animationend", uLo);
			}, 3000);
			that.searchShow = true;
		} else {
			console.log("Error");
		}
	};
	function uLo() {
		searchText.style.display = "none";
		sPic.style.animationName = "rTurn";
		sPic.style.animationDuration = "0.6s";
		sPic.style.animationTimingFunction = "linear";
		sPic.style.animationIterationCount = 1;
		sPic.addEventListener("animationend", function() {
			sPic.style.transform = "rotate(0deg)";
		});
		that.searchShow = false;
	}
	function turn() {
		searchText.style.animationName = "long";
		searchText.style.animationDuration = "1s";
		searchText.style.animationTimingFunction = "ease";
		searchText.style.animationIterationCount = 1;
		searchText.style.width = 120 + "px"; 
		sPic.style.transform = "rotate(-45deg)";
		searchText.style.display = "inline";
		sPic.removeEventListener("animationend", turn);
	}
	searchText.onblur = function() {
		if (that.searchTimer) {
			clearTimeout(that.searchTimer);
		}
		that.searchTimer = setTimeout(function() {
			searchText.style.animationName = "unLong";
			searchText.style.animationDuration = "1s";
			searchText.style.animationTimingFunction = "ease";
			searchText.style.animationIterationCount = "1";
			searchText.addEventListener("animationend", function() {
				sPic.removeEventListener("animationend", turn);
				searchText.style.display = "none";
				sPic.style.animationName = "rTurn";
				sPic.style.animationDuration = "0.6s";
				sPic.style.animationTimingFunction = "linear";
				sPic.style.animationIterationCount = 1;
				sPic.addEventListener("animationend", function() {
					sPic.style.transform = "rotate(0deg)";
				});
				that.searchShow = false;
			});
		}, 10000);
	};
	searchText.onfocus = function() {
		if (that.searchTimer) {
			clearTimeout(that.searchTimer);
		}
		searchText.onkeydown = function(e) {
			if (e.keyCode == 13) {
				console.log("Search", this.value);
				dark.Ajax({
					"method": "GET",
					"url": "https://api.obfs.dev/api/netease/search",
					"headers": {
						"Content-Type": "application/x-www-form-urlencoded"
					},
					"parameter": {
						"s": this.value,
						"limit": 4
					},
					"dataType": "json",
					"responseType": "json",
					"success": function() {
						var result = this.response;
						searchContent.innerHTML = "";
						console.log("Airt:", this.response.result.songs[0].ar[0].name, "\nName:", this.response.result.songs[0].name, "\nId:", this.response.result.songs[0].id, "\nPicture:", this.response.result.songs[0].al.picUrl);
						for (var i in this.response.result.songs) {
							that.searchContents = document.createElement("li");
							that.searchContents.ids = i;
							that.searchContents.innerText = this.response.result.songs[i].ar[0].name + " - " + this.response.result.songs[i].name;
							searchContent.appendChild(that.searchContents);
							
						}
						searchContentBackground.style.display = "inline";
						that.searchContent.children[0].onclick = function() {
							getMusic(0);
						};
						that.searchContent.children[1].onclick = function() {
							getMusic(1);
						};
						that.searchContent.children[2].onclick = function() {
							getMusic(2);
						};
						that.searchContent.children[3].onclick = function() {
							getMusic(3);
						};
						function getMusic(parameter) {
							that.cache[(window.Object.keys(that.cache).length + 1)] = window.JSON.stringify({
								"data": {
									"artistsname": result.result.songs[parameter].ar[0].name,
									"name": result.result.songs[parameter].name,
									"picurl": result.result.songs[parameter].al.picUrl,
									"url": "http://music.163.com/song/media/outer/url?id=" + result.result.songs[parameter].id
								}
							});
							that.status = 0;
							that.playCode++;
							Pause();
							if (that.eli) {
								__eul.innerHTML = "";
								audio.load();
							}
							playerInit(window.JSON.parse(that.cache[window.Object.keys(that.cache).length]));
							getMusicURL(window.JSON.parse(that.cache[window.Object.keys(that.cache).length]));
							getMusicLyric(window.JSON.parse(that.cache[window.Object.keys(that.cache).length]));
							that.audioNext = true;
							bar.style.animationName = "none";
							bar.style.display = "none";
						}
					}
				});
			}
		}
	};
	this.lrcShow = false;
	background.onclick = function() {
		if (that.lrcShow == false) {
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
		} else if (that.lrcShow == true) {
			player.style.animationName = "show, zoomIn";
			player.style.animationDuration = "0.3s, 0.3s";
			player.style.animationTimingFunction = "linear, linear";
			player.style.animationIterationCount = "1, 1";
			player.style.display = "inline";
			next.style.animationPlayState = "paused";
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
	}
	function createLrcObj(lrc) {
		if(lrc.length==0) return;
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
		for (var i in oLRC.ms) {
			that.eli = document.createElement("li");
			that.eli.innerText = oLRC.ms[i].c;
			__eul.appendChild(that.eli);
		}
		audio.addEventListener("timeupdate", function() {
			for (var j = currentLine; j < oLRC.ms.length; j++) {
				if (this.currentTime < oLRC.ms[j + 1].t){
					currentLine =  j;
					if (currentLine > 0) {
						__eul.children[currentLine - 1].setAttribute("style", "color: auto");
					}
					__eul.style.transform = "translateY(" + (ppxx - __eul.children[currentLine].offsetTop) + "px)";
					__eul.children[currentLine].setAttribute("style", "color: white");
					break;
				}
			}
		});
	}
	function Play() {
		console.log("Play is click!");
		if (that.status == 1) {
			audio.play();
			playAnimation();
		} else {
			messages("status", that.status);
			return false;
		}
	}
	function Pause() {
		console.log("Pause is click!");
		if (that.status == 0) {
			audio.pause();
			pauseAnimation();
		}
	}
	function Next() {
		if (that.nextClick == true) {
			messages("Don't click");
			return false;
		}
		messages("");
		that.nextClick = true;
		that.status = 0;
		console.log("Next is click!");
		if (that.eli) {
			__eul.innerHTML = "";
			audio.load();
		}
		Pause();
		rq();
		that.audioNext = true;
		that.timer = setTimeout(function () {
			that.nextClick = false;
		}, 2000);
		bar.style.animationName = "none";
		bar.style.display = "none";
		nextAnimation();
		next.addEventListener("animationend", function () {
			next.style.animationName = "none";
			console.log("Next animation is end.");
		});
	}
	function playerInit(result) {
		background.style.backgroundImage = "url(\"" + result.data.picurl + "\")";
		picture.style.backgroundImage = "url(\"" + result.data.picurl + "\")";
		musicInfo.innerHTML = "<p id=\"mName\">" + result.data.name + "</p>" + "<p id=\"mPeo\" style=\"font-size: 10px;\">" + result.data.artistsname + "</p>";
		if (document.getElementById("mName").scrollWidth > musicInfo.clientWidth) {
			console.log("Text is long.");
			musicNameAnimation();
		} else if (document.getElementById("mPeo").scrollWidth > musicInfo.clientWidth) {
			console.log("Text is long.");
			musicPeoAnimation();
		}
	}
	function barAnimation(time) {
		bar.style.display = "inline";
		bar.style.backgroundColor = "rgb(" + (that.r - 20) + "," + (that.g - 20) + "," + (that.b - 20) + ")";
		bar.style.animationName = "bard";
		bar.style.animationDuration = time + "s";
		bar.style.animationTimingFunction = "linear";
		bar.style.animationIterationCount = 1;
		bar.style.animationDirection = "normal";
		if (audio.paused == true) {
			bar.style.animationPlayState = "paused";
		}
	}
	function nextAnimation() {
		next.style.animationName = "sTurn";
		next.style.animationDuration = "0.2s";
		next.style.animationTimingFunction = "linear";
		next.style.animationIterationCount = 6;
		next.style.animationDirection = "alternate";
	}
	function playAnimation() {
		bar.style.animationPlayState = "running";
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
		that.status = 0;
	}
	function pauseAnimation() {
		bar.style.animationPlayState = "paused";
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
		that.status = 1;
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
	function Previous() {
		that.playCode--;
		if (window.Object.keys(that.cache).length < 2 || that.playCode <= 0) {
			console.log("No cache");
			return false;
		}
		that.status = 0;
		Pause();
		if (that.eli) {
			__eul.innerHTML = "";
			audio.load();
		}
		playerInit(window.JSON.parse(that.cache[that.playCode]));
		getMusicURL(window.JSON.parse(that.cache[that.playCode]));
		getMusicLyric(window.JSON.parse(that.cache[that.playCode]));
		that.audioNext = true;
		bar.style.animationName = "none";
		bar.style.display = "none";
	}
	window.onkeydown = function(e) {
		if (e.keyCode == 32) {
			console.log("Speace!");
			if (that.status == 1) {
				Play();
			} else if (that.status == 0) {
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
	function messages(parameter) {
		dark.selectId("message").innerText = parameter;
	}
};
