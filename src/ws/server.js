import {WebSocket, WebSocketServer} from "ws";
function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) return;

        client.send(JSON.stringify(payload));

    }
}

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