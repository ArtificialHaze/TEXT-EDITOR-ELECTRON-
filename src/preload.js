// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { ipcRenderer } = require("electron/renderer");
const path = require("path");

window.addEventListener("DOMContentLoaded", () => {
  const openDocument = document.getElementById("openDocument");
  const createDocument = document.getElementById("createDocument");
  const documentName = document.getElementById("document-name");
  const fileTextArea = document.getElementById("fileTextArea");

  createDocument.addEventListener("click", () => {
    ipcRenderer.send("create-document");
  });

  ipcRenderer.on("document-created", (_, filePath) => {
    documentName.innerHTML = path.parse(filePath).base;
    fileTextArea.removeAttribute("disabled");
    fileTextArea.value = "";
    fileTextArea.focus();
  });

  ipcRenderer.on("document-opened", (_, { filePath, content }) => {
    documentName.innerHTML = path.parse(filePath).base;
    fileTextArea.removeAttribute("disabled");
    fileTextArea.value = content;
    fileTextArea.focus();
  });

  openDocument.addEventListener("click", () => {
    ipcRenderer.send("open-document");
  });

  fileTextArea.addEventListener("input", (e) => {
    ipcRenderer.send("file-content-changed", e.target.value);
  });

  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});
