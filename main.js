const path = require('path');
const { app, BrowserWindow, components, ipcMain } = require('electron');
const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const { shell } = require('electron');
const crypto = require('crypto');
require('dotenv').config();

//Electron Reload for renderer process
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
  hardResetMethod: 'exit'
});

const getRandomState = () => crypto.randomBytes(16).toString('hex');

//Spotify API setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI  // redirect for OAuth
});

const scopes = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state'
];

/*
  Reminder for my self

  AMD + Electron + Widevine:

  - MF (Windows Media Foundation) decodes Spotify streams (even audio is treated like video).
  - AMD GPU often fails hardware acceleration → errors in console.
  - Fix: disable GPU in Electron so MF uses CPU decoding:
      app.commandLine.appendSwitch('disable-gpu');
      app.commandLine.appendSwitch('disable-software-rasterizer');
  - Keep sandbox off if needed:
      app.commandLine.appendSwitch('no-sandbox');

    GPU acceleration works fine on Intel and Nvidia GPUs. not my 9070xt :(
    app.commandLine.appendSwitch('no-sandbox');
    app.commandLine.appendSwitch('disable-gpu');
    app.commandLine.appendSwitch('disable-software-rasterizer');
    app.commandLine.appendSwitch('disable-features', 'UseAngle');
*/




let window;
let accessToken;

//Main window
const createWindow = () => {
  window = new BrowserWindow({
    width: 380,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false 
    }
  })

  window.loadFile('src/html/index.html')
}

app.whenReady().then(async () => {
  await components.whenReady();
  console.log('Components ready', components.status());
  createWindow();
  if (!accessToken) startSpotifyAuth();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// -------------------------
// Spotify OAuth
// -------------------------
function startSpotifyAuth(){
  const authServer = express();
  const port = 8888;

  //open spotify login page
  const authoriseURL = spotifyApi.createAuthorizeURL(scopes, getRandomState());
  shell.openExternal(authoriseURL);

  //handles the redirect form spotify
  authServer.get('/callback', async (req, res) => {
    const code = req.query.code;
    try {
      const data = await spotifyApi.authorizationCodeGrant(code);
      accessToken = data.body['access_token'];
      spotifyApi.setAccessToken(accessToken);
      spotifyApi.setRefreshToken(data.body['refresh_token']);

      res.send('Spotify authenticated! You can close this window.');
      // send token to renderer
      window.webContents.send('spotify-token', accessToken);
    } 
    catch (err) {
      console.error(err);
      res.send('Error during Spotify authentication');
    }
  });

    authServer.listen(port, () => {
    console.log(`Spotify OAuth listening on http://localhost:${port}`);
  });
}

