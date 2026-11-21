# Production proxy (keeps your API key off the browser)

`createProxyProvider({ url })` POSTs `{ system, messages }` and expects `{ text }`.

Minimal Node 18+ example using the Anthropic API:

```js
// server.mjs: run with ANTHROPIC_API_KEY set
import http from "node:http";

const MAX_BODY = 64 * 1024;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "https://your-app.example";

http
  .createServer(async (req, res) => {
    res.setHeader("access-control-allow-origin", ALLOWED_ORIGIN);
    res.setHeader("access-control-allow-headers", "content-type");
    if (req.method === "OPTIONS") return res.writeHead(204).end();
    if (req.method !== "POST" || req.url !== "/api/assistant") return res.writeHead(404).end();

    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > MAX_BODY) return res.writeHead(413).end();
    }

    try {
      const { system, messages } = JSON.parse(body);
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 1024, system, messages }),
      });
      const data = await upstream.json();
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ text: data.content?.[0]?.text ?? "" }));
    } catch {
      res.writeHead(400).end();
    }
  })
  .listen(8787);
```

## Hardening checklist

- Authenticate the caller (session cookie or token) before forwarding.
- Rate-limit per user/IP and cap `max_tokens`.
- Restrict CORS to your origin.
- Don't log prompts if they may contain sensitive page labels.
