let timeDigitando;

jQuery(function () {
    $.fn.extend({
        autoScroll: function () {
            return this.each(function () {
                $(this).animate({ scrollTop: $(this).prop("scrollHeight") }, 'slow');
            });
        }
    });
    const socket = io();

    $('#btnEntrar').on('click', function () {
        let inputUsuario = $('#inputUsuario');
        if (inputUsuario.val() === "") {
            return false;
        }
        inputUsuario.prop('readonly', true);
        socket.emit('getSalas', '');
    });

    socket.on('mensagem', (mensagem) => {
        $('#todasMensagens').append(retornaMensagem(mensagem)).autoScroll();
    });

    socket.on('enviaDigitando', (digitando) => {
        if (!$('#digitando-'+digitando.Usuario).length) {
            $('#todasMensagens').append(retornaMensagem(digitando, false, true)).autoScroll();
        }
    });

    socket.on('enviaLimpaDigitando', (usuario) => {
        $('#digitando-'+usuario).remove();
    });

    socket.on('retornoSalas', (salas) => {
        let listaSala = $('#listaSalas');
        listaSala.html('');
        salas.forEach(function (sala) {
            let htmlSala =
                '<div class="card mb-0">\n' +
                '    <div class="card-header p-1" id="heading'+sala+'">\n' +
                '        <h2 class="mb-0">\n' +
                '            <button class="btn btn-link salasChat" type="button" data-toggle="collapse" data-target="#collapse'+sala+'" data-sala="'+sala+'" aria-expanded="true" aria-controls="collapse'+sala+'">\n' +
                '                <i aria-hidden="true" class="far fa-comment-dots"></i> ' + sala +
                '            </button>\n' +
                '        </h2>\n' +
                '    </div>\n' +
                '    <div id="collapse'+sala+'" class="collapse" aria-labelledby="heading'+sala+'" data-parent="#listaSalas">\n' +
                '        <div class="card-body p-0">\n' +
                '            <ul class="list-group list-group-flush">\n' +
                '            </ul>\n' +
                '        </div>\n' +
                '    </div>\n' +
                '</div>';
            listaSala.append(htmlSala);
        });
    });

    socket.on('retornoUsers', (users) => {
        if (users.length > 0) {
            let sala = users[0].sala;
            $('#collapse' + sala).find('.card-body').find('ul').empty().append(users.map(x => {
                return '<li class="list-group-item"><i class="fas fa-user fa-sm" aria-hidden="true"></i> ' + x.nome + '</li>';
            }));
        }
    });

    $(document).on('click', '.salasChat', function () {
        let sala = $(this).data('sala'),
            usuarioLogado = $('#inputUsuario').val();
        socket.emit('login', {'nome': usuarioLogado, 'sala': sala}, (mensagens) => {
            let htmlMensagem = mensagens.map(x => {
                return retornaMensagem({ 'Usuario': x.usuario, 'Mensagem': x.mensagem, 'Hora': x.hora}, (x.usuario === usuarioLogado))
            })
            $('#todasMensagens').html(htmlMensagem);
        });
        socket.emit('getUsers', sala);
        $('#salaConectada').html('<i class="fas fa-globe-americas fa-lg text-success" aria-hidden=true></i> Sala: ' + sala);
    });

    $('#btnMensagem').on('click', function () {
        let inputMensagem = $('#inputMensagem'),
            mensagemEnvio = {
                'Mensagem': inputMensagem.val(),
                'Hora': '',
                'Usuario': $('#inputUsuario').val()
            };

        socket.emit('limpaDigitando');

        socket.emit('enviaMensagem', mensagemEnvio, (callback) => {
            inputMensagem.val('');
            $('#todasMensagens').append(retornaMensagem(callback, true)).autoScroll();
        });
    });

    $('#inputUsuario').on('keyup', function(e) {
        if (e.key==="Enter") {
            $('#btnEntrar').trigger('click');
        }
    });

    $('#inputMensagem').on('keyup', function(e) {
        clearTimeout(timeDigitando);
        socket.emit('digitando');
        limpaDigitando();
        if (e.key==="Enter" && $('#inputMensagem').val().trim() !== "") {
            $('#btnMensagem').trigger('click');
        }
    });

    function limpaDigitando() {
        timeDigitando = window.setTimeout(
            function () {
                socket.emit('limpaDigitando');
            }, 3000);
    }
});

function retornaMensagem(mensagem, self = false, digitando = false) {
    let html,
        id = 'id="digitando-'+mensagem.Usuario+'"';
    if (!self) {
        html =
            '<li class="chat-left" ' + (digitando ? id : '') +'>\n' +
            '    <div class="chat-avatar">\n' +
            '        <i class="fas fa-user-circle" aria-hidden="true"></i>\n' +
            '        <div class="chat-name">'+mensagem.Usuario+'</div>\n' +
            '    </div>\n' +
            '    <div class="chat-text">'+mensagem.Mensagem+'</div>\n';
            if (!digitando) {
                html += '    <div class="chat-hour">' + mensagem.Hora + ' <span class="fa fa-check-circle"></span></div>\n';
            }
        html += '</li>'
    } else {
        html =
            '<li class="chat-right">\n' +
            '    <div class="chat-hour">'+mensagem.Hora+' <span class="fa fa-check-circle"></span></div>\n' +
            '    <div class="chat-text">'+mensagem.Mensagem+'</div>\n' +
            '    <div class="chat-avatar">\n' +
            '        <i class="far fa-user-circle" aria-hidden="true"></i>\n' +
            '        <div class="chat-name">'+mensagem.Usuario+'</div>\n' +
            '    </div>\n' +
            '</li>';
    }
    return html;
}