import  express from "express";
import  {matchRouter} from "./routes/matches.js";
import * as http from "http";
import {attachWebSocketServer} from "./ws/server.js";



const rawPort = process.env.PORT;
const PORT = rawPort === undefined ? 8000 : Number(rawPort);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
   throw new Error(`Invalid PORT: ${process.env.PORT}`);
}
const HOST = process.env.HOST || '0.0.0.0' ;
const app = express();
app.use(express.json());
const server = http.createServer(app);

app.use('/matches', matchRouter);

const { broadCastMatchCreated } = attachWebSocketServer(server)
app.locals.broadCastMatchCreated = broadCastMatchCreated;
server.listen(PORT,HOST, () => {
  const protocol = process.env.USE_TLS ? 'https' : 'http';
  const wsProtocol = process.env.USE_TLS ? 'wss' : 'ws';
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`Server is running on ${protocol}://${displayHost}:${PORT}`);
  console.log(`Websocket Server is running on ${wsProtocol}://${displayHost}:${PORT}/ws`);
})

