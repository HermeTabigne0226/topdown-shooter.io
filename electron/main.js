const { app, BrowserWindow } = require("electron");
const http = require("http");
const path = require("path");
const fs = require("fs");

let mainWindow = null;
let server = null;

// MIME types lookup
const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

// Locate the Next.js exported 'out' directory
function getOutDir() {
  const possiblePaths = [
    path.join(__dirname, "..", "out"),
    path.join(process.resourcesPath, "out"),
    path.join(process.resourcesPath, "app", "out"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return path.join(__dirname, "..", "out");
}

function startLocalServer(callback) {
  const outDir = getOutDir();

  server = http.createServer((req, res) => {
    // Parse URL
    let safeUrl = req.url.split("?")[0];
    if (safeUrl === "/") {
      safeUrl = "/index.html";
    }

    let filePath = path.join(outDir, safeUrl);

    // If file doesn't exist, try appending .html or falling back to index.html
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      if (fs.existsSync(filePath + ".html")) {
        filePath = filePath + ".html";
      } else {
        filePath = path.join(outDir, "index.html");
      }
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      });
      res.end(data);
    });
  });

  // Listen on random available port on localhost
  server.listen(0, "127.0.0.1", () => {
    const port = server.address().port;
    callback(port);
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 600,
    title: "CYBERSTORM // Neon Survivor",
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startLocalServer((port) => {
    createWindow(port);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      startLocalServer((port) => {
        createWindow(port);
      });
    }
  });
});

app.on("window-all-closed", () => {
  if (server) {
    server.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
