import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 8080;
const API_HOST = "127.0.0.1";
const API_PORT = 3000;

// Proxy /api/* requests to the backend server
app.use("/api", (req, res) => {
  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: "/api" + req.url,
    method: req.method,
    headers: { ...req.headers, host: `${API_HOST}:${API_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.status(502).json({ error: "Backend unavailable" });
  });

  proxyReq.setTimeout(15000, () => {
    proxyReq.destroy(new Error("timeout"));
  });

  req.pipe(proxyReq, { end: true });
});

// Serve static files from web/
app.use(express.static(path.join(__dirname, "web"), {
  maxAge: 0,
  etag: false,
}));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Web server running on http://0.0.0.0:${PORT}`);
});
