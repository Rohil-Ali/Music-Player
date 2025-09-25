const path = require('path');
const { app, BrowserWindow } = require('electron');
const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const open = require('open');
require('dotenv').config();

//Electron Reload for renderer process
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
  hardResetMethod: 'exit'
});

//Spotify API setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI  // redirect for OAuth
});

const scopes = ['streaming', 'user-read-playback-state', 'user-modify-playback-state'];

//Main window
const createWindow = () => {
  const win = new BrowserWindow({
    width: 380,
    height: 600
  })

  win.loadFile('html/index.html')
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})