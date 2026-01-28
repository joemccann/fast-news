const WebSocket = require('ws');

const url = process.argv[2];

if (!url) {
  console.error('Usage: node index.js <websocket-url>');
  process.exit(1);
}

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('Connected to', url);
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'flash' || msg.type === 'flash_impact') {
      console.log(JSON.stringify(msg, null, 2));
    }
  } catch (e) {
    console.log(data.toString());
  }
});

ws.on('error', (err) => {
  console.error('Error:', err.message);
});

ws.on('close', () => {
  console.log('Connection closed');
});
