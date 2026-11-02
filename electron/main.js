import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// true quando o app está empacotado (.exe instalado), false em "npm run dev"
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    // Sem barra de título: a janela é movida pela área de arraste do index.css
    frame: false,
    width: 96,
    height: 132,
    minWidth: 96,
    minHeight: 132,
    alwaysOnTop: true,
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
