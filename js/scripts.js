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



if (window.navigator.userAgent.match(
    /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
)) {
    window.document.getElementsByName("viewport")[0].content = "width=device-width, initial-scale=0.6, maximum-scale=0.6, user-scalable=no";
    window.isMobile = true;
} else {
    window.document.getElementsByName("viewport")[0].content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    window.isMobile = false;
}

/* Version code */
window.console.log(version.innerText = '6.8.9');

this.cache = [];

/* Init play state */
this.playState = false;

/* init Onplay code */
this.playCode = 0;

/* Init weight of fade */
this.fadePause = null;

this.loop = null;

this.isFullscreen = false;

player.style.borderRadius = "15px 50px 30px 5px";

const get = () => {
    that.xhr.open("POST", "https://sdk250.cn/api/id", true);
    that.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    that.xhr.dataType = "text";
    that.xhr.responseType = "json";
    that.xhr.onload = (res) => {
        let data = res.currentTarget.response;
        that.cache[that.cache.length] = {
            id: data.id,
            data: data.data,
            name: data.name,
            picture: data.picture,
            art: data.art,
            lyric: data.lyric
        };
        playerInitial(that.cache[that.playCode]);
    };
    that.xhr.send(null);
};

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
};
window.onresize();

this.lrcShow = false;
play.addEventListener("click", Play);
pause.addEventListener("click", Pause);
next.addEventListener("click", Next);
// picture.addEventListener("click", Previous);
if (this.isMobile) {
    picture.addEventListener("touchstart", loop_begin);
    picture.addEventListener("touchend", loop_end);
    box.addEventListener('touchstart', fullscr_begin);
    box.addEventListener('touchend', fullscr_end);
} else {
    box.addEventListener('mousedown', fullscr_begin);
    box.addEventListener('mouseup', fullscr_end);
    picture.addEventListener("mousedown", loop_begin);
    picture.addEventListener("mouseup", loop_end);
}
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

window.navigator.mediaSession.setActionHandler('nexttrack', () => {
    Next();
    console.log('catch next!');
});
window.navigator.mediaSession.setActionHandler('previoustrack', () => {
    Previous();
    console.log('catch previous!');
});
window.navigator.mediaSession.setActionHandler('play', () => {
    Play();
    console.log('catch play!');
});
window.navigator.mediaSession.setActionHandler('pause', () => {
    Pause();
    console.log('catch pause!');
});

audio.onpause = function() {
    pauseAnimation();
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
audio.oncanplay = function () {
    Play();
    console.log("AUTO PLAY");
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
        that.xhr.send("key=" + event.target.value + "&platform=kuwo");
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
    if (that.playState == true && that.fadePause == null) {
        that.fadePause = setInterval(() => {
            if (audio.volume > 0.1) {
                audio.volume -= 0.02;
            } else {
                audio.pause();
                clearInterval(that.fadePause);
                audio.volume = 1;
                if (play.style.display == "none")
                    pauseAnimation();
                that.fadePause = null;
            }
        }, 3);
        pauseAnimation();
    } else
        return false;
}
function Next() {
    if (that.playCode < window.Object.keys(that.cache).length - 1) {
        audio.pause();
        pauseAnimation();
        that.playState = false;
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
    audio.pause();
    pauseAnimation();
    that.playState = false;
    playerInitial(that.cache[--that.playCode]);
}
function fullscr_begin() {
    let px = 1;
    that.loop = setInterval(() => {
        if (px < 30)
            __eul.style.filter = 'blur(' + (px += 1) + 'px)';
        else {
            __eul.style.filter = 'blur(0px)';
            that.isFullscreen ? window.document.exitFullscreen() : window.document.documentElement.requestFullscreen();
            that.isFullscreen = !that.isFullscreen;
            clearInterval(that.loop);
            that.loop = null;
        }
    }, 25);
}
function fullscr_end() {
    clearInterval(that.loop);
    that.loop = null;
    __eul.style.filter = 'blur(0px)';
}
function loop_begin() {
    let alph = audio.loop ? 0.99 : 0.01;
    that.startTime = +new Date();
    that.loop = setInterval(() => {
        if (alph < 1 && alph > 0)
            picture.style.outlineColor = "rgba(175, 175, 175, " + (audio.loop ? (alph -= 0.05) : (alph += 0.05)) + ")";
        else {
            clearInterval(that.loop);
            that.loop = null;
            console.log(1);
            audio.loop = !audio.loop;
        }
    }, 30);
}
function loop_end() {
    clearInterval(that.loop);
    that.loop = null;
    if (+new Date() - that.startTime < 300)
        Previous();

    if (audio.loop)
        picture.style.outlineColor = "rgba(175, 175, 175, 1)";
    else
        picture.style.outlineColor = "rgba(175, 175, 175, 0)";
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
        that.cache.pop();
        that.playCode--;
        Next();
        return false;
    }
    if (typeof(parameter.res) == "undefined")
        audio.src = parameter.data;
    else
        audio.src = parameter.res;
    that.playState = true;

    dark.selectId("title").innerText = parameter.name + " | Vistual-Music";
    window.navigator.mediaSession.metadata = new MediaMetadata({
        title: parameter.name + " | Vistual-Music",
        artist: parameter.art,
        artwork: [{src: parameter.picture, sizes: '500x500'}]
    })

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

    oLRC = parameter.lyric;
 
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
    (e.shiftKey && e.keyCode == 78) ?
        Next() : null;
    (e.shiftKey && e.keyCode == 82) ?
        Previous() : null;
    (e.keyCode == 84) ?
        background.onclick() : null;
    (e.shiftKey && e.keyCode == 90) ?
        searchText.blur() : null;
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
    if (picture.style.animationPlayState == "paused")
        return;
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
