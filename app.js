const http = require('http');
const { runSimulation } = require('./simulation.js');

const PORT = parseInt(process.env.PORT || '7860', 10);

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderPage(content, hasError = false) {
  const title = hasError ? 'Runtime Error' : 'Study Productivity OpenEnv';
  const subtitle = hasError
    ? 'The simulation failed to run inside the Space container.'
    : 'Baseline simulation output from the Docker Space';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #eef6f1;
        --panel: #0f172a;
        --text: #e2e8f0;
        --muted: #94a3b8;
        --accent: #0f766e;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(15, 118, 110, 0.14), transparent 30%),
          linear-gradient(180deg, #f8fffc, var(--bg));
        color: #0f172a;
      }

      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 40px 20px 60px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      p {
        margin: 0 0 24px;
        color: #334155;
      }

      .panel {
        background: var(--panel);
        color: var(--text);
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
        overflow-x: auto;
      }

      .meta {
        display: inline-block;
        margin-bottom: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.14);
        color: var(--accent);
        font-size: 0.9rem;
        font-weight: 600;
      }

      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font: 14px/1.5 Consolas, "Courier New", monospace;
      }

      .error {
        color: #fecaca;
      }
    </style>
  </head>
  <body>
    <main>
      <span class="meta">Hugging Face Docker Space</span>
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <section class="panel">
        <pre class="${hasError ? 'error' : ''}">${escapeHtml(content)}</pre>
      </section>
    </main>
  </body>
</html>`;
}

const server = http.createServer(async (_req, res) => {
  try {
    const output = await runSimulation();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPage(output.text));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPage(error.message, true));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
