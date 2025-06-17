// script.js

let jsonData = {};
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  showMsg("", "info");
  document.getElementById("loadingMsg").textContent = "⏳ Chargement...";
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      parseAndSplitColumns(new Uint8Array(evt.target.result));
    } catch (err) {
      console.error(err);
      showMsg(`Erreur: ${err.message}`, "danger");
    } finally {
      document.getElementById("loadingMsg").textContent = "";
    }
  };
  reader.readAsArrayBuffer(file);
}


function parseAndSplitColumns(arrayBuf) {
  try {
    const workbook = XLSX.read(arrayBuf, { type: "array" });
    const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes("cables"));
    if (!sheetName) {
      showMsg("Feuille 'Cables' non trouvée", "danger");
      return;
    }
    const sheet = workbook.Sheets[sheetName];
    const jsonRaw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const linksContainer = document.getElementById("downloadLinks");
    linksContainer.innerHTML = "";
    jsonData = {};
    window.COLUMNS.forEach(col => {
      const data = jsonRaw.map(row => ({ CBL: row["CBL"] || "", [col]: row[col] || "" }));
      jsonData[col] = data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cables_${col}.json`;
      link.className = "btn btn-primary me-2 mb-2";
      link.textContent = `Télécharger ${link.download}`;
      linksContainer.appendChild(link);
    });
    showMsg(`✅ ${jsonRaw.length} lignes chargées.`, "success");
  } catch (err) {
    console.error(err);
    showMsg(`Erreur: ${err.message}`, "danger");
  }
}


function downloadAllAsZip() {
  const zip = new JSZip();
  const imgFolder = zip.folder("json_files");
  window.COLUMNS.forEach(col => {
    if (jsonData[col]) {
      imgFolder.file(`cables_${col}.json`, JSON.stringify(jsonData[col], null, 2));
    }
  });
  zip.generateAsync({ type: "blob" }).then(content => {
    const zipLink = document.createElement("a");
    zipLink.href = URL.createObjectURL(content);
    zipLink.download = "json_files.zip";
    document.body.appendChild(zipLink);
    zipLink.click();
    document.body.removeChild(zipLink);
  });
}

function showMsg(msg, type = "info") {
  document.getElementById("message").innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}


window.handleFile = handleFile;
window.downloadAllAsZip = downloadAllAsZip;
