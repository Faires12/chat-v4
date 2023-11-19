import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import dotenv from 'dotenv'

dotenv.config({})

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
    return res.status(200).send('Health check ok!')
})

const httpServer = createServer(app)

const io = new Server(httpServer, {
    cors: {origin: '*'}
})

const pubClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    }
});
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});

io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected`);

    socket.on("message", (msg) => {
        io.emit("message", msg)
    });

    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected`);
    })
})

httpServer.listen(3000, () => {
    console.log('Server listening on port 3000');
})