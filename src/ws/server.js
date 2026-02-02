import {WebSocket, WebSocketServer} from "ws";
import {httpArcjet, wsArcjet} from "../arcjet.js";
const HEARTBEAT_INTERVAL = 30000;
/**
 * Send a value as a JSON-encoded message over a WebSocket if the socket is open.
 * @param {WebSocket} socket - The destination WebSocket.
 * @param {*} payload - The value to serialize to JSON and send.
 */
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

/**
 * Attach a WebSocket server at "/ws" to an existing HTTP server and expose a broadcaster for new matches.
 *
 * The attached server enforces a periodic heartbeat to terminate unresponsive clients and, if available,
 * applies wsArcjet protection to incoming connections; connections denied by protection are closed with
 * appropriate WebSocket close codes (1013 for rate limiting, 1008 for forbidden, 1011 for protection errors).
 * A `{ type: 'welcome' }` message is sent to each accepted client and socket errors are logged.
 *
 * @param {import('http').Server} server - The HTTP server instance to bind the WebSocket server to.
 * @returns {{ broadCastMatchCreated: (match: object) => void }} An object with `broadCastMatchCreated(match)` which broadcasts a `match_created` message with the provided match payload to all connected clients.
 */
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
                return;
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