const express = require('express');
const app = express();
const http = require('http');
const moment = require('moment');
const server = http.createServer(app);
const io = require('socket.io')(server,{
    cors: {
        origin: ["http://localhost"],
        methods: ["GET", "POST"],
    }
});

const { adicionaUsuario, getUsuario, deletaUsuario, getUsuariosSala, getSalas } = require('./usuarios')


app.use(express.static(__dirname + '/'));
app.use(express.static(__dirname + '/views'));

server.listen(80, function () {
    console.log('Rodando na porta 80')
});

io.on('connection', (socket) => {
    socket.on("login", ({nome, sala}) => {
        const { usuario } = adicionaUsuario(socket.id, nome, sala)
        socket.join(usuario.sala);
        let mensagem = {
            'Mensagem': 'Entrou',
            'Hora': moment().format('HH:mm:ss'),
            'Usuario': usuario.nome
        };
        socket.broadcast.to(usuario.sala).emit('mensagem', mensagem);
    });

    socket.on("enviaMensagem", (message, callback) => {
        const usuario = getUsuario(socket.id);

        message['Hora'] = moment().format('HH:mm:ss');

        socket.broadcast.to(usuario.sala).emit('mensagem', message);

        callback(message);
    });

    socket.on("getSalas",() =>{
        const salas = getSalas();
        socket.emit('retornoSalas',salas);
    });

    socket.on("getUsers", (sala) =>{
        const users = getUsuariosSala(sala);
        socket.emit('retornoUsers', users);
    });

    socket.on("disconnect", () => {
        deletaUsuario(socket.id);
    })

})