const mongoose = require('mongoose');

const salaModel = mongoose.Schema({
    nome: {
        type: String,
        required: '{PATH} is required!'
    },
    Mensagens: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'mensagem' }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Sala', salaModel);