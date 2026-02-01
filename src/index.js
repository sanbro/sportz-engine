import  express from "express";
import  {matchRouter} from "./routes/matches.js";
import * as http from "http";
import {attachWebSocketServer} from "./ws/server.js";



const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '0.0.0.0' ;
const app = express();
app.use(express.json());
const server = http.createServer(app);

app.use('/matches', matchRouter);

const { broadCastMatchCreated } = attachWebSocketServer(server)
app.locals.broadCastMatchCreated = broadCastMatchCreated;
server.listen(PORT,HOST, () => {
  const  baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`
  console.log(`Server is running on ${baseUrl}`)
  console.log(`Websocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`)
})

