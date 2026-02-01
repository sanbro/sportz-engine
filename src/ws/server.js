import {WebSocket, WebSocketServer} from "ws";
import {httpArcjet, wsArcjet} from "../arcjet.js";
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
    wss.on('connection', async (socket, req) => {
        if (wsArcjet){
            try {
                const decision = await wsArcjet.protect(req);
                if(decision.isDenied()){
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reason = decision.reason.isRateLimit() ? 'Too many requests' : 'Forbidden';
                    socket.close(code, reason);
                    return;
                }
            }catch (e) {
                console.error('WS connection error',e)
                socket.close(1011, 'Server Security error');
            }
        }
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