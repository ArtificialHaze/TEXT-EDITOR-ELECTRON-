const { app, BrowserWindow, dialog, Notification } = require("electron");
const { ipcMain, Menu } = require("electron/main");
const path = require("path");
const fs = require("fs");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const isDevEnv = process.env.NODE_ENV === "development";

if (isDevEnv) {
  try {
    require("electron-reloader")(module);
  } catch (err) {
    console.log(err);
  }
}

let mainWindow;
let openedFilePath;

const handleError = () => {
  new Notification({
    title: "Error",
    body: "Something went wrong",
  }).show();
};

const openFile = (filePath) => {
  fs.readFile(filePath, "utf-8", (error, content) => {
    if (error) {
      handleError();
    } else {
      app.addRecentDocument(filePath);
      openedFilePath = filePath;
      mainWindow.webContents.send("document-opened", { filePath, content });
    }
  });
};

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    // autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  if (isDevEnv) {
    mainWindow.webContents.openDevTools();
  }

  const menuTemplate = [
    {
      label: "File",
      submenu: [
        {
          label: "Add New File",
          click: () => ipcMain.emit("open-document"),
        },
        {
          label: "Create New File",
          click: () => ipcMain.emit("create-document"),
        },
        {
          type: "separator",
        },
        {
          label: "Open Recent",
          role: "recentdocuments",
          submenu: [
            {
              label: "Clear Recent",
              role: "clearrecentdocuments",
            },
          ],
        },
        {
          role: "quit",
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
        { type: "separator" },
        { role: "selectAll" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
};

ipcMain.on("create-document", () => {
  dialog
    .showSaveDialog(mainWindow, {
      filters: [{ name: "text files", extensions: ["txt"] }],
    })
    .then(({ filePath }) => {
      fs.writeFile(filePath, "", (error) => {
        if (error) {
          handleError();
        } else {
          app.addRecentDocument(filePath);
          openedFilePath = filePath;
          mainWindow.webContents.send("document-created", filePath);
        }
      });
    });
});

ipcMain.on("open-document", () => {
  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "text files", extensions: "txt" }],
    })
    .then(({ filePaths }) => {
      const filePath = filePaths[0];
      openFile(filePath);
    });
});

ipcMain.on("file-content-changed", (_, fileTextArea) => {
  fs.writeFile(openedFilePath, fileTextArea, (error) => {
    if (error) {
      handleError();
    }
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

app.on("open-file", (_, filePath) => {
  openFile(filePath);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
