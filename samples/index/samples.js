const samples = [
  {
    name: "Static samples index",
    port: 5100,
    status: "Implemented",
    implemented: true,
  },
  {
    name: "Basic Blazor host/sample",
    port: 5110,
    status: "Implemented",
    implemented: true,
  },
  {
    name: "Layer 1 JSON viewer sample",
    port: 5120,
    status: "Planned",
    implemented: false,
  },
  {
    name: "Layer 2 schema overlay sample",
    port: 5130,
    status: "Planned",
    implemented: false,
  },
  {
    name: "Layer 3 projection sample",
    port: 5140,
    status: "Planned",
    implemented: false,
  },
];

function sampleUrl(port) {
  const current = new URL(window.location.href);

  if (current.hostname === "localhost" || current.hostname === "127.0.0.1") {
    current.port = String(port);
    current.pathname = "/";
    current.search = "";
    current.hash = "";
    return current.toString();
  }

  const host = current.hostname;
  // Supports forwarded hostnames such as "<name>-5100-<suffix>" where the port
  // segment is encoded between hyphens (for example GitHub workspace/Codespaces URLs).
  const replaced = host.replace(/(^|-)\d{4,5}(?=-)/, `$1${port}`);

  if (replaced !== host) {
    current.hostname = replaced;
    current.pathname = "/";
    current.search = "";
    current.hash = "";
    return current.toString();
  }

  current.port = String(port);
  current.pathname = "/";
  current.search = "";
  current.hash = "";
  return current.toString();
}

function renderSamples() {
  const tbody = document.getElementById("samples-table");
  if (!tbody) {
    return;
  }

  for (const sample of samples) {
    const row = document.createElement("tr");
    if (!sample.implemented) {
      row.classList.add("planned");
    }

    const nameCell = document.createElement("td");
    nameCell.textContent = sample.name;

    const portCell = document.createElement("td");
    portCell.textContent = String(sample.port);

    const statusCell = document.createElement("td");
    statusCell.textContent = sample.status;

    const linkCell = document.createElement("td");
    const link = document.createElement("a");
    link.textContent = sample.implemented ? "Open" : "Planned";
    link.href = sampleUrl(sample.port);

    if (!sample.implemented) {
      link.classList.add("disabled-link");
      link.setAttribute("aria-disabled", "true");
      link.tabIndex = -1;
    }

    linkCell.appendChild(link);

    row.append(nameCell, portCell, statusCell, linkCell);
    tbody.appendChild(row);
  }
}

renderSamples();
