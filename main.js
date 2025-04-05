const { app, BrowserWindow, ipcMain } = require("electron")
const robot = require("robotjs")

function createWindow() {
  const win = new BrowserWindow({
    width: 350,
    height: 175,
    frame: false,
    focusable: false,
    transparent: false,
    alwaysOnTop: true,
    closable: true,
    fullscreenable: false,
    maximizable: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile("index.html")
}

app.whenReady().then(createWindow)

ipcMain.on("trigger-click", () => {
  const mousePos = robot.getMousePos()
  robot.mouseClick()
  console.log(`Clicked at: (${mousePos.x}, ${mousePos.y})`)
})

ipcMain.on("quit", () => app.quit())

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
