const mongoose = require('mongoose');
const { Sala, Mensagens} = require('./models');

mongoose.connect('mongodb://localhost/ChatIO', {useNewUrlParser: true, useUnifiedTopology: true}, function resposta() {
    // This is intentional
    });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log("Conectado"));

function SalvaSala(sala) {
    Sala.findOne({'nome': sala}, function (err, retornoSala) {
        if (retornoSala === null) {
            const newSala = new Sala({
                    _id: new mongoose.Types.ObjectId(),
                    nome: sala
                }
            );

            newSala.save()
                .then(() => {
                    console.info('Sala %s salva', sala);
                })
                .catch((error) => {
                    console.error('Erro ao salvar sala %s', error);
                });
        } else {
            console.warn('Sala %s já salva', sala);
        }
    });
}

function SalvaMensagem(sala, mensagem) {
    Sala.findOne({'nome': sala}, function (err, retornoSala) {
        if (retornoSala !== null) {
            const newMensagem = new Mensagens({
                sala: retornoSala._id,
                usuario: mensagem.Usuario,
                mensagem: mensagem.Mensagem,
                hora: mensagem.Hora
            });

            newMensagem.save()
                .then(() => {
                    console.info('Mensagem %s salva', mensagem.Hora);
                })
                .catch((error) => {
                    console.error('Erro ao mensagem sala %s', error);
                });
        } else {
            console.error('Sala %s não encontrada', sala);
        }
    });
}

const RetornaMensagens = (sala) => new Promise((success) => {
    Sala.aggregate([
        { '$match' : {
                'nome': sala
            }
        },
        { '$lookup': {
            'from': 'mensagens',
            'localField': '_id',
            'foreignField': 'sala',
            'as': 'Mensagens'
        }}]).exec().then(r => success(r));
});

module.exports = {
    SalvaSala,
    SalvaMensagem,
    RetornaMensagens
}