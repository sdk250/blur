/**
 * Title: This is Dark_Mogul jQuery framework.
 * Info: This "jQuery" has Ajax and Id selecter, Welcome to Use.
 * By: Dark_Mogul.
 * Sources: https://www.github.com/sdk250/
 * Version: 2.1
 */
class Dark {
	constructor(object) {
		if (object) {
			if (typeof object != 'object') {console.log('Call mode Error!'); return false;};
			this.object = object;
		}
	}
	Ajax(object) {
		if (typeof object != 'object') {console.log('Call mode Error!'); return false;};
		var xhr = new window.XMLHttpRequest();
		var cache = null;
		xhr.timeout = 8000;
		if (object.method == 'GET' || object.method == 'get' || object.method == 'post' || object.method == 'POST') {
			if (/(http\:\/\/|https\:\/\/|).*\..{2,6}/.test(object.url) == false) {console.log('URL not correct');return false;}
			if (object.method == "GET" || object.method == "get") {
				if (object.parameter) {
					cache = "";
					if (window.Object.keys(object.parameter).length > 1) {
						for (var i = 0; i < window.Object.keys(object.parameter).length; i++) {
							cache += window.Object.keys(object.parameter)[i] + '=' + window.Object.values(object.parameter)[i] + '&';
						}
					} else {
						cache += window.Object.keys(object.parameter)[0] + '=' + window.Object.values(object.parameter)[0];
					}
					if (window.Object.keys(object.parameter) == "") {cache = null;};
				object.url += "?" + cache;
				cache = null;
				}
			}
			xhr.open(object.method, object.url, true);
			if (object.headers) {
				if (window.Object.keys(object.headers).length > 1) {
					for (var i = 0; i < window.Object.keys(object.headers).length; i++) {
						xhr.setRequestHeader(window.Object.keys(object.headers)[i], window.Object.values(object.headers)[i]);
					}
				} else {
					xhr.setRequestHeader(window.Object.keys(object.headers)[0], window.Object.values(object.headers)[0]);
				}
			}
			xhr.onload = object.success;
			xhr.ontimeout = object.timeout;
			xhr.onerror = object.fail;
			xhr.abort = object.abort;
			if (object.responseType) {
				xhr.responseType = object.responseType;
			}
			if (object.dataType) {
				xhr.dataType = object.dataType;
			}
			if (object.parameter) {
				cache = "";
				if (window.Object.keys(object.parameter).length > 1) {
					for (var i = 0; i < window.Object.keys(object.parameter).length; i++) {
						cache += window.Object.keys(object.parameter)[i] + '=' + window.Object.values(object.parameter)[i] + '&';
					}
				} else {
					cache += window.Object.keys(object.parameter)[0] + '=' + window.Object.values(object.parameter)[0];
				}
				if (window.Object.keys(object.parameter) == "") {cache = null;};
			}
			xhr.send(cache);
		} else {
			console.log('Currently only supports \'GET\' and \'POST\' method');
		}
	}
	selectId(id) {
		return document.getElementById(id);
	}
}
class DecodeAudio {
	constructor(URL) {
		this.status = false;
		this.AudioContext = window.AudioContext || window.webkitAudioContext;
		this.audioContext = new this.AudioContext();
		this.audio = new window.Audio();
		this.musicUrl(URL);
		this.analyser = this.audioContext.createAnalyser();
		this.audioNode = this.audioContext.createMediaElementSource(this.audio);
		this.analyser.fftSize = 512;
		this.audioNode.connect(this.analyser);
		this.analyser.connect(this.audioContext.destination);
		this.musicData = new window.Uint8Array(this.analyser.frequencyBinCount);
	}
	musicUrl(URL) {
		if (URL) {
			this.url = URL;
			this.init();
		}
	}
	init() {
		this.audio.src = this.url;
		this.status = true;
	}
	play() {
		if (this.status == false){return false;};
		this.audioContext.resume();
		this.audio.play();
	}
	pause() {
		if (this.status == false){return false;};
		this.audio.pause();
	}
	musicData() {
		if (this.status == false){return false;};
		return this.musicData;
	}
	analyser() {
		if (this.status == false){return false;};
		return this.analyser;
	}
	audioContext() {
		if (this.status == false){return false;};
		return this.audioContext;
	}
	audio() {
		if (this.status == false){return false;};
		return this.audio;
	}
	audioNode() {
		if (this.status == false){return false;};
		return this.audioNode;
	}
	url() {
		if (this.status == false){return false;};
		return this.url;
	}
}
class Lyric {
	constructor(lrc) {
		if(lrc.length == 0) return;
		this.lrcs = lrc.split('\n');
		this.oLRC = {
			ti: "",
			ar: "",
			al: "",
			by: "",
			offset: 0,
			ms: []
		};
		for(var i in this.lrcs) {
			this.lrcs[i] = this.lrcs[i].replace(/(^\s*)|(\s*$)/g, "");
			this.t = this.lrcs[i].substring(this.lrcs[i].indexOf("[") + 1, this.lrcs[i].indexOf("]"));
			this.s = this.t.split(":");
			if (isNaN(parseInt(this.s[0]))) {
				for (var i in this.oLRC) {
					if (i != "ms" && i == this.s[0].toLowerCase()) {
						this.oLRC[i] = this.s[1];
					}
				}
			} else {
				this.arr = this.lrcs[i].match(/\[(\d+:.+?)\]/g);
				this.start = 0;
				for(var k in this.arr) {
					this.start += this.arr[k].length;
				}
				this.content = this.lrcs[i].substring(this.start);
				for (var k in this.arr) {
					this.t = this.arr[k].substring(1, this.arr[k].length-1);
					this.s = this.t.split(":");
					this.oLRC.ms.push({
						t: (parseFloat(this.s[0]) * 60 + parseFloat(this.s[1])).toFixed(3),
						c: this.content
					});
				}
				
			}
		}
		return this.oLRC;
	}
}