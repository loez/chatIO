const mongoose = require('mongoose');

const mensagensModel = mongoose.Schema({
    sala: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sala'
    },
    usuario: {
        type: String,
        required: '{PATH} is required!'
    },
    mensagem: {
        type: String,
        required: '{PATH} is required!'
    },
    data: {
        type: String
    },
    hora: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Mensagem', mensagensModel);