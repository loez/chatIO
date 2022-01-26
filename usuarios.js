const usuarios = [{'id' : '', 'nome': '', 'sala': 'teste1'},{'id' : '', 'nome': '', 'sala': 'teste2'},{'id' : '', 'nome': '', 'sala': 'teste3'}]

const adicionaUsuario = (id, nome, sala) => {
    const existeUsuario = usuarios.find(user => user.id === id)

    if(existeUsuario){
        existeUsuario.sala = sala;
        let usuario = existeUsuario;
        return { usuario }
    }

    const usuario  = { id, nome, sala }
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