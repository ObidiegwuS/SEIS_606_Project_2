// Minimal SMTP server for end-to-end tests. Accepts every message and writes it
// to $E2E_DIR/mail/<timestamp>.json so tests can read the links inside.
// Test-only: never used by the app itself.
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

const port = Number(process.env.SMTP_SINK_PORT || 2525);
const mailDir = path.join(process.env.E2E_DIR, "mail");
fs.mkdirSync(mailDir, { recursive: true });

// Undo quoted-printable encoding (soft line breaks and =XX escapes).
const decodeQP = (s) =>
  s.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

net
  .createServer((socket) => {
    let buffer = "";
    let inData = false;
    let rcpt = [];
    const reply = (line) => socket.write(line + "\r\n");
    reply("220 e2e-sink ready");

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      while (true) {
        if (inData) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end === -1) return;
          const raw = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          inData = false;
          const decoded = decodeQP(raw);
          const subject = /^Subject: (.*)$/im.exec(raw)?.[1] ?? "";
          const file = path.join(mailDir, `${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
          fs.writeFileSync(file, JSON.stringify({ to: rcpt, subject, body: decoded }));
          rcpt = [];
          reply("250 OK queued");
          continue;
        }
        const nl = buffer.indexOf("\r\n");
        if (nl === -1) return;
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === "EHLO" || cmd === "HELO") reply("250 e2e-sink");
        else if (cmd === "MAIL") reply("250 OK");
        else if (cmd === "RCPT") {
          rcpt.push(/<([^>]+)>/.exec(line)?.[1] ?? "");
          reply("250 OK");
        } else if (cmd === "DATA") {
          inData = true;
          reply("354 End data with <CR><LF>.<CR><LF>");
        } else if (cmd === "QUIT") {
          reply("221 Bye");
          socket.end();
        } else if (cmd === "RSET") {
          rcpt = [];
          reply("250 OK");
        } else reply("250 OK");
      }
    });
    socket.on("error", () => {});
  })
  .listen(port, "127.0.0.1", () => console.log(`SMTP sink on ${port}, writing to ${mailDir}`));
