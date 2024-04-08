//JAVASCRIPT CONTENT
"use strict";
const that = this;
that.xhr = new window.XMLHttpRequest();
var player,
    background,
    bottom,
    picture,
    lock,
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
    version,
    animation_time,
    searchin;

dark = new Dark();
version = dark.selectId("test");
audio = new window.Audio();
background = dark.selectId("background");
player = dark.selectId("player");
bottom = dark.selectId("bottom");
picture = dark.selectId("picture");
lock = dark.selectId("lock");
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
/* Init time during animation */
animation_time = "0.3s, 0.4s";

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
            that.cache[that.playCode] = {
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

if (window.navigator.userAgent.match(
    /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
))
    window.document.getElementsByName("viewport")[0].content = "width=device-width, initial-scale=0.6, user-scalable=no";
else
    window.document.getElementsByName("viewport")[0].content = "width=device-width, initial-scale=1.0, user-scalable=no";

(function guide() {
    let visited = window.localStorage.getItem('visited');
    if (visited)
    {
        box.onclick = lrcBackground.onclick = background.onclick = () => {
            if (that.lrcShow == false) {
                player.style.animationName = "cShow, zoomOut";
                player.style.animationDuration = animation_time;
                player.style.animationTimingFunction = "ease-in, ease-out";
                player.style.animationIterationCount = "1, 1";
            } else if (that.lrcShow == true) {
                box.style.animationName = "cShow, zoomOut";
                box.style.animationDuration = animation_time;
                box.style.animationTimingFunction = "ease-in, ease-out";
                box.style.animationIterationCount = "1, 1";
            } else {
                console.error("lrcShow Error!");
            }
        };
        get();
    } else {
        let i = 0;
        box.onclick = lrcBackground.onclick = background.onclick = () => {
            play.style.border = next.style.border = picture.style.border = mName.style.border = 'none';
            play.innerText = next.innerText = picture.innerText = mName.innerText = '';
            switch(++i > 4 ? guide() : i)
            {
                case 1:
                    play.style.border = "solid red";
                    play.innerHTML = '<p style="color: white;">点击此处开始播放</p>';
                    break;
                case 2:
                    next.style.border = "solid red";
                    next.innerHTML = '<p style="color: white;">点击此处下一曲</p>';
                    break;
                case 3:
                    picture.style.border = "solid red";
                    picture.innerHTML = '<p style="color: white;">点击此处上一曲 / 长按可以单曲循环</p>';
                    break;
                case 4:
                    mName.style.border = "solid red";
                    mName.innerHTML = '<p style="color: white;">点击编辑歌名回车搜索歌曲</p>';
                    break;
            }
        };
        background.onclick();
        window.localStorage.setItem('visited', true);
    }
})();

/* Version code */
window.console.log(version.innerText = '6.5.6');

this.cache = [];

/* Init play state */
this.playState = false;

/* init Onplay code */
this.playCode = 0;

this.isFullscreen = false;

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
    lock.style.width = lock.style.height = picture.style.height;
};
window.onresize();

