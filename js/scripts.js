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
    currentLine,
    audio,
    musicInfo,
    mName,
    mPeo,
    searchin;

dark = new Dark();
dark.selectId("test").innerText = '5.7.8';
audio = new window.Audio();
background = dark.selectId("background");
player = dark.selectId("player");
bottom = dark.selectId("bottom");
picture = dark.selectId("picture");
play = dark.selectId("play");
pause = dark.selectId("pause");
next = dark.selectId("next");
musicInfo = dark.selectId("musicInfo");
mName = dark.selectId("mName");
mPeo = dark.selectId("mPeo");
searchin = dark.selectId("searchin");
box = dark.selectId("box");
__eul = dark.selectId("lrc");
lrcBackground = dark.selectId("lrcBackground");


this.cache = [];

/* Init play state */
this.playState = false;

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
    lrcBackground.style.top = (window.innerHeight / 2 - lrcBackground.clientHeight / 1.4) + "px";
    lrcBackground.style.left = (window.innerWidth / 2 - lrcBackground.clientWidth / 2) + "px";
    box.style.top = (window.innerHeight / 2 - box.clientHeight / 2) + "px";
    box.style.left = (window.innerWidth / 2 - box.clientWidth / 2) + "px";
    picture.style.height = picture.offsetWidth + "px";
    console.log("chenge!");
};
window.onresize();

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
next.addEventListener("animationend", function () {
    next.style.animationName = "none";
});
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
audio.onloaded = () => {
    console.log("LOADED.");
    that.cache[that.playCode].res = window.URL.createObjectURL(this.src);
};
audio.addEventListener("timeupdate", function () {
    for (currentLine = 0; currentLine < oLRC.ms.length; currentLine++) {
        if (this.currentTime < oLRC.ms[currentLine + 1].t){
            currentLine > 0 ? __eul.children[currentLine - 1].setAttribute("style", "color: auto") : null;
            currentLine > 1 ? __eul.children[currentLine - 2].setAttribute("style", "color: auto") : null;
            currentLine > 2 ? __eul.children[currentLine - 3].setAttribute("style", "color: auto") : null;
            currentLine > 3 ? __eul.children[currentLine - 4].setAttribute("style", "color: auto") : null;
            __eul.children[currentLine].style.color = "white";
            __eul.children[currentLine].style.fontSize = "140%";
            __eul.style.transform = "translateY(" + (box.clientHeight * 0.5 - __eul.children[currentLine].offsetTop) + "px)";
            break;
        }
    }
});
mName.onclick = (event) => {
    mName.style.display = "none";
    searchin.style.display = "inline";
    searchin.value = mName.innerText;
    searchin.focus();
};
searchin.onblur = (event) => {
    mName.style.display = "inline";
    searchin.style.display = "none";
    window.onkeydown = keyListen;
}
searchin.onfocus = (event) => {
    window.onkeydown = null;
    searchin.select();
}
searchin.onkeydown = (event) => {
    if (event.keyCode == 13) {
        searchin.blur();
        Pause();
        that.playState = false;
        that.xhr.open("POST", "https://sdk250.cn/api/id", true);
        that.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        that.xhr.dataType = "json";
        that.xhr.responseType = "json";
        that.xhr.onload = (res) => {
            let data = res.currentTarget.response;
            if (data.data == null) {
                console.log("The current song has no copyright, Please next song.");
                Next();
                return false;
            }
            that.cache[++that.playCode] = {
                id: data.id,
                data: data.data,
                name: data.name,
                picture: data.picture,
                art: data.art,
                lyric: data.lyric
            };
            playerInitial(that.cache[that.playCode]);
        };
        that.xhr.onerror = (res) => {
            Next();
        };
        that.xhr.send("key=" + event.target.value);
    }
};


