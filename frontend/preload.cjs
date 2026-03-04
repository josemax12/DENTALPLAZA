const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Aquí puedes añadir funciones seguras para comunicar el renderizado con el proceso principal
    platform: process.platform,
});
