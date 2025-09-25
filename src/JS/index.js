const playBtn = document.getElementById('playBtn');

const { ipcRenderer } = require('electron');

let spotifyToken;
let player;
let deviceId

//waits for spotify-token channel from main process and access the token sent with it.
ipcRenderer.on('spotify-token', (event, token) => {
  spotifyToken = token;
  initSpotifyPlayer();
});

function initSpotifyPlayer() {
    if (!spotifyToken) return;

    window.onSpotifyWebPlaybackSDKReady = () => {
        player = new Spotify.Player({
            name: 'Electron Spotify Player',
            getOAuthToken: cb => { cb(spotifyToken); },
            volume: 0.5
        });

    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        deviceId = device_id;
    });

    //error messages
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    player.connect();

    playBtn.addEventListener('click', () => {
        if (!deviceId) return console.error('Player not ready yet');
            fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: ['spotify:track:4uLU6hMCjMI75M1A2tKUQC'] }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyToken}`
                }
            });
        });
    };
}
