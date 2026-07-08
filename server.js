const fs = require("fs");
const http = require("http");
const path = require("path");
const crypto = require("crypto");

const root = __dirname;
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8080);
let leadHandler;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function loadEnv() {
  const envPath = path.join(root, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const index = trimmed.indexOf("=");

    if (index === -1) {
      return;
    }

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  });
}

function getSessionSecret() {
  return process.env.LEAD_SESSION_SECRET || process.env.LEAD_API_SIGN_SECRET || process.env.LEAD_DELIVERY_SECRET;
}

function signSession(secret, timestamp, nonce) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}\n${nonce}`).digest("base64url");
}

function buildSessionCookie() {
  const secret = getSessionSecret();

  if (!secret) {
    return "";
  }

  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString("hex");
  const signature = signSession(secret, timestamp, nonce);
  const maxAgeSeconds = Math.floor(Number(process.env.LEAD_SESSION_TTL_MS || 2 * 60 * 60 * 1000) / 1000);

  return [
    `bh_session=${timestamp}.${nonce}.${signature}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ].join("; ");
}

function sendNotFound(res) {
  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end("Not found");
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/") {
    pathname = "/index.html";
  }

  const filePath = path.normalize(path.join(root, pathname));

  if (!filePath.startsWith(root)) {
    res.writeHead(403, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      sendNotFound(res);
      return;
    }

    fs.readFile(filePath, (readError, data) => {
      if (readError) {
        sendNotFound(res);
        return;
      }

      res.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store",
        ...(path.extname(filePath) === ".html" ? { "Set-Cookie": buildSessionCookie() } : {})
      });
      res.end(data);
    });
  });
}

loadEnv();
leadHandler = require("./api/lead.js");

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/lead")) {
    leadHandler(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(port, host, () => {
  console.log(`Local server running at http://${host}:${port}/`);
  console.log(`Lead API available at http://${host}:${port}/api/lead`);
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
