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
        $("a[id^='salas']").remove();
        salas.forEach(function (valor, index) {
            $('<a></a>').text(valor).attr('id', 'salas' + index).attr('data-sala', valor).addClass('list-group-item').addClass('salasChat').addClass('list-group-item-action').attr('href', '#').appendTo('#listaSalas');
        })
    });

    socket.on('retornoUsers', (users) => {
        console.log(users);
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