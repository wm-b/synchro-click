const { ipcRenderer } = require("electron")

const scheduleNames = [
  "Alpha",
  "Gamma",
  "Delta",
  "Epsilon",
  "Theta",
  "Iota",
  "Omicron",
  "Sigma",
  "Tau",
  "Omega"
]

let currentTime = null
let currentSchedule = null
let retryCount = 0
const maxRetries = 5

const getTime = async () => {
  const { dateTime } = await fetch(
    "https://timeapi.io/api/time/current/zone?timeZone=Europe/Amsterdam"
  )
    .then((res) => res.json())
    .catch((err) => {
      console.error("Error fetching time:", err)
      document.getElementById(
        "schedule-list"
      ).innerText = `Error fetching time. Retrying... (${retryCount}/${maxRetries})`
      if (retryCount < maxRetries) throw new Error("Failed to fetch time")
    })

  return new Date(dateTime).getTime()
}

const getNextSchedule = (time) => {
  const scheduleTime = Math.ceil(time / 10000) * 10000
  const scheduleIndex = (scheduleTime / 10000) % scheduleNames.length
  return { name: scheduleNames[scheduleIndex], time: scheduleTime }
}

const getSchedules = () => {
  const schedules = new Array(3).fill(0).reduce((acc, _, i) => {
    const { name, time } = getNextSchedule(currentTime + i * 10000)

    return {
      ...acc,
      [name]: time
    }
  }, {})

  return schedules
}

const handleScheduleClick = (name, time) => {
  if (!!currentSchedule) {
    clearTimeout(currentSchedule.timeout)
    document
      .getElementById(`btn-${currentSchedule.name}`)
      ?.classList.remove("selected")

    if ((name = currentSchedule.name)) {
      currentSchedule = null
      return
    }

    currentSchedule = null
  }

  if (!currentTime)
    throw new Error("Time server must be queried before a schedule is clicked")

  const timeDiff = time - currentTime
  if (timeDiff <= 0) throw new Error("Schedule time must be in the future")

  document.getElementById(`btn-${name}`).classList.add("selected")

  currentSchedule = {
    name,
    timeout: setTimeout(() => {
      ipcRenderer.send("trigger-click")
      ipcRenderer.send("quit")
    }, timeDiff)
  }
}

const updateSchedules = async () => {
  const schedules = getSchedules()
  const scheduleList = document.getElementById("schedule-list")
  if (!scheduleList) throw new Error("Schedule list not found")
  scheduleList.innerHTML = ""
  for (const [name, time] of Object.entries(schedules)) {
    const btn = document.createElement("button")
    btn.id = `btn-${name}`
    const secondsUntil = Math.max(0, Math.floor((time - currentTime) / 1000))
    btn.innerText = `${name} (${secondsUntil}s)`
    if (currentSchedule?.name === name) btn.classList.add("selected")
    btn.addEventListener("click", () => handleScheduleClick(name, time))
    scheduleList.appendChild(btn)
  }
}

const initialise = async () => {
  currentTime = await getTime()
  const timeToNextSecond = 1000 - (currentTime % 1000)

  setTimeout(() => {
    currentTime += timeToNextSecond
    setInterval(() => {
      currentTime += 10
      if (currentTime % 1000 === 0) updateSchedules()
    }, 10)
  }, timeToNextSecond)
}

initialise()

document.getElementById("close-btn").addEventListener("click", () => {
  ipcRenderer.send("quit")
})
