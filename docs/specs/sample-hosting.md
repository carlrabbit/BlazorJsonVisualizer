# Sample Hosting Spec

## Purpose

Defines how sample applications are organized, assigned ports, launched concurrently, and linked from the static sample index.

## Scope

This spec covers developer-time sample hosting only. It does not define production hosting.

## Directory layout

Sample applications and the static sample index are coordinated from `samples/`.

Recommended layout:

```text
samples/
├─ SAMPLES.md
├─ index/
│  ├─ index.html
│  ├─ samples.js
│  └─ styles.css
├─ BlazorJsonVisualizer.BasicSample/
├─ BlazorJsonVisualizer.Layer1Sample/
├─ BlazorJsonVisualizer.SchemaOverlaySample/
└─ BlazorJsonVisualizer.ProjectionSample/
```

The exact sample names may differ if the repository already has sample projects. Existing sample names should be preserved unless there is a good reason to rename them.

## Port allocation

Every sample app must have a fixed, documented HTTP port.

Recommended allocation:

| Port | Purpose |
| ---: | --- |
| 5100 | Static samples index |
| 5110 | Basic Blazor host/sample |
| 5120 | Layer 1 JSON viewer sample |
| 5130 | Layer 2 schema overlay sample |
| 5140 | Layer 3 projection sample |

Rules:

- Do not use random development ports for sample apps.
- Do not assign the same port to multiple samples.
- Prefer HTTP-only sample ports for development simplicity unless HTTPS is already required by the repo.
- If a listed sample does not exist yet, reserve the port and mark the sample as planned in the index.

## Static sample index

The static sample index is served from the fixed index port.

The index page must:

- list each sample by name
- show each sample's fixed port
- link to each sample
- clearly mark samples that are planned but not implemented
- compute links from the current browser URL rather than hardcoding `localhost`

## Link computation

The index page must work in local development and GitHub workspace forwarded-port URLs.

Recommended JavaScript behavior:

```js
function sampleUrl(port) {
  const current = new URL(window.location.href);

  // Localhost/dev-container direct access.
  if (current.hostname === "localhost" || current.hostname === "127.0.0.1") {
    current.port = String(port);
    current.pathname = "/";
    current.search = "";
    current.hash = "";
    return current.toString();
  }

  // GitHub Codespaces/GitHub workspace forwarded-port hostnames often encode the port
  // in the hostname. The exact pattern can differ. Keep this logic isolated and documented.
  const host = current.hostname;

  const replaced = host.replace(/(^|-)\d{4,5}(?=-)/, `$1${port}`);
  if (replaced !== host) {
    current.hostname = replaced;
    current.pathname = "/";
    current.search = "";
    current.hash = "";
    return current.toString();
  }

  // Fallback: keep hostname and replace port when available.
  current.port = String(port);
  current.pathname = "/";
  current.search = "";
  current.hash = "";
  return current.toString();
}
```

The implementation may adjust this logic if GitHub workspace URL patterns require a different transformation. Keep the transformation small, explicit, and documented.

## Launching all samples

The repository must provide a single command or script that launches all implemented sample apps concurrently.

Recommended script name:

```text
scripts/dev/start-samples.sh
```

The script should:

- restore/build required projects where appropriate
- start the static index on port 5100
- start each implemented sample on its fixed port
- print the sample index URL and sample port table
- fail clearly when a port is already in use
- not start long-running tests

## Dev-container integration

The repository may keep the default dev container lightweight. This milestone adds a second dev-container entry that starts all samples automatically.

Recommended file:

```text
.devcontainer/samples/devcontainer.json
```

This dev-container variant should:

- install/build required dependencies
- forward all sample ports
- run the sample launcher after container creation or startup
- clearly document that it is the sample-launching container variant

## Non-goals

- Production hosting.
- Published documentation site.
- GitHub Pages deployment.
- Full sample implementation for milestones that are not implemented yet.
- Running test suites automatically when launching samples.
