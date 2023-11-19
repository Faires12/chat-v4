import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { createClient } from "redis";
import { Server } from 'socket.io';

const loadSecrets = async () => {
    const client = new SecretsManagerClient({ region: "us-east-2" });

    const command = new GetSecretValueCommand({
        SecretId: 'my-secrets'
    });

    const res = await client.send(command)

    return res.SecretString ? JSON.parse(res.SecretString) : null
}

dotenv.config({})

const app = express()

app.use(cors())
app.use(express.json())

loadSecrets()

app.get('/health', (req, res) => {
    return res.status(200).send('Health check ok!')
})

const httpServer = createServer(app)

const io = new Server(httpServer, {
    cors: {origin: '*'}
})

loadSecrets().then(secret => {
    console.log('Loaded secrets');
    const pubClient = createClient({
        password: secret.REDIS_PASSWORD,
        socket: {
            host: secret.REDIS_HOST,
            port: Number(secret.REDIS_PORT)
        }
    });
    const subClient = pubClient.duplicate();
    
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      console.log('Redis connected');
      io.adapter(createAdapter(pubClient, subClient));
    });
})

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