// config_changement_navire.js

// Préfixes pour les appareils spécifiques au navire
const PREFIXES = {
  APPAREIL_PREFIX: 'A36-',
  APPAREIL_C_PREFIX: 'A36-C-'
};

// Lien pour télécharger le fichier NEC spécifique au navire
const LINKS = {
  NEC_DOWNLOAD: 'https://share.chantiers-atlantique.com/share/proxy/alfresco/slingshot/node/content/workspace/SpacesStore/a07b362b-bbf9-4c2d-8953-043584538638/Extraction_NEC_A36.xlsx?a=true'
};

// Informations d'identification GitHub spécifiques au navire
const GITHUB = {
  USERNAME: 'A36-coder',
  REPO: 'pvarc/elec/json'
};

// Exporter les constantes pour les utiliser dans d'autres fichiers
window.PREFIXES = PREFIXES;
window.LINKS = LINKS;
window.GITHUB = GITHUB;