const get = () => {
    that.xhr.open("GET", "https://api.uomg.com/api/rand.music?sort=热歌榜&format=json", true);
    that.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    that.xhr.dataType = "json";
    that.xhr.responseType = "json";
    that.xhr.onload = (res) => {
        let id = /url\?id\=(\d{3,12})/.exec(res.currentTarget.response.data.url)[1];
        that.playState = false;
        that.xhr.open("POST", "https://sdk250.cn/api/id", true);
        that.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        that.xhr.dataType = "json";
        that.xhr.responseType = "json";
        that.xhr.onload = (res) => {
            let data = res.currentTarget.response;
            if (data.data == null) {
                console.log("The current song has no copyright, Please next song.");
                Next();
                return false;
            }
            that.cache[window.Object.keys(that.cache).length] = {
                id: id,
                data: data.data,
                name: data.name,
                picture: data.picture,
                art: data.art,
                lyric: data.lyric
            };
            playerInitial(that.cache[that.playCode]);
        };
        that.xhr.send("songid=" + id);
    };
    that.xhr.send(null);
};
get();

function Play() {
    if (that.playState == true)
        audio.play();
    else {
        return false;
    }
}
function Pause() {
    if (that.playState == true)
        audio.pause();
    else
        return false;
}
function Next() {
    if (that.playCode < window.Object.keys(that.cache).length - 1){
        Pause(true);
        playerInitial(that.cache[++that.playCode])
        return true;
    } else if (that.playCode == window.Object.keys(that.cache).length - 1) {
        that.playCode++;
    }
    get();
    Pause();
    that.playState = false;
    if (!that.lrcShow)
        nextAnimation();
}
function Previous() {
    if (window.Object.keys(that.cache).length < 2 || that.playCode <= 0) {
        console.log("No cache");
        return false;
    }
    Pause();
    playerInitial(that.cache[--that.playCode]);
}
function playerInitial(parameter) {
    if (typeof(parameter.res) == "undefined")
        audio.src = parameter.data;
    else
        audio.src = parameter.res;
    that.playState = true;
    if (window.Object.keys(that.cache).length > 1) {
        audio.oncanplay = function () {
            Play();
            console.log("AUTO PLAY");
        };
    }
    dark.selectId("title").innerText = parameter.name + " | Vistual-Music";
    mName.innerText = parameter.name;
    mPeo.innerText = parameter.art;
    if (mName.scrollWidth > musicInfo.clientWidth)
        musicNameAnimation(); // Text is too long.
    else if (mPeo.scrollWidth > musicInfo.clientWidth)
        musicPeoAnimation();
    if (typeof(parameter.picRes) == "undefined") {
        that.xhr.open("GET", parameter.picture, true);
        that.xhr.responseType = "blob";
        that.xhr.onload = (response) => {
            parameter.picRes = window.URL.createObjectURL(response.currentTarget.response);
            window.document.getElementsByTagName("body")[0].style.backgroundImage = "url(\"" + parameter.picRes + "\")";
            background.style.backgroundImage = "url(\"" + parameter.picRes + "\")";
            picture.style.backgroundImage = "url(\"" + parameter.picRes + "\")"; 
        };
        that.xhr.send(null);
    } else {
        window.document.getElementsByTagName("body")[0].style.backgroundImage = "url(\"" + parameter.picRes + "\")";
        background.style.backgroundImage = "url(\"" + parameter.picRes + "\")";
        picture.style.backgroundImage = "url(\"" + parameter.picRes + "\")"; 
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
        that.eli.style.fontSize = "100%";
        that.eli.style.opacity = 0.8;
        that.eli.innerText = oLRC.ms[i].c;
        __eul.appendChild(that.eli);
    }
}

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
window.onkeydown = keyListen;

function keyListen(e) {
    if (e.keyCode == 32) {
        if (that.audio.paused)
            Play();
        else
            Pause();
    }
    if (e.shiftKey && e.keyCode == 78)
        Next();
    if (e.shiftKey && e.keyCode == 82)
        Previous();
    if (e.keyCode == 84) 
        background.onclick();
    if (e.shiftKey && e.keyCode == 90) {
        console.log("Text Blur!");
        searchText.blur();
    }
}

// function unLong() {
//     searchText.style.animationName = "unLong";
//     searchText.style.animationDuration = "1s";
//     searchText.style.animationTimingFunction = "ease";
//     searchText.style.animationIterationCount = "1";
//     searchContent.innerHTML = "";
//     searchText.style.display = "none";
//     sPic.style.animationName = "zoomIn";
//     sPic.style.animationDuration = "0.6s";
//     sPic.style.animationTimingFunction = "linear";
//     sPic.style.animationIterationCount = 1;
//     sPic.style.display = "inline";
//     that.searchShow = false;
// }
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
    if (player.style.display != "none") {
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
