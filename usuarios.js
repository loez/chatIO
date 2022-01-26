const usuarios = [{'id' : '', 'nome': '', 'sala': 'teste1', 'salaOld': undefined},{'id' : '', 'nome': '', 'sala': 'teste2', 'salaOld': undefined},{'id' : '', 'nome': '', 'sala': 'teste3', 'salaOld': undefined}]

const adicionaUsuario = (id, nome, sala) => {
    const existeUsuario = usuarios.find(user => user.id === id)
    let usuario;

    if(existeUsuario){
        existeUsuario.salaOld = existeUsuario.sala;
        existeUsuario.sala = sala;
        usuario = existeUsuario;
        return { usuario }
    }

    usuario  = {id, nome, sala}
    usuarios.push(usuario)
    return { usuario }
}

const getUsuario = id => {
    return usuarios.find(user => user.id === id)
}

const deletaUsuario = (id) => {
    const index = usuarios.findIndex((user) => user.id === id);
    if (index !== -1) return usuarios.splice(index, 1)[0];
}

const getUsuariosSala = (room) => usuarios.filter(user => user.sala === room).filter(user => user.id !== '');

const getSalas = () => [...new Set(usuarios.map(x=> x.sala))];

module.exports = { adicionaUsuario, getUsuario, deletaUsuario, getUsuariosSala, getSalas }