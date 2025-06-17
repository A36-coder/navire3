// config_changement_navire.js

// Préfixes pour les appareils spécifiques au navire
const PREFIXES = {
  APPAREIL_PREFIX: 'A36-',
  CABLE_PREFIX: 'A36-C-'
};

// Lien pour télécharger le fichier NEC spécifique au navire
const LINKS = {
  NEC_DOWNLOAD: 'https://share.chantiers-atlantique.com/share/proxy/alfresco/slingshot/node/content/workspace/SpacesStore/a07b362b-bbf9-4c2d-8953-043584538638/Extraction_NEC_A36.xlsx?a=true'
};

// Nom du navire
const SHIP = {
  NAME: 'A36'
};

// Colonnes à utiliser dans les différentes pages
const COLUMNS = ["PT_CBL", "GAM", "STT_CBL_BORD", "RESP_TIRAGE", "LOT_MTG_APO", "LOCAL_APO", "APO", "LOT_MTG_APA", "LOCAL_APA", "APA"];

// Noms des fichiers JSON, ne modifier que si vous maitrisez...
const JSON_FILES = {
  CABLES_PREFIX: 'cables_',
  JSON_EXTENSION: '.json'
};

// Exporter les constantes pour les utiliser dans d'autres fichiers
window.PREFIXES = PREFIXES;
window.LINKS = LINKS;
window.SHIP = SHIP;
window.COLUMNS = COLUMNS;
window.JSON_FILES = JSON_FILES;
