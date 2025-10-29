//Dans ce fichier se trouvent l'ensemble des script utilisés dans appareil/cable/generate/index. html
//Certaines parties sont inspirés de codes open source ou de code utilisé dans un précedent projet d'optimisation carbone
// ------------------------------------------------------------

// Variables globales
let jsonData = {};
let isDataReady = false;
let cables = [];
let devices = [];
const COLS = window.COLUMNS;
const strip = s => String(s || "").replace(new RegExp(`^${window.PREFIXES.APPAREIL_PREFIX}`, 'i'), "").toUpperCase();

// -----------------------------------------------------------------------------
//  Fonctions pour la page generate.html
// -----------------------------------------------------------------------------
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  showMessage("", "info");
  setLoadingMessage("⏳ Chargement du fichier en cours...");

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const arrayBuffer = new Uint8Array(evt.target.result);
      parseExcelAndGenerateJSON(arrayBuffer);
    } catch (err) {
      console.error(err);
      showMessage(`Erreur lors de la lecture du fichier: ${err.message}`, "danger");
    } finally {
      setLoadingMessage("");
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseExcelAndGenerateJSON(arrayBuffer) {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes("cables"));

    if (!sheetName) {
      showMessage("Feuille 'Cables' non trouvée", "danger");
      return;
    }

    const sheet = workbook.Sheets[sheetName];
    const jsonRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    generateJSONFiles(jsonRaw);
  } catch (err) {
    console.error(err);
    showMessage(`Erreur lors de l'analyse du fichier Excel: ${err.message}`, "danger");
  }
}

