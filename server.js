const express = require("express");
const app = express();
const WebSocket = require('ws');

// HTTP-страница для проверки
app.get("/", (req, res) => res.send("Mirror Relay Server"));

// Запуск сервера
const server = app.listen(3000, () => console.log("Server started on port 3000"));

// WebSocket-сервер
const wss = new WebSocket.Server({ server });
let rooms = {};

wss.on('connection', (socket) => {
    console.log("New client connected");

    socket.on('message', (message) => {
        const data = JSON.parse(message);
        
        // Создание комнаты
        if (data.type === "create") {
            rooms[data.roomId] = [socket];
            socket.send(JSON.stringify({ type: "created", roomId: data.roomId }));
        } 
        // Подключение к комнате
        else if (data.type === "join") {
            if (rooms[data.roomId]) {
                rooms[data.roomId].push(socket);
                // Оповещаем всех в комнате
                rooms[data.roomId].forEach(client => {
                    client.send(JSON.stringify({ type: "connected", roomId: data.roomId }));
                });
            }
        }
    });

    socket.on('close', () => {
        console.log("Client disconnected");
        // Удаляем отключившегося игрока из всех комнат
        for (const roomId in rooms) {
            rooms[roomId] = rooms[roomId].filter(s => s !== socket);
        }
    });
});