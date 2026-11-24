
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Handle client connections
io.on('connection', (socket) => {

    console.log('User connected:', socket.id);

    // Receive a message and broadcast it to everyone
    socket.on('chat-message', (message) => {
        io.emit('chat-message', message);
    });

    // Notify other users when someone is typing
    socket.on('typing', () => {
        socket.broadcast.emit('typing');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

});

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
