$(function(){

var paused = false
var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
var globalBells = {}

var IS_CANARY_DEVELOPMENT_VERSION = false

var nextBell = ""
var nextBellName = ""
var nextBellSound = 1
var openedPopup = false

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

var startTime = new Date().valueOf();

function pad(n) {
  return (n < 10 ? '0' : '') + n;
}

var apiSeconds = -1
var apiTime = {}

function getTimeFromUTC() {
  if (apiSeconds < 0 || apiSeconds > 30) {
    fetch("https://worldtimeapi.org/api/timezone/America/New_York/")
    .then(response => {
      return response.text();
    })
    .then(srvtime => {
      var srvtime = JSON.parse(srvtime);
      var now = {}
      
      if (srvtime) {
        var dateTime = new Date(srvtime.datetime)
        now = {
          seconds: dateTime.getSeconds(),
          minutes: dateTime.getMinutes(),
          hours: dateTime.getHours(),
          days: srvtime.day_of_week
        }
      } else {
        // api request failed? 
        var dateTime = new Date()
        now = {
          seconds: dateTime.getSeconds(),
          minutes: dateTime.getMinutes(),
          hours: dateTime.getHours(),
          days: srvtime.day_of_week
        }
      }
      
      apiSeconds = 0
      
      //console.log(now)
  
      apiTime = {
        seconds: now.seconds-1,
        minutes: now.minutes,
        hours: now.hours,
        days: now.days
      }
      
      apiSeconds = apiSeconds + 1
      apiTime.seconds = apiTime.seconds + 1
      if (apiTime.seconds > 59) {
        apiTime.seconds = 0
        apiTime.minutes = apiTime.minutes + 1
        if (apiTime.minutes >= 60) {
          apiTime.minutes = 0
          apiTime.hours = apiTime.hours + 1
        }
      }
      
      //console.log(apiTime)
      return apiTime
    })
    .catch(() => {
      // internet down or something idk
      
      var dateTime = new Date()
      apiTime = {
        seconds: dateTime.getSeconds(),
        minutes: dateTime.getMinutes(),
        hours: dateTime.getHours(),
        days: dateTime.getDay()
      }
      
      apiSeconds = 0
      apiTime.seconds = apiTime.seconds + 1
      if (apiTime.seconds > 59) {
        apiTime.seconds = 0
        apiTime.minutes = apiTime.minutes + 1
        if (apiTime.minutes >= 60) {
          apiTime.minutes = 0
          apiTime.hours = apiTime.hours + 1
        }
      }
      
      console.log(apiTime)
      return apiTime
      
    })
  } else {
    apiSeconds = apiSeconds + 1
    apiTime.seconds = apiTime.seconds + 1
    if (apiTime.seconds > 59) {
      apiTime.seconds = 0
      apiTime.minutes = apiTime.minutes + 1
      if (apiTime.minutes >= 60) {
        apiTime.minutes = 0
        apiTime.hours = apiTime.hours + 1
      }
    }
    return apiTime
  }
}

function statusText(text, length) {
  document.getElementById("status-text").innerHTML = text
  document.getElementById("status-text").removeAttribute("hidden")
  setTimeout(function(){
    document.getElementById("status-text").setAttribute("hidden", true)
  },length*1000)
}

function compareTwoTimes(one, two) {
  var splitOne = one.split(":")
  var splitTwo = two.split(":")
  
  splitOne[0] = parseInt(splitOne[0])
  splitOne[1] = parseInt(splitOne[1])
  splitTwo[0] = parseInt(splitTwo[0])
  splitTwo[1] = parseInt(splitTwo[1])

  if (splitOne[0] > splitTwo[0]) {
    return true
  } else {
    if (splitOne[0] == splitTwo[0] && splitOne[1] > splitTwo[1]) {
      return true
    } else {
      return false
    }
  }
  return false
}

function ringBell(Sound) {
  //statusText("One moment...", .5)
  //var audio = new Audio(Sound == 1 &&
  //  'https://cdn.glitch.me/f59805d0-52aa-454a-9fb4-27210ab0f88b%2Fbell%201.mp3?v=1636923474448' ||
  //  'https://cdn.glitch.me/f59805d0-52aa-454a-9fb4-27210ab0f88b%2Fbell%202.mp3?v=1636923480533'
  //);
  //audio.playbackRate = 1.2;
  //audio.play();
  //setTimeout(function(){
   // statusText("Ringing...", 5)
  //}, 500)

  //new Notification("Bell", {
  //  body: nextBellName,
  //  icon: "https://cdn.glitch.me/f59805d0-52aa-454a-9fb4-27210ab0f88b%2Fbell.png?v=1636923474448"
  //});

}

function checkIfShouldRing(now, day) {
  var today = days[day] //monday, tuesday, etc
  
  if (now.charAt(0) == "0") {
    now = now.substring(1);
  }
  
  if (now == "23:59" && (new Date().valueOf() - startTime) / 1000 > 300) {
    location.reload();
  }
  
  if (now == nextBell && !paused) {
    //console.log("ring")
    ringBell(nextBellSound)
    nextBell = ""
    parseBells()
  }
}

var isPopupButtonRed = true

async function updateTime() {

  if (paused && !openedPopup) {
  isPopupButtonRed = !isPopupButtonRed
  if (isPopupButtonRed) {
    document.getElementById("mute-button").setAttribute("class", "button is-danger")
  } else {
    document.getElementById("mute-button").setAttribute("class", "button is-dark")
  }
  }
    
  var now = await getTimeFromUTC()
  if (!now) {return}
  document.getElementById("time").innerHTML = pad(now.hours) + ":" + pad(now.minutes) + ":" + pad(now.seconds)
  checkIfShouldRing(pad(now.hours) + ":" + pad(now.minutes), now.days)
}

async function parseBells() {
  var now = await getTimeFromUTC()
  console.log("now:")
  console.log(now)
  if (!now) {
    if (!paused) {
      document.getElementById("next-bell-name").innerHTML = "Failed to fetch next bell, retrying in 30s..."
    }
    return
  }
  
  var day = days[now.days]
  var timeRn = pad(now.hours) + ":" + pad(now.minutes)
  var foundNext = false
  //console.log(day)
  globalBells[day].forEach(function(value) {
    if (compareTwoTimes(value[0], timeRn) && !foundNext) {
      // this is the next thing
      //console.log("a")
      foundNext = true
      if (!paused) {
        document.getElementById("next-bell-name").innerHTML = value[2]
        document.getElementById("next-bell-time").innerHTML = "Next bell: " + value[0]
      }
      nextBell = value[0]
      nextBellName = value[2]
      nextBellSound = value[1]
    }
  })
  if (!foundNext) {
    // next day first object
    foundNext = true
    var tomorrow = days[now.days+1]
    console.log("tomorrow:")
    console.log(tomorrow)
    if (!paused) {
      document.getElementById("next-bell-name").innerHTML = globalBells[tomorrow][0][2]
      document.getElementById("next-bell-time").innerHTML = "Next bell: " + globalBells[tomorrow][0][0] + " tomorrow"
    }
    nextBell = globalBells[tomorrow][0][0]
    nextBellSound = globalBells[tomorrow][0][1]
    nextBellName = nextBellSound = globalBells[tomorrow][0][2]
  }
}

function initBells() {
  fetch("https://pisd.glitch.me/global/bellnames")
  .then(response => {
    return response.text();
  })
  .catch(error => {
    if (!paused) {
        document.getElementById("next-bell-name").innerHTML = "API error, retrying in 30s..."
    }
  })
  .then(bells => {
    globalBells = JSON.parse(bells);
    console.log(globalBells)
    parseBells()
  })
}

function toggleMute() {
  paused = !paused
  if (paused) {
    document.getElementById("mute-button").setAttribute("class", "button is-danger")
    document.getElementById("mute-button").innerHTML = "Unmute"
    document.getElementById("next-bell-name").innerHTML = "Bells Muted"
    document.getElementById("next-bell-time").innerHTML = "🔇"
  } else {
    document.getElementById("mute-button").setAttribute("class", "button is-warning")
    document.getElementById("mute-button").innerHTML = "Pause"
    document.getElementById("next-bell-name").innerHTML = nextBellName
    document.getElementById("next-bell-time").innerHTML = "Next bell: " + nextBell
  }
}

if (IS_CANARY_DEVELOPMENT_VERSION) {
  document.getElementById("main_bell_system_bg").setAttribute("class", "message is-warning")
  document.getElementById("main_bell_system_title").innerHTML = "<p style='text-align: center;'>PISD BELL SYSTEM CANARY (DEVELOPMENT VERSION)</p>"
}

window.addEventListener('focus', function() {
  console.log("forcing time api update ")
  apiSeconds = 60;
})

setTimeout(function(){ringBell(1)}, 10000)

getTimeFromUTC()
updateTime()
initBells()
//if (!paused && !params.popup && !params.pi) {toggleMute()}  
setInterval(updateTime, 1000)
setInterval(initBells, 60000)
  
});