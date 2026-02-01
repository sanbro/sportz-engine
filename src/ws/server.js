import {WebSocket, WebSocketServer} from "ws";
/**
 * Send a JSON-serializable payload to a WebSocket when the socket is open.
 * Does nothing if the socket is not in the open state.
 * @param {WebSocket} socket - The target WebSocket connection.
 * @param {*} payload - The value to serialize to JSON and send. 
 */
function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

/**
 * Broadcasts a payload as JSON to all connected WebSocket clients.
 *
 * If a client is encountered whose readyState is not OPEN, the function stops
 * immediately and does not send the payload to subsequent clients.
 *
 * @param {WebSocketServer} wss - WebSocket server whose clients will receive the payload.
 * @param {*} payload - Value that will be JSON-stringified and sent to clients; should be JSON-serializable.
 */
function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) return;

        client.send(JSON.stringify(payload));

    }
}

/**
 * Attach a WebSocket server to an existing HTTP server and provide a helper to broadcast match-created events.
 * @param {import('http').Server} server - HTTP server instance to mount the WebSocketServer on (path '/ws').
 * @returns {{ broadCastMatchCreated: (match: any) => void }} An object exposing `broadCastMatchCreated`, which broadcasts a `match_created` event with the given `match` payload to all connected clients.
 */
export function attachWebSocketServer(server) {
    const wss =  new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024,
    })
    wss.on('connection', (socket) => {
        sendJson(socket, {type: 'welcome'});
        socket.on('error', (err) => console.error(err))


        // socket.on('close', () => wss.clients.delete(socket))
    })

    function broadCastMatchCreated(match){
        broadcast(wss, {type: 'match_created', payload: match})
    }

    return {broadCastMatchCreated}

}