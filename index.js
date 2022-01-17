const express = require('express');
const app = express();
const http = require('http');
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
        socket.join(usuario.sala)
        socket.broadcast.emit('mensagem',usuario.nome + ' entrou');
    });

    socket.on("enviaMensagem", message => {
        const usuario = getUsuario(socket.id)
        socket.broadcast.to(usuario.sala).emit('mensagem',message);
    });

    socket.on("getSalas",() =>{
        const salas = getSalas();
        socket.emit('retornoSalas',salas);
    });

    socket.on("disconnect", () => {
        deletaUsuario(socket.id);
    })

})