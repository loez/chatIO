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
    const msgEntrou = '<i class="fas fa-sign-in-alt fa-2x"></i><br><small>Entrou</small>';
    const msgSaiu = '<i class="fas fa-sign-out-alt fa-2x"></i><br><small>Saiu</small>';

    function CriaMensagem(usuario, msg) {
        return {
            'Mensagem': msg,
            'Hora': moment().format('HH:mm:ss'),
            'Usuario': usuario.nome
        };
    }

    socket.on("login", ({nome, sala}) => {
        const { usuario } = adicionaUsuario(socket.id, nome, sala)
        socket.join(usuario.sala);

        if (usuario.salaOld !== undefined) {
            socket.broadcast.to(usuario.salaOld).emit('mensagem', CriaMensagem(usuario, msgSaiu));
        }

        socket.broadcast.to(usuario.sala).emit('mensagem', CriaMensagem(usuario, msgEntrou));
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
        const usuario = getUsuario(socket.id);

        if (usuario !== undefined) {
            socket.broadcast.to(usuario.sala).emit('mensagem', CriaMensagem(usuario, msgSaiu));
        }

        deletaUsuario(socket.id);
    })

})