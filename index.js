const express = require('express');
const app = express();
const http = require('http');
const moment = require('moment');
const server = http.createServer(app);
const io = require('socket.io')(server,{
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/peerjs'
});

global.db = require('./db');

const porta = 8080;
const { adicionaUsuario, getUsuario, deletaUsuario, getUsuariosSala, getSalas } = require('./usuarios')


app.use(express.static(__dirname + '/'));
app.use(express.static(__dirname + '/views'));

app.use(peerServer)

server.listen(porta, function () {
    console.log('Rodando na porta ' + porta);
});

io.on('connection', (socket) => {
    const msgEntrou = '<i class="fas fa-sign-in-alt fa-2x"></i><br><small>Entrou</small>';
    const msgSaiu = '<i class="fas fa-sign-out-alt fa-2x"></i><br><small>Saiu</small>';
    const digitando = '<span class="etc"><i></i><i></i><i></i></span>';

    function CriaMensagem(usuario, msg) {
        return {
            'Mensagem': msg,
            'Hora': moment().format('HH:mm:ss'),
            'Usuario': usuario.nome
        };
    }

    socket.on("login", ({nome, sala}, callback) => {
        const { usuario } = adicionaUsuario(socket.id, nome, sala)
        socket.join(usuario.sala);
        global.db.SalvaSala(sala);

        global.db.RetornaMensagensGroup(usuario.sala).then((mensagens) => {
            callback((mensagens.length > 0 ? mensagens : []));
        });

        if (usuario.salaOld !== undefined) {
            socket.broadcast.to(usuario.salaOld).emit('mensagem', CriaMensagem(usuario, msgSaiu));
            socket.broadcast.to(usuario.salaOld).emit('retornoUsers', getUsuariosSala(usuario.salaOld));
        }

        socket.broadcast.to(usuario.sala).emit('mensagem', CriaMensagem(usuario, msgEntrou));
        socket.broadcast.to(usuario.sala).emit('retornoUsers', getUsuariosSala(usuario.sala));
    });

    socket.on("enviaMensagem", (message, callback) => {
        const usuario = getUsuario(socket.id);

        message['Data'] = moment().format('YYYY-MM-DD');
        message['Hora'] = moment().format('HH:mm:ss');

        socket.broadcast.to(usuario.sala).emit('mensagem', message);

        global.db.SalvaMensagem(usuario.sala, message);

        callback(message);
    });

    socket.on("digitando", () => {
        const usuario = getUsuario(socket.id);
        socket.broadcast.to(usuario.sala).emit('enviaDigitando',  CriaMensagem(usuario, digitando));
    });

    socket.on("limpaDigitando", () => {
        const usuario = getUsuario(socket.id);
        socket.broadcast.to(usuario.sala).emit('enviaLimpaDigitando',  usuario.nome);
    });

    socket.on("getSalas",() =>{
        const salas = getSalas();
        socket.emit('retornoSalas',salas);
    });

    socket.on("getUsers", (sala) =>{
        socket.emit('retornoUsers', getUsuariosSala(sala));
    });

    socket.on("disconnect", () => {
        const usuario = getUsuario(socket.id);

        if (usuario !== undefined) {
            socket.broadcast.to(usuario.sala).emit('mensagem', CriaMensagem(usuario, msgSaiu));
            socket.broadcast.to(usuario.sala).emit('retornoUsers', getUsuariosSala(usuario.sala));
        }

        deletaUsuario(socket.id);
    })

    socket.on("abrir-video",(id) => {
        socket.broadcast.emit('video-chat',id)
    })

})