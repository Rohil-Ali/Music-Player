const { ipcRenderer } = require('electron');


const playBtn = document.getElementById('playBtn');

let spotifyToken;
let player;
let deviceId;

//waits for spotify-token channel from main process and access the token sent with it.
ipcRenderer.on('spotify-token', (event, token) => {
  spotifyToken = token;
  if (window.waitingForSDKReady) {
      createSpotifyPlayer();
      window.waitingForSDKReady = false;
      SpotifyPlayerEvents();
  }
});

//since the window.onSpotifyWebPlaybackSDKReady needs to be a global function and we have to wait for the token to be set before creating the player i have split the logic.
//This way if the SDK is ready before we have the token we wait until we get it to create the player. --> reminder for myself.
window.onSpotifyWebPlaybackSDKReady = () => {
    if (!spotifyToken) {
        window.waitingForSDKReady = true;
        return;
    }
    createSpotifyPlayer();
    SpotifyPlayerEvents();
}

//creates the player
const createSpotifyPlayer = () => {
    player = new Spotify.Player({
        name: 'Electron Spotify Player',
        getOAuthToken: cb => { cb(spotifyToken); },
        volume: 0.5
    });
}

function SpotifyPlayerEvents() {
    if (!spotifyToken) return;

    //ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        deviceId = device_id;
    });

    //not ready
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        deviceId = device_id;
    });

    //error messages
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    player.connect();

    playBtn.addEventListener('click', () => {
        if (!deviceId) return alert('Player not ready yet');
            fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: ['spotify:track:5pHJv0bgNsT9nPoK2BjNBn'] }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyToken}`
                }
            });
        });
    };