this.lrcShow = false;
play.addEventListener("click", Play);
pause.addEventListener("click", Pause);
next.addEventListener("click", Next);
// picture.addEventListener("click", Previous);
lock.addEventListener("touchstart", LongPress);
// lock.addEventListener("touchmove", () => {
//     clearTimeout(that.timer);
// });
lock.addEventListener("touchend", () => {
    clearTimeout(that.timer);
    if (+new Date() - that.startTime < 500) {
        Previous();
        lock.style.animationName = null;
    }
});
lock.addEventListener("mousedown", LongPress);
// lock.addEventListener("mousemove", () => {
//     clearTimeout(that.timer);
//     console.log("UNSET 1");
//     lock.style.animationName = null;
// });
lock.addEventListener("mouseup", () => {
    clearTimeout(that.timer);
    if (+new Date() - that.startTime < 600) {
        Previous();
        lock.style.animationName = null;
    }
});
lock.addEventListener("animationend", () => {
    lock.style.animationName = null;
});
next.addEventListener("animationend", () => {
    next.style.animationName = null;
});
player.addEventListener("animationend", (e) => {
    if (!that.lrcShow && e.target == player &&
        (e.animationName == "cShow" || e.animationName == "zoomOut")
    )
    {
        player.style.display = "none";
        box.style.animationName = "show, zoomIn";
        box.style.animationDuration = animation_time;
        box.style.animationTimingFunction = "ease-in, ease-out";
        box.style.animationIterationCount = "1, 1";
        box.style.display = "inline";
        box.style.top = (window.innerHeight / 2 - box.clientHeight / 2) + "px";
        box.style.left = (window.innerWidth / 2 - box.clientWidth / 2) + "px";
        that.lrcShow = true;
    }
});
box.addEventListener("animationend", (e) => {
    if (that.lrcShow && e.target == box &&
        (e.animationName == "cShow" || e.animationName == "zoomOut")
    )
    {
        box.style.display = "none";
        player.style.animationName = "show, zoomIn";
        player.style.animationDuration = animation_time;
        player.style.animationTimingFunction = "ease-in, ease-out";
        player.style.animationIterationCount = "1, 1";
        player.style.display = "inline";
        player.style.top = (window.innerHeight / 2.2 - player.clientHeight / 2) + "px";
        player.style.left = (window.innerWidth / 2 - player.clientWidth / 2) + "px";
        that.lrcShow = false;
        window.onresize();
    }
});

