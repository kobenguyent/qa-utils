/**
 * Electron preload script
 * This script runs before the web page is loaded and has access to both
 * Node.js APIs and the web page's DOM.
 * 
 * We use this to expose safe APIs to the renderer process.
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Platform information
  platform: process.platform,
  
  // You can add more safe APIs here as needed
  // Example: send messages to main process
  // sendMessage: (channel, data) => {
  //   ipcRenderer.send(channel, data);
  // },
  
  // Example: receive messages from main process
  // onMessage: (channel, func) => {
  //   ipcRenderer.on(channel, (event, ...args) => func(...args));
  // },
});
