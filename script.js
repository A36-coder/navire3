// script.js

// Variable globale pour stocker les données JSON générées
let jsonData = {};
let isDataReady = false;


// Fonction pour gérer le chargement du fichier
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


// Fonction pour analyser le fichier Excel et générer les fichiers JSON
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


// Fonction pour générer les fichiers JSON
function generateJSONFiles(jsonRaw) {
  const linksContainer = document.getElementById("downloadLinks");
  linksContainer.innerHTML = "";
  jsonData = {};

  window.COLUMNS.forEach(col => {
    jsonData[col] = jsonRaw.map(row => ({ CBL: row["CBL"] || "", [col]: row[col] || "" }));

    const blob = new Blob([JSON.stringify(jsonData[col], null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = createDownloadLink(url, `cables_${col}.json`, `Télécharger cables_${col}.json`);
    linksContainer.appendChild(link);
  });

  isDataReady = true;
  document.getElementById("downloadAllBtn").disabled = !isDataReady;
  showMessage(`✅ ${jsonRaw.length} lignes chargées.`, "success");
}


// Fonction pour créer un lien de téléchargement
function createDownloadLink(url, downloadName, linkText) {
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadName;
  link.className = "btn btn-primary me-2 mb-2";
  link.textContent = linkText;
  return link;
}

// Fonction pour télécharger tous les fichiers en ZIP
function downloadAllAsZip() {
  if (!isDataReady) {
    showMessage("Veuillez d'abord générer les fichiers JSON.", "warning");
    return;
  }

  setLoadingMessage("⏳ Création du ZIP en cours...");

  const zip = new JSZip();
  const jsonFolder = zip.folder("json_files");

  window.COLUMNS.forEach(col => {
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


// Fonction pour afficher un message
function showMessage(msg, type = "info") {
  document.getElementById("message").innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}


// Fonction pour définir le message de chargement
function setLoadingMessage(msg) {
  document.getElementById("loadingMsg").textContent = msg;
}

// s'assurer les fonctions sont disponibles globalement si nécessaire
window.handleFile = handleFile;
window.downloadAllAsZip = downloadAllAsZip;
