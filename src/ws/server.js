import {WebSocket, WebSocketServer} from "ws";
import {httpArcjet, wsArcjet} from "../arcjet.js";
const HEARTBEAT_INTERVAL = 30000;
const matchSubscriber =  new Map();

function subscribe(matchId,socket ) {
    if(!matchSubscriber.has(matchId)){
        matchSubscriber.set(matchId, new Set());
    }
    matchSubscriber.get(matchId).add(socket);
}
function unsubscribe(matchId,socket ) {
    const subscribers = matchSubscriber.get(matchId);
    if(!subscribers) return;
    if(subscribers.size === 0){
        matchSubscriber.delete(matchId);
    }
    subscribers.delete(socket);
}

function cleanupSubscriptions(socket){
    for (const matchId  of socket.subscriptions){
        unsubscribe(matchId,socket);
    }
}
function broadcastToAll(wss, payload) {
    const message = JSON.stringify(payload);
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }

    }
}
function broadcastToMatch(matchId,payload){
    const subscribers = matchSubscriber.get(matchId);
    if(!subscribers || subscribers.size === 0) return;
    const message = JSON.stringify(payload);
    for (const client of subscribers){
        if(client.readyState === WebSocket.OPEN){
            client.send(message);
        }
    }
}

function handleMessage(socket,data){
    let message ;
    try{
        message = JSON.parse(data.toString());
    }catch (e) {
        sendJson(socket, {type: 'error', message: 'Invalid Json'});
    }

    if(message?.type === "subscribe" && Number.isInteger(message.matchId) ){
        subscribe(message.matchId, socket)
        socket.subscriptions.add(message.matchId);
        sendJson(socket, {type: 'subscribed', matchId: message.matchId});
        return;
    }

    if(message?.type === "unsubscribe" && Number.isInteger(message.matchId) ){
        unsubscribe(message.matchId,socket);
        socket.subscriptions.delete(message.matchId);
        sendJson(socket, {type: 'unsubscribed', matchId: message.matchId});
        return;
    }
}
function sendJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
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
                return;
            }
        }
        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true; });
        socket.subscriptions = new Set();
        sendJson(socket, {type: 'welcome'});
        socket.on('message', (data) => handleMessage(socket, data));
        socket.on('error',() => socket.terminate());
        socket.on('close',() => cleanupSubscriptions(socket));
        socket.on('error', (err) => console.error(err))
    })

    function broadCastMatchCreated(match){
        broadcastToAll(wss, {type: 'match_created', payload: match})
    }

    function broadCastCommentary(matchId, comment){
        broadcastToMatch(matchId, {type: 'commentary', data: comment});
    }

    return {broadCastMatchCreated, broadCastCommentary}

}