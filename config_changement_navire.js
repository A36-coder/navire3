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

// Exporter les constantes pour les utiliser dans d'autres fichiers
window.PREFIXES = PREFIXES;
window.LINKS = LINKS;
window.SHIP = SHIP;
