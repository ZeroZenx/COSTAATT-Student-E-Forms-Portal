import fs from "fs";
import http from "http";
import https from "https";
import net from "net";

const listenHost = process.env.HTTPS_PROXY_HOST || "0.0.0.0";
const listenPort = Number(process.env.HTTPS_PROXY_PORT || 443);
const redirectPort = Number(process.env.HTTPS_PROXY_HTTP_PORT || 80);
const targetHost = process.env.HTTPS_PROXY_TARGET_HOST || "127.0.0.1";
const targetPort = Number(process.env.HTTPS_PROXY_TARGET_PORT || 5001);
const certPath = process.env.SSL_CERT_PATH || "C:\\Student E-Forms\\SSL Private Key\\eforms.costaatt.edu.tt\\831f8f7a1833747d.pem";
const keyPath = process.env.SSL_KEY_PATH || "C:\\Student E-Forms\\SSL Private Key\\eforms.costaatt.edu.tt.key";
const caPath = process.env.SSL_CA_PATH || "C:\\Student E-Forms\\SSL Private Key\\eforms.costaatt.edu.tt\\gd_bundle_dv-r1-g2.crt.pem";

for (const filePath of [certPath, keyPath, caPath]) {
  if (!fs.existsSync(filePath)) throw new Error(`HTTPS proxy file is missing: ${filePath}`);
}

const certificateChain = `${fs.readFileSync(certPath, "utf8")}\n${fs.readFileSync(caPath, "utf8")}`;

const tlsOptions = {
  cert: certificateChain,
  key: fs.readFileSync(keyPath)
};

function publicHost(request) {
  return (request.headers.host || "eforms.costaatt.edu.tt").replace(/:\d+$/, "");
}

function securityHeaders(headers) {
  return {
    ...headers,
    "strict-transport-security": "max-age=31536000",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()"
  };
}

const server = https.createServer(tlsOptions, (clientReq, clientRes) => {
  const headers = {
    ...clientReq.headers,
    host: publicHost(clientReq),
    "x-forwarded-proto": "https",
    "x-forwarded-host": publicHost(clientReq),
    "x-forwarded-for": clientReq.socket.remoteAddress || ""
  };

  const proxyReq = http.request({
    host: targetHost,
    port: targetPort,
    method: clientReq.method,
    path: clientReq.url,
    headers
  }, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode || 502, securityHeaders(proxyRes.headers));
    proxyRes.pipe(clientRes);
  });

  proxyReq.on("error", (error) => {
    clientRes.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    clientRes.end(`COSTAATT HTTPS proxy could not reach the app: ${error.message}`);
  });

  clientReq.pipe(proxyReq);
});

server.on("upgrade", (req, socket, head) => {
  const upstream = net.connect(targetPort, targetHost, () => {
    upstream.write([
      `${req.method} ${req.url} HTTP/${req.httpVersion}`,
      `Host: ${req.headers.host || ""}`,
      "Connection: Upgrade",
      `Upgrade: ${req.headers.upgrade || ""}`,
      "",
      ""
    ].join("\r\n"));
    if (head.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });

  upstream.on("error", () => socket.destroy());
});

const redirectServer = http.createServer((request, response) => {
  const host = publicHost(request);
  const location = `https://${host}${request.url || "/"}`;
  response.writeHead(308, { location, "cache-control": "no-store" });
  response.end();
});

server.listen(listenPort, listenHost, () => {
  console.log(`COSTAATT HTTPS proxy listening on https://${listenHost}:${listenPort}`);
  console.log(`Forwarding to http://${targetHost}:${targetPort}`);
});

redirectServer.listen(redirectPort, listenHost, () => {
  console.log(`COSTAATT HTTP redirect listening on http://${listenHost}:${redirectPort}`);
});
