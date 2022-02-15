let timeDigitando;

const qtdReconnection = 15;
const socket = io("/", {reconnectionAttempts: qtdReconnection});

const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "8080",
});

document.addEventListener("DOMContentLoaded", function() {
    let btnMensagem = document.getElementById('btnMensagem'),
        btnEntrar = document.getElementById('btnEntrar'),
        btnVideo = document.getElementById('btnVideo'),
        inputUsuario = document.getElementById('inputUsuario'),
        inputMensagem = document.getElementById('inputMensagem'),
        todasMensagens = document.getElementById('todasMensagens');

    btnEntrar.addEventListener("click", () => {
        if (inputUsuario.value === "") {
            return false;
        }

        inputUsuario.setAttribute('readonly',true);
        socket.emit('getSalas', '');
    });

    btnMensagem.addEventListener("click", () => {
        let mensagemEnvio = {
                'Mensagem': inputMensagem.value,
                'Hora': '',
                'Usuario': document.getElementById('inputUsuario').value
            };

        socket.emit('limpaDigitando');

        socket.emit('enviaMensagem', mensagemEnvio, (callback) => {
            inputMensagem.value = '';
            todasMensagens.insertAdjacentHTML('beforeend', (retornaMensagem(callback, true)));
            todasMensagens.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
        });
    });

    inputUsuario.addEventListener("keyup", (e) => {
        if (e.key==="Enter") {
            document.getElementById('btnEntrar').dispatchEvent(new Event("click"));
        }
    });

    inputMensagem.addEventListener("keyup", (e) => {
        clearTimeout(timeDigitando);
        socket.emit('digitando');
        limpaDigitando();
        if (e.key==="Enter" && inputMensagem.value.trim() !== "") {
            document.getElementById('btnMensagem').dispatchEvent(new Event("click"));
        }
    });

    btnVideo.addEventListener("click", () => {
        inicializaVideo();
    });

    socket.on('retornoSalas', (salas) => {
        let listaSala = document.getElementById('listaSalas');
        listaSala.innerHTML = '';
        salas.forEach(function (sala) {
            let htmlSala =
                '<li class="list-group-item d-flex justify-content-between align-items-center salaChat" data-sala="'+sala+'">\n' +
                '    <strong><i class="fa-regular fa-comments .icon-sala" aria-hidden="true"></i> '+sala+'</strong>\n' +
                '    <span id= "qtd-user-'+sala+'" class="badge bg-primary rounded-pill">0</span>\n' +
                '</li>';
            listaSala.insertAdjacentHTML('beforeend', htmlSala);
        });
        Array.from(document.getElementsByClassName("salaChat")).forEach(function(element) {
            element.addEventListener("click", entrarNaSala);
        });
    });

    socket.on('mensagem', (mensagem) => {
        todasMensagens.insertAdjacentHTML('beforeend', retornaMensagem(mensagem));
        todasMensagens.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
    });

    socket.on('enviaDigitando', (digitando) => {
        if (document.getElementById('digitando-'+digitando.Usuario) == null) {
            todasMensagens.insertAdjacentHTML('beforeend', retornaMensagem(digitando, false, true));
            todasMensagens.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
        }
    });

    function entrarNaSala() {
        let sala = this.dataset.sala,
            usuarioLogado = inputUsuario.value;

        todasMensagens.innerHTML = '';
        socket.emit('login', {'nome': usuarioLogado, 'sala': sala}, (mensagens) => {
            let msgsSalvas = '',
                groupMensagens = mensagens.map(x => {return {'data': x._id, 'mensagens': x.data}});

            groupMensagens.forEach(x => {
                msgsSalvas += '<li><div class="separator text-muted">'+(x.data === null ? 'Mensagens antigas' : x.data)+'</div></li>';
                x.mensagens.forEach(y => {
                    msgsSalvas +=  retornaMensagem({
                        'Usuario': y.usuario,
                        'Mensagem': y.mensagem,
                        'Hora': y.hora
                    }, (y.usuario === usuarioLogado));
                })
            });

            todasMensagens.innerHTML = msgsSalvas
            todasMensagens.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
        });
        socket.emit('getUsers', sala);
        document.getElementById('salaConectada').innerHTML = '<i aria-hidden="true" class="fas fa-globe-americas fa-lg online"></i>\n' +
            '                        <span> ' + sala + '</span>';
    }

    function limpaDigitando() {
        timeDigitando = window.setTimeout(
            function () {
                socket.emit('limpaDigitando');
            }, 3000);
    }

    function inicializaVideo() {
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        }).then((streamVideo) => {
            window.localStream = streamVideo;
            retornaVideoFrame('teste')
            adicionaVideo($('#meuVideo' + 'teste'), streamVideo);

            peer.on("call", (call) => {
                call.answer(streamVideo);
                retornaVideoFrame('teste')
                const video = $('#meuVideoteste');
                call.on("stream", (userVideoStream) => {
                    adicionaVideo(video, userVideoStream);
                });
            });

            socket.on("video-chat", (usuario) => {
                conectarNovoUsuario(usuario, streamVideo);
            });
        })
    }

    const conectarNovoUsuario = (idUsuario, stream) => {
        const call = peer.call(idUsuario, stream);
        retornaVideoFrame('teste1')
        const video = $('#meuVideoteste1');
        call.on("stream", (userVideoStream) => {
            adicionaVideo(video, userVideoStream);
        });
    };
});

