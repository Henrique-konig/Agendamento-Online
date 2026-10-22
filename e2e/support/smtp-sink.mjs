// Servidor SMTP mínimo para os testes: aceita qualquer envio e guarda as mensagens.
// Consulta: GET http://127.0.0.1:2526/mails  ·  limpar: DELETE /mails  ·  saúde: GET /health
import http from "node:http";
import net from "node:net";

const mails = [];

/** Quoted-printable (RFC 2045) -> texto UTF-8, juntando os bytes antes de decodificar. */
function qpToUtf8(text) {
  const bytes = [];
  const clean = text.replace(/=\r?\n/g, "");
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === "=" && /^[0-9A-F]{2}$/i.test(clean.slice(i + 1, i + 3))) {
      bytes.push(parseInt(clean.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(...Buffer.from(clean[i], "utf8"));
    }
  }
  return Buffer.from(bytes).toString("utf8");
}

function decodeHeader(value) {
  // Assunto com acentos vem em "=?UTF-8?B?...?=" (base64) ou "=?UTF-8?Q?...?=" (quoted-printable).
  return value.replace(/=\?UTF-8\?([BQ])\?([^?]*)\?=/gi, (_, enc, text) =>
    enc.toUpperCase() === "B"
      ? Buffer.from(text, "base64").toString("utf8")
      : qpToUtf8(text.replace(/_/g, " ")),
  );
}

function parse(raw, envelope) {
  const [head, ...rest] = raw.split(/\r?\n\r?\n/);
  const header = (name) =>
    decodeHeader(
      (head.match(new RegExp(`^${name}:\\s*(.*(?:\\r?\\n[ \\t].*)*)`, "im"))?.[1] ?? "").replace(
        /\r?\n[ \t]+/g,
        " ",
      ),
    ).trim();
  const body = rest.join("\n\n");
  const text = /quoted-printable/i.test(raw) ? qpToUtf8(body) : body;
  return { to: envelope.to, from: envelope.from, subject: header("subject"), body: text };
}

net
  .createServer((socket) => {
    let envelope = { from: "", to: [] };
    let data = null;
    let buffer = "";
    let authStep = 0; // AUTH LOGIN: 1 = esperando usuário, 2 = esperando senha
    const send = (line) => socket.write(line + "\r\n");
    send("220 smtp-teste ESMTP");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      for (;;) {
        if (data !== null) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end === -1) return;
          data = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          mails.push(parse(data, envelope));
          data = null;
          envelope = { from: "", to: [] };
          send("250 ok");
          continue;
        }
        const eol = buffer.indexOf("\r\n");
        if (eol === -1) return;
        const line = buffer.slice(0, eol);
        buffer = buffer.slice(eol + 2);
        const cmd = line.slice(0, 4).toUpperCase();
        if (authStep) {
          if (authStep === 1) {
            send("334 UGFzc3dvcmQ6");
            authStep = 2;
          } else {
            send("235 ok");
            authStep = 0;
          }
        } else if (cmd === "EHLO" || cmd === "HELO") {
          socket.write("250-smtp-teste\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n");
        } else if (cmd === "AUTH") {
          if (/^AUTH LOGIN$/i.test(line)) {
            authStep = 1;
            send("334 VXNlcm5hbWU6");
          } else send("235 ok");
        } else if (cmd === "MAIL") {
          envelope.from = line.match(/<([^>]*)>/)?.[1] ?? "";
          send("250 ok");
        } else if (cmd === "RCPT") {
          envelope.to.push(line.match(/<([^>]*)>/)?.[1] ?? "");
          send("250 ok");
        } else if (cmd === "DATA") {
          data = "";
          send("354 fim com <CRLF>.<CRLF>");
        } else if (cmd === "QUIT") {
          send("221 tchau");
          socket.end();
        } else {
          send("250 ok");
        }
      }
    });
    socket.on("error", () => {});
  })
  .listen(2525, "127.0.0.1");

http
  .createServer((req, res) => {
    if (req.url === "/health") return res.end("ok");
    if (req.url === "/mails" && req.method === "DELETE") {
      mails.length = 0;
      return res.end("[]");
    }
    if (req.url === "/mails") {
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(mails));
    }
    res.statusCode = 404;
    res.end();
  })
  .listen(2526, "127.0.0.1");
