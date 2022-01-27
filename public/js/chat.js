jQuery(function () {
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
        let mensagemAppend = retornaMensagem(mensagem);
        $('#todasMensagens').get(0).insertAdjacentHTML('beforeend', mensagemAppend);
    });

    socket.on('retornoSalas', (salas) => {
        let listaSala = $('#listaSalas');
        listaSala.html('');
        salas.forEach(function (valor) {
            let sala =
                '<a href="#sala-'+valor+'" class="list-group-item salasChat" data-sala="'+valor+'" data-toggle="collapse">\n' +
                '    <i class="fas fa-chevron-right"></i> '+valor+'\n' +
                '</a>\n' +
                '<div class="list-group collapse" id="sala-'+valor+'"></div>';
            listaSala.append(sala);
        });
    });

    socket.on('retornoUsers', (users) => {
        if (users.length > 0) {
            let sala = users[0].sala;
            $('#sala-' + sala).html(users.map(x => {
                return '<div class="list-group-item list-user"><small class="item-user">' + x.nome + '</small></div>';
            }));
        }
    });

    $(document).on('click', '.salasChat', function () {
        let sala = $(this).data('sala');
        socket.emit('login', {'nome': $('#inputUsuario').val(), 'sala': sala});
        socket.emit('getUsers', sala);
        $('#salaConectada').html('<i class="fas fa-globe-americas fa-lg text-success"></i> Sala: ' + sala);
    });

    $('#btnMensagem').on('click', function () {
        let inputMensagem = $('#inputMensagem'),
            mensagemEnvio = {
                'Mensagem': inputMensagem.val(),
                'Hora': '',
                'Usuario': $('#inputUsuario').val()
            };

        socket.emit('enviaMensagem', mensagemEnvio, (callback) => {
            inputMensagem.val('');
            $('#todasMensagens').get(0).insertAdjacentHTML('beforeend', retornaMensagem(callback, true));
        });
    });

    $('#inputUsuario').on('keyup', function(e) {
        if (e.key==="Enter") {
            $('#btnEntrar').trigger('click');
        }
    });

    $('#inputMensagem').on('keyup', function(e) {
        if (e.key==="Enter") {
            $('#btnMensagem').trigger('click');
        }
    });

    $(document).on('click', '.list-group-item', function() {
        $('.fas', this)
            .toggleClass('fa-chevron-right')
            .toggleClass('fa-chevron-down');
    });
});

function retornaMensagem(mensagem, self = false) {
    let html;
    if (!self) {
        html =
            '<li class="chat-left">\n' +
            '    <div class="chat-avatar">\n' +
            '        <i class="fas fa-user-circle" aria-hidden="true"></i>\n' +
            '        <div class="chat-name">'+mensagem.Usuario+'</div>\n' +
            '    </div>\n' +
            '    <div class="chat-text">'+mensagem.Mensagem+'</div>\n' +
            '    <div class="chat-hour">'+mensagem.Hora+' <span class="fa fa-check-circle"></span></div>\n' +
            '</li>'
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