socket.on('enviaLimpaDigitando', (usuario) => {
    if (document.getElementById('digitando-'+usuario) !== null) {
        document.getElementById('digitando-' + usuario).remove();
    }
});

socket.on('retornoUsers', (users) => {
    if (users.length > 0) {
        let sala = users[0].sala;
        document.getElementById('qtd-user-' + sala).innerText = users.length;
    }
});

socket.io.on("error", () => {
    document.getElementById('msg-connection').innerHTML =
        '<div role="alert" class="alert alert-danger text-center border-avisos">Perda de conexão com o servidor</div>';
});

socket.io.on("reconnect_attempt", (attempt) => {
    document.getElementById('msg-connection').innerHTML =
        '<div role="alert" class="alert alert-warning text-center border-avisos">Tentativa de reconexão '+attempt+'/'+qtdReconnection+'</div>';
});

socket.io.on("reconnect", () => {
    document.getElementById('msg-connection').innerHTML =
        '<div role="alert" class="alert alert-success text-center border-avisos">Conexão reestabelecida</div>';

    setTimeout(() => {document.getElementById('msg-connection').innerHTML = ''}, 3000);
});

function retornaMensagem(mensagem, self = false, digitando = false) {
    let html,
        id = 'id="digitando-'+mensagem.Usuario+'"';
    if (!self) {
        html =
            '<li class="left clearfix"' + (digitando ? id : '') +'>' +
            '    <span class="chat-img pull-left">\n' +
            '         <img alt="User Avatar" class="img-circle"\n' +
            '                                 src="http://placehold.it/50/55C1E7/fff&amp;text=L">\n' +
            '    </span>\n' +
            '    <div class="chat-body clearfix">\n' +
            '        <div class="header">\n' +
            '            <strong class="primary-font">'+mensagem.Usuario+'</strong> <small class="text-muted">\n' +
            '            ' + ((!digitando) ? '<i class="fa-regular fa-clock" aria-hidden="true"></i>' + mensagem.Hora + '</small>' : '') + '\n' +
            '        </div>\n' +
            '        <p class="msg-left">'+mensagem.Mensagem+'</p>\n' +
            '    </div>\n' +
            '</li>';
    } else {
        html =
            '<li class="right clearfix"><span class="chat-img pull-right">\n' +
            '                            <img alt="User Avatar" class="img-circle"\n' +
            '                                 src="http://placehold.it/50/FA6F57/fff&amp;text=R">\n' +
            '                        </span>\n' +
            '    <div class="chat-body pull-right clearfix">\n' +
            '        <div class="header text-end">\n' +
            '            <small class="text-muted">'+mensagem.Hora+'<i class="fa-regular fa-clock" aria-hidden="true"></i></small>\n' +
            '            <strong style="margin-left: 5px;" class="primary-font">'+mensagem.Usuario+'</strong>\n' +
            '        </div>\n' +
            '        <p class="pull-right msg-right">'+mensagem.Mensagem+' </p>\n' +
            '    </div>\n' +
            '</li>';
    }
    return html;
}

function adicionaVideo(elementoVideo, myVideoStream) {
    document.getElementById(elementoVideo.attr('id')).srcObject = myVideoStream;
    document.getElementById(elementoVideo.attr('id')).addEventListener("loadedmetadata", () => {
        document.getElementById(elementoVideo.attr('id')).play();
    });
}


function dragElement(elementoPai,elementoFilho) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (elementoFilho) {
        elementoFilho.onmousedown = dragMouseDown;
    } else {
        elementoPai.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e.preventDefault();

        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elementoPai.style.top = (elementoPai.offsetTop - pos2) + "px";
        elementoPai.style.left = (elementoPai.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function retornaVideoFrame(id){
    let dados =  '<div id="divPai'+id+'" class="dragPai">'+
                    '<video class="dragFilho" id="meuVideo'+id+'"></video>'+
                    '<p>teste'+id+'</p>'+
                '</div>';
    $('#inicio').append(dados);
    dragElement(document.getElementById('divPai'+id),document.getElementById('meuVideo'+id));
}