function generateJSONFiles(jsonRaw) {
  const linksContainer = document.getElementById("downloadLinks");
  if (!linksContainer) return;

  linksContainer.innerHTML = "";
  jsonData = {};

  COLS.forEach(col => {
    jsonData[col] = jsonRaw.map(row => ({ CBL: row["CBL"] || "", [col]: row[col] || "" }));

    const blob = new Blob([JSON.stringify(jsonData[col], null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = createDownloadLink(url, `cables_${col}.json`, `Télécharger cables_${col}.json`);
    linksContainer.appendChild(link);
  });

  isDataReady = true;
  const downloadAllBtn = document.getElementById("downloadAllBtn");
  if (downloadAllBtn) downloadAllBtn.disabled = !isDataReady;

  showMessage(`✅ ${jsonRaw.length} lignes chargées.`, "success");
}

function createDownloadLink(url, downloadName, linkText) {
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadName;
  link.className = "btn btn-primary me-2 mb-2";
  link.textContent = linkText;
  return link;
}

function downloadAllAsZip() {
  if (!isDataReady) {
    showMessage("Veuillez d'abord générer les fichiers JSON.", "warning");
    return;
  }

  setLoadingMessage("⏳ Création du ZIP en cours...");

  const zip = new JSZip();
  const jsonFolder = zip.folder("json_files");

  COLS.forEach(col => {
    if (jsonData[col]) {
      jsonFolder.file(`cables_${col}.json`, JSON.stringify(jsonData[col], null, 2));
    }
  });

  zip.generateAsync({ type: "blob" }).then(content => {
    const zipUrl = URL.createObjectURL(content);
    const zipLink = document.createElement("a");
    zipLink.href = zipUrl;
    zipLink.download = "json_files.zip";
    document.body.appendChild(zipLink);
    zipLink.click();
    document.body.removeChild(zipLink);
    setLoadingMessage("");
  });
}

// -----------------------------------------------------------------------------
//  Fonctions pour la page appareil.html
// -----------------------------------------------------------------------------
async function loadJSON() {
  const merged = {};

  for (const col of COLS) {
    try {
      const res = await fetch(`json/cables_${col}.json`);
      const rows = await res.json();

      rows.forEach(r => {
        const id = strip(r.CBL);
        if (!merged[id]) merged[id] = { CBL: id };

        // 🔧 Conversion systématique en chaîne pour éviter les nombres
        merged[id][col] = strip(r[col]);
      });
    } catch (e) {
      console.warn("Chargement JSON", col, e);
    }
  }

  cables = Object.values(merged);

  const set = new Set();
  cables.forEach(c => {
    if (c.APA) set.add(c.APA);
    if (c.APO) set.add(c.APO);
  });
  devices = [...set];
}

function search() {
  const q = strip(document.getElementById("apInput").value.trim());
  if (!q) return hideSug();

  hideSug();
  const rows = cables.filter(c => c.APA === q || c.APO === q);
  render(rows, q);
}

function render(rows, dev) {
  const box = document.getElementById("result");
  if (!rows.length) {
    box.innerHTML = `<div class="alert alert-warning">Aucun câble lié à « ${dev} ».</div>`;
    return;
  }

  const firstCable = rows[0];
  const appareil = firstCable.APA === dev ? strip(firstCable.APA) : strip(firstCable.APO);
  const lot = firstCable.APA === dev ? firstCable.LOT_MTG_APA : firstCable.LOT_MTG_APO || "-";
  const local = firstCable.APA === dev ? firstCable.LOCAL_APA : firstCable.LOCAL_APO || "-";

  let html = `<h4>${rows.length} câble(s) pour « ${appareil} » (Lot: ${lot}, Local: ${local}) :</h4>
  <div class="table-responsive mt-3">
    <table class="table table-bordered">
      <thead class="table-light">
        <tr>
          <th>Câble</th>
          <th>Statut</th>
          <th>GAM</th>
          <th>Direction</th>
        </tr>
      </thead>
      <tbody>`;

  rows.forEach(c => {
    const dir = c.APA === dev ? "Arrivée (APA)" : c.APO === dev ? "Départ (APO)" : "-";
    html += `<tr>
      <td>${c.CBL}</td>
      <td>${c.STT_CBL_BORD || "-"}</td>
      <td>${c.GAM || "-"}</td>
      <td>${dir}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  box.innerHTML = html;
}

function showSug() {
  const val = strip(document.getElementById("apInput").value.trim());
  const box = document.getElementById("suggestions");
  box.innerHTML = "";
  if (!val) return hideSug();

  const list = devices
    .filter(d => typeof d === "string" && d.includes(val))  // 🔐 garde‑fou typeof
    .slice(0, 15);

  if (!list.length) return hideSug();

  list.forEach(d => {
    const el = document.createElement("div");
    el.className = "list-group-item list-group-item-action";
    el.textContent = d;
    el.onclick = () => {
      document.getElementById("apInput").value = d;
      hideSug();
      search();
    };
    box.appendChild(el);
  });
  box.style.display = "block";
}
function hideSug() {
  const suggestionsElement = document.getElementById("suggestions");
  if (suggestionsElement) {
    suggestionsElement.style.display = "none";
  }
}

// Fonctions pour la page cable.html
async function loadAllData() {
  const colonnes = window.COLUMNS;
  let dataMap = {};
  let allCbls = [];

  const stripPrefix = id => String(id || "").replace(new RegExp(`^${window.PREFIXES.CABLE_PREFIX}`, 'i'), "");

  for (const col of colonnes) {
    try {
      const res = await fetch(`json/cables_${col}.json`);
      const rows = await res.json();
      rows.forEach(row => {
        const rawId = row.CBL;
        const id = stripPrefix(rawId);
        if (!dataMap[id]) dataMap[id] = { CBL: id };
        dataMap[id][col] = row[col];
      });
    } catch (e) {
      console.warn("Erreur lors du chargement des données pour la colonne", col, e);
    }
  }

  allCbls = Object.keys(dataMap);
  window.dataMap = dataMap;
  window.allCbls = allCbls;
}

function searchCBL() {
  const codeInput = document.getElementById("cblInput").value.trim().toUpperCase();
  const stripPrefix = id => String(id || "").replace(new RegExp(`^${window.PREFIXES.CABLE_PREFIX}`, 'i'), "");
  const code = stripPrefix(codeInput);
  if (!code) return;
  const cable = window.dataMap[code];
  const resultDiv = document.getElementById("result");
  hideSuggestions();

  if (!cable) {
    resultDiv.innerHTML = `<div class="alert alert-danger">Câble "${codeInput}" non trouvé.</div>`;
    return;
  }

  let html = `
    <div class="card mb-3">
      <div class="card-header bg-primary text-white">🔌 Câble : ${cable.CBL}</div>
      <div class="card-body">
        <h5 class="card-title">Informations générales</h5>
        <ul class="list-unstyled">
          <li><strong>GAM:</strong> ${cable.GAM || "-"}</li>
          <li><strong>Statut du câble à bord:</strong> ${cable.STT_CBL_BORD || "-"}</li>
          <li><strong>Responsable du tirage:</strong> ${cable.RESP_TIRAGE || "-"}</li>
        </ul>
        <h5 class="card-title mt-4">Détails APO et APA</h5>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Information</th>
              <th>APO</th>
              <th>APA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Appareil</strong></td>
              <td>${cable.APO || "-"}</td>
              <td>${cable.APA || "-"}</td>
            </tr>
            <tr>
              <td><strong>Lot Montage</strong></td>
              <td>${cable.LOT_MTG_APO || "-"}</td>
              <td>${cable.LOT_MTG_APA || "-"}</td>
            </tr>
            <tr>
              <td><strong>Local</strong></td>
              <td>${cable.LOCAL_APO || "-"}</td>
              <td>${cable.LOCAL_APA || "-"}</td>
            </tr>
          </tbody>
        </table>
        <ul class="list-unstyled">
          <li><strong>Point de câble:</strong> ${cable.PT_CBL || "-"}</li>
        </ul>
      </div>
    </div>
  `;
  resultDiv.innerHTML = html;
}

function showSuggestions() {
  const stripPrefix = id => String(id || "").replace(new RegExp(`^${window.PREFIXES.CABLE_PREFIX}`, 'i'), "");
  const input = stripPrefix(document.getElementById("cblInput").value.trim().toUpperCase());
  const sugDiv = document.getElementById("suggestions");
  sugDiv.innerHTML = "";
  if (!input) {
    hideSuggestions();
    return;
  }

  const matches = window.allCbls.filter(cbl => cbl.includes(input)).slice(0, 15);
  if (matches.length === 0) {
    hideSuggestions();
    return;
  }

  matches.forEach(cbl => {
    const item = document.createElement("div");
    item.className = "list-group-item list-group-item-action";
    item.textContent = cbl;
    item.addEventListener("click", () => {
      document.getElementById("cblInput").value = cbl;
      hideSuggestions();
      searchCBL();
    });
    sugDiv.appendChild(item);
  });
  sugDiv.style.display = "block";
}

function hideSuggestions() {
  const suggestionsElement = document.getElementById("suggestions");
  if (suggestionsElement) {
    suggestionsElement.innerHTML = "";
    suggestionsElement.style.display = "none";
  }
}

function handleKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    searchCBL();
  }
}

// Fonctions utilitaires
function showMessage(msg, type = "info") {
  const messageElement = document.getElementById("message");
  if (messageElement) {
    messageElement.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  }
}

function setLoadingMessage(msg) {
  const loadingElement = document.getElementById("loadingMsg");
  if (loadingElement) {
    loadingElement.textContent = msg;
  }
}

// Initialisation des pages
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById("fileInput")) {
    document.getElementById("fileInput").addEventListener("change", handleFile);
    document.getElementById("downloadAllBtn").addEventListener("click", downloadAllAsZip);
  }

  if (document.getElementById("apInput")) {
    loadJSON();
    document.getElementById("searchBtn").addEventListener("click", search);
    document.getElementById("apInput").addEventListener("input", showSug);
    document.getElementById("apInput").addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        search();
      }
    });
  }

  if (document.getElementById("cblInput")) {
    loadAllData();
    document.getElementById("searchBtn").addEventListener("click", searchCBL);
    document.getElementById("cblInput").addEventListener("input", showSuggestions);
    document.getElementById("cblInput").addEventListener("keydown", handleKeyDown);
  }
});

// je cherche à adapter et reparer le bug de nom relatif qui n'aparait pas dans la page index
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM entièrement chargé');
  if (window.SHIP && window.SHIP.NAME) {
    console.log('Nom du navire :', window.SHIP.NAME);
    const shipNameElements = document.querySelectorAll('#shipName');
    shipNameElements.forEach(element => {
      element.textContent = window.SHIP.NAME;
    });
  } else {
    console.error('La configuration du navire n\'est pas définie.');
  }
});