audio.onpause = function() {
    console.log("BEEN PAUSE!");
};
audio.onplay = function() {
    playAnimation();
    console.log("BEEN PLAY!");
};
audio.onended = function() {
    Next();
    console.log("Restart");
};
audio.onloaded = function () {
    console.log("LOADED.");
    that.cache[that.playCode].res = window.URL.createObjectURL(this.src);
};
audio.addEventListener("timeupdate", function () {
    for (currentLine = 0; currentLine < oLRC.ms.length; currentLine++) {
        if (this.currentTime < oLRC.ms[currentLine + 1].t) {
            currentLine > 0 ? __eul.children[currentLine - 1].setAttribute("style", "color: auto") : null;
            currentLine > 1 ? __eul.children[currentLine - 2].setAttribute("style", "color: auto") : null;
            currentLine > 2 ? __eul.children[currentLine - 3].setAttribute("style", "color: auto") : null;
            currentLine > 3 ? __eul.children[currentLine - 4].setAttribute("style", "color: auto") : null;
            __eul.children[currentLine].style.color = "white";
            __eul.children[currentLine].style.fontSize = "130%";
            __eul.style.transform =
                "translateY(" +
                (box.clientHeight * 0.5 - __eul.children[currentLine].offsetTop) +
                "px)";
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
        // https://music.163.com/song?id=28302912
        if ("闹够了没有" == event.target.value) {
            internal_music(
                event.target.value,
                "赖伟锋",
                "28302912",
                "https://p2.music.126.net/KLh4hXNSFK8y96ahPda5fQ==/5940661324986386.jpg"
            )
            return;
        }
        that.xhr.open("POST", "https://sdk250.cn/api/key", true);
        that.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        that.xhr.dataType = "json";
        that.xhr.responseType = "json";
        that.xhr.onload = (res) => {
            let data = res.currentTarget.response;
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

function Play() {
    if (that.playState == true)
        audio.play();
    else {
        return false;
    }
}
function Pause() {
    if (that.playState == true) {
        let timer = setInterval(() => {
            if (audio.volume > 0.1) {
                audio.volume -= 0.01;
            } else {
                clearInterval(timer);
                audio.volume = 1;
                audio.pause();
            }
        }, 5);
        pauseAnimation();
    } else
        return false;
}
function Next() {
    console.log(that.playCode, that.cache);
    if (that.playCode < window.Object.keys(that.cache).length - 1) {
        Pause();
        playerInitial(that.cache[++that.playCode])
        return true;
    }
    Pause();
    that.playState = false;
    if (!that.lrcShow)
        nextAnimation();
    else
        next.style.animationName = null;
    that.playCode++;
    get();
}
function Previous() {
    if (window.Object.keys(that.cache).length < 2 || that.playCode <= 0) {
        console.log("No cache");
        return false;
    }
    Pause();
    playerInitial(that.cache[--that.playCode]);
}
function LongPress() {
    that.startTime = +new Date();
    lock.style.animationName = "lock";
    lock.style.animationDuration = "0.6s";
    lock.style.animationTimingFunction = "ease-in";
    if (audio.loop)
        lock.style.animationDirection = "reverse";
    else
        lock.style.animationDirection = "normal";
    lock.style.animationIterationCount = "1";

    that.timer = setTimeout(() => {
        if (audio.loop) {
            audio.loop = false;
            lock.style.borderColor = "transparent";
        } else {
            audio.loop = true;
            lock.style.borderColor = "rgb(175, 175, 175)";
        }
    }, 500);
}
function internal_music(name, art, id, picture) {
    let music = art + " - " + name
    that.xhr.open("GET", "music/" + music + ".lrc");
    that.xhr.dataType = "text";
    that.xhr.responseType = "text";
    that.xhr.onload = (event) => {
        that.cache[++that.playCode] = {
            id: id,
            data: "music/" + music + ".flac",
            name: name,
            picture: picture,
            art: art,
            lyric: event.currentTarget.responseText
        };
        playerInitial(that.cache[that.playCode]);
    };
    that.xhr.onerror = () => {
        console.log("INTERNAL ERROR.");
    };
    that.xhr.send(null);
}
function playerInitial(parameter) {
    if (!parameter)
        return;
    if (parameter.data == null) {
        console.log("The current song has no copyright, Please next song.");
        Next();
        return false;
    }
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
    else
        mName.style.animationName = null;
    if (mPeo.scrollWidth > musicInfo.clientWidth)
        musicPeoAnimation();
    else
        mPeo.style.animationName = null;

    background.style.backgroundImage =
        picture.style.backgroundImage = "url(\"" + parameter.picture + "\")"; 

    createLrcObj(parameter.lyric);
}
function getDominantColor(imageData) {
  const colorCount = {};
  let maxColorCount = 0;
  let dominantColor = [0, 0, 0];
  
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    
    const color = `${r},${g},${b}`;
    colorCount[color] = (colorCount[color] || 0) + 1;
    if (colorCount[color] > maxColorCount) {
      maxColorCount = colorCount[color];
      dominantColor = [r, g, b];
    }
  }
  
  return dominantColor;
}
function createLrcObj(lrc) {
    oLRC = null;
    if (lrc.length == 0)
        return;
    let lrcs = []
    for (let i of lrc)
        lrcs.push(i.split('\n'));
    oLRC = {
        ti: "",
        ar: "",
        al: "",
        by: "",
        offset: 0,
        ms: []
    };
    currentLine = 0;
    for (let i of lrcs)
    {
        for (let j of i)
        {
            j = j.replace(/(^\s*)|(\s*$)/g, "");
            let t = j.substring(j.indexOf("[") + 1, j.indexOf("]"));
            let s = t.split(":");
            if (isNaN(parseInt(s[0])))
            {
                for (let i in oLRC)
                    if (i != "ms" && i == s[0].toLowerCase())
                        oLRC[i] = s[1];
            } else {
                let arr = j.match(/\[(\d+:.+?)\]/g);
                let start = 0;
                for(let k of arr)
                    start += k.length;
                let content = j.substring(start);
                for (let k of arr) {
                    let t = k.substring(1, k.length-1);
                    let s = t.split(":");
                    let r = (parseFloat(s[0]) * 60 + parseFloat(s[1])).toFixed(3);
                    let q = false;
                    for (let l of oLRC.ms)
                    {
                        if (l.t == r)
                        {
                            q = true;
                            l.c += '\n' + content;
                        }
                    }
                    if (q)
                        continue;
                    oLRC.ms.push({
                        t: r,
                        c: content
                    });
                }
            }
        }
    }
    oLRC.ms[oLRC.ms.length] = {
        "t": (window.parseFloat(oLRC.ms[oLRC.ms.length - 1].t) + 3).toString(),
        "c": ""
    };
 
    console.log(oLRC.ms.length);
    __eul.innerHTML = "";
    for (let i of oLRC.ms)
    {
        that.eli = document.createElement("li");
        that.eli.style.fontSize = "100%";
        that.eli.style.opacity = 0.8;
        that.eli.innerText = i.c;
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
