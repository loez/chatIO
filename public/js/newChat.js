let timeDigitando,
    timeLembreteImagem,
    imagemChat = null,
    countMsgs = 0,
    speech = window.speechSynthesis,
    voicesIdioma = [],
    listVoices = [];

const qtdReconnection = 15;
const socket = io("/", {reconnectionAttempts: qtdReconnection});
const scroll = {behavior: "smooth", block: "end", inline: "end"};

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
        todasMensagens = document.getElementById('todasMensagens'),
        myVideo = document.createElement("video"),
        preview = document.getElementById('img-preview'),
        btnCloseImagem = document.getElementById('btn-close-imagem');

    btnEntrar.addEventListener("click", () => {
        if (inputUsuario.value === "") {
            return false;
        }

        inputUsuario.readOnly = true;
        socket.emit('getSalas', '');
    });

    btnMensagem.addEventListener("click", () => {
        if ((inputMensagem.value.trim() !== "" || imagemChat !== null)) {
            clearTimeout(timeLembreteImagem);
            let mensagemEnvio = {
                'Mensagem': inputMensagem.value,
                'Usuario': document.getElementById('inputUsuario').value
            };

            if (imagemChat !== null) {
                mensagemEnvio["Imagem"] = imagemChat;
                preview.removeAttribute('src');
                preview.classList.add('d-none');
                document.getElementById('chat-container').classList.remove('img-preview');
                imagemChat = null;
            }

            socket.emit('limpaDigitando');

            socket.emit('enviaMensagem', mensagemEnvio, (callback) => {
                inputMensagem.value = '';
                insereMensagemChat(todasMensagens, callback, true);
            });
        } else {
            animateCSS('#inputMensagem', 'shake');
        }
    });

    inputUsuario.addEventListener("keyup", (e) => {
        if (e.key==="Enter") {
            document.getElementById('btnEntrar').dispatchEvent(new Event("click"));
        }
    });

    inputMensagem.addEventListener("keyup", (e) => {
        clearTimeout(timeLembreteImagem);
        clearTimeout(timeDigitando);
        socket.emit('digitando');
        limpaDigitando();
        if (e.key==="Enter") {
            document.getElementById('btnMensagem').dispatchEvent(new Event("click"));
        }
    });

    btnVideo.addEventListener("click", () => {
        inicializaVideo();
    });

    btnCloseImagem.addEventListener("click", () => {
        clearTimeout(timeLembreteImagem);
        preview.removeAttribute('src');
        preview.classList.add('d-none');
        btnCloseImagem.classList.add('d-none');
        document.getElementById('chat-container').classList.remove('img-preview');
        imagemChat = null;
    });

    document.getElementById('file').addEventListener('change', function() {
        const reader = new FileReader();
        reader.onload = function() {
            imagemChat = this.result.replace(/.*base64,/, '');
        };
        reader.readAsDataURL(this.files[0]);
        preview.src = URL.createObjectURL(event.target.files[0]);
        preview.classList.remove('d-none');
        btnCloseImagem.classList.remove('d-none');
        document.getElementById('chat-container').classList.add('img-preview');
        timeLembreteImagem = setTimeout(() => { animateCSS('#btnMensagem', 'shake'); }, 3000);
    }, false);

    socket.on('retornoSalas', (salas) => {
        let listaSala = document.getElementById('listaSalas');
        listaSala.innerHTML = '';
        salas.forEach(function (sala) {
            let htmlSala =
                '<li class="list-group-item d-flex justify-content-between align-items-center salaChat" data-sala="'+sala+'">\n' +
                '    <strong><i class="fa-regular fa-comments .icon-sala" aria-hidden="true"></i> '+sala+'</strong>\n' +
                '    <span id= "qtd-user-'+sala+'" class="badge bg-primary rounded-pill">0</span>\n' +
                '</li>';
            listaSala.insertAdjacentHTML("beforeend", htmlSala);
        });
        Array.from(document.getElementsByClassName("salaChat")).forEach(function(element) {
            element.addEventListener("click", entrarNaSala);
        });
    });

    socket.on('mensagem', (mensagem) => {
        insereMensagemChat(todasMensagens, mensagem);
    });

    socket.on('enviaDigitando', (digitando) => {
        if (document.getElementById('digitando-'+digitando.Usuario) == null) {
            insereMensagemChat(todasMensagens, digitando, false, true);
        }
    });

    function entrarNaSala() {
        let sala = this.dataset.sala,
            usuarioLogado = inputUsuario.value;

        todasMensagens.innerHTML = '';
        socket.emit('login', {'nome': usuarioLogado, 'sala': sala}, (mensagens) => {
            popularVoices();
            let msgsSalvas = '',
                groupMensagens = mensagens.map(x => {return {'data': x._id, 'mensagens': x.data}});

            groupMensagens.forEach(x => {
                msgsSalvas += '<li><div class="separator text-muted">'+(x.data === null ? 'Mensagens antigas' : x.data)+'</div></li>';
                x.mensagens.forEach(y => {
                    insereMensagemChat(todasMensagens, {
                        'Usuario': y.usuario,
                        'Mensagem': y.mensagem,
                        'Hora': y.hora
                    }, (y.usuario === usuarioLogado));
                })
            });
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
        let myVideoStream;
        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        }).then((streamVideo) => {
            myVideoStream = streamVideo;
            //retornaVideoFrame('teste');
            adicionaVideo(myVideo, streamVideo);

            peer.on("call", (call) => {
                call.answer(streamVideo);
                //retornaVideoFrame('teste')
                const videoCall = document.createElement("video");
                call.on("stream", (userVideoStream) => {
                    adicionaVideo(videoCall, userVideoStream);
                });
            });

            socket.on("video-chat", (usuario) => {
                conectarNovoUsuario(usuario, streamVideo);
            });
        })
    }

    function adicionaVideo(elementoVideo, myVideoStream) {
        elementoVideo.srcObject = myVideoStream;
        elementoVideo.addEventListener("loadedmetadata", () => {
            elementoVideo.play();
            todasMensagens.append(elementoVideo);
        });
    }

    const conectarNovoUsuario = (idUsuario, stream) => {
        const call = peer.call(idUsuario, stream);
        const video =  document.createElement("video");
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
    document.getElementById('chat-container').classList.add('alert-connection');
});

