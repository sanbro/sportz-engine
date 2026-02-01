import {WebSocket, WebSocketServer} from "ws";
const HEARTBEAT_INTERVAL = 30000;
function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    const message = JSON.stringify(payload);
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
             client.send(message);
        }

    }
}

export function attachWebSocketServer(server) {
    const wss =  new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024,
    })
    const interval = setInterval(() => {
            wss.clients.forEach((socket) => {
                if (socket.isAlive === false) {
                    socket.terminate();
                    return;
                }
                socket.isAlive = false;
                socket.ping();
            });
            }, HEARTBEAT_INTERVAL);
    wss.on('close', () => clearInterval(interval));
    wss.on('connection', (socket) => {
        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true; });
        sendJson(socket, {type: 'welcome'});
        socket.on('error', (err) => console.error(err))
    })

    function broadCastMatchCreated(match){
        broadcast(wss, {type: 'match_created', payload: match})
    }

    return {broadCastMatchCreated}

}