socket.io.on("reconnect_attempt", (attempt) => {
    document.getElementById('msg-connection').innerHTML =
        '<div role="alert" class="alert alert-warning text-center border-avisos">Tentativa de reconexão '+attempt+'/'+qtdReconnection+'</div>';
    document.getElementById('chat-container').classList.add('alert-connection');
});

socket.io.on("reconnect", () => {
    document.getElementById('msg-connection').innerHTML =
        '<div role="alert" class="alert alert-success text-center border-avisos">Conexão reestabelecida</div>';
    document.getElementById('chat-container').classList.add('alert-connection');

    setTimeout(() => {
        document.getElementById('msg-connection').innerHTML = '';
        document.getElementById('chat-container').classList.remove('alert-connection');
        }, 3000);
});

function retornaMensagem(mensagem, self = false, digitando = false) {
    let html,
        id = 'id="digitando-'+mensagem.Usuario+'"',
        img = '';

    if (mensagem.Imagem) {
        img = '<img class="chat-imagem" src="data:image/jpg;base64,'+mensagem.Imagem+'" title="Teste" alt="teste"/>';
    }

    if (!self) {
        html =
            '<li class="left clearfix"' + (digitando ? id : '') +'>' +
            '    <span class="chat-img pull-left">\n' +
            '         <img alt="User Avatar" class="img-circle" src="http://placehold.it/50/55C1E7/fff&amp;text=L">\n' +
            '    </span>\n' +
            '    <div class="chat-body clearfix">\n' +
            '        <div class="header">\n' +
            '            <strong class="primary-font txt-user">'+mensagem.Usuario+'</strong>\n' +
            '            ' + ((!digitando) ? '<small class="text-muted txt-hora"><i class="fa-regular fa-clock" aria-hidden="true"></i>' + mensagem.Hora + '</small>' : '') + '\n' +
            '        </div>\n' +
            '        <div class="group-msg-left">\n' +
            '             <div class="msg-left">\n' +
            '                 '+img+'\n' +
            '                 <p class="txt-mensagem">'+mensagem.Mensagem+'</p>\n' +
            '             </div>\n' +
            '            '+retornaMenuDropDown(countMsgs++, true)+'\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</li>';
    } else {
        html =
            '<li class="right clearfix">' +
            '    <span class="chat-img pull-right">\n' +
            '        <img alt="User Avatar" class="img-circle" src="http://placehold.it/50/FA6F57/fff&amp;text=R">\n' +
            '    </span>\n' +
            '    <div class="chat-body pull-right clearfix">\n' +
            '        <div class="header text-end">\n' +
            '            <small class="text-muted txt-hora">'+mensagem.Hora+'<i class="fa-regular fa-clock" aria-hidden="true"></i></small>\n' +
            '            <strong style="margin-left: 5px;" class="primary-font txt-user">'+mensagem.Usuario+'</strong>\n' +
            '        </div>\n' +
            '        <div class="group-msg-right">\n' +
            '            <div class="msg-right">\n' +
            '               '+img+'\n' +
            '               <p class="txt-mensagem">'+mensagem.Mensagem+' </p>\n' +
            '            </div>\n' +
            '            '+retornaMenuDropDown(countMsgs++, true)+'\n' +
            '        </div>\n' +
            '    </div>\n' +
            '</li>';
    }
    return html;
}

function popularVoices(idioma = "pt-BR") {
    listVoices = speech.getVoices();
    voicesIdioma = listVoices.filter(x => x.lang === idioma).map(y => {return '<li class="li-dropdown-menu"><a class="dropdown-item item-dropdown-menu ler-texto" href="#" data-name="'+y.name+'">'+y.name+'</a></li>'});
}

function lerTexto(event) {
    let voice = event.currentTarget.dataset.name,
        elementoMensagem = event.currentTarget.offsetParent.parentElement.parentElement.parentElement,
        user = elementoMensagem.getElementsByClassName("txt-user")[0].textContent,
        hora = elementoMensagem.getElementsByClassName("txt-hora")[0].textContent,
        mensagem = elementoMensagem.getElementsByClassName("txt-mensagem")[0].textContent;
    let utterThis = new SpeechSynthesisUtterance(user + " as " + hora + " escreveu: " + mensagem);
    utterThis.voice = listVoices.find(x => x.name === voice);
    speech.speak(utterThis);
}

function retornaMenuDropDown(id, right = false) {
    let direction = right ? 'dropend' : 'dropstart';
    return '<div class="'+direction+'">\n' +
        '  <i id="dropdownMenuChat'+id+'" data-bs-toggle="dropdown" aria-expanded="false" class="fa-solid fa-ellipsis-vertical menu-dropdown"></i>\n' +
        '  <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton'+id+'" style="">\n' +
        '      '+voicesIdioma.join('\n')+'\n' +
        '  </ul>\n' +
        '</div>';
}

function insereMensagemChat(todasMensagens, mensagem, self = false, digitando = false) {
    todasMensagens.insertAdjacentHTML('beforeend', (retornaMensagem(mensagem, self, digitando)));
    todasMensagens.scrollIntoView(scroll);

    document.querySelectorAll('.ler-texto').forEach(item => {

        if (item.dataset.evento === undefined) {
            item.setAttribute("data-evento", "click");
            item.addEventListener('click', event => {
                lerTexto(event);
            });
        }
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
    document.getElementById('msg-connection').innerHTML =
        '<div id="divPai' + id + '" class="dragPai">' +
        '   <video class="dragFilho" id="meuVideo' + id + '"></video>' +
        '   <p>teste' + id + '</p>' +
        '</div>';
    dragElement(document.getElementById('divPai'+id),document.getElementById('meuVideo'+id));
}

const animateCSS = (element, animation) => {
    const node = document.querySelector(element);

    node.classList.add(animation);

    function handleAnimationEnd(event) {
        event.stopPropagation();
        node.classList.remove(animation);
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
}