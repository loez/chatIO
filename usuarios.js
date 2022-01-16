const usuarios = [{'login' : '','sala': 'teste1'},{'login' : '','sala': 'teste2'},{'login' : '','sala': 'teste3'}]

const adicionaUsuario = (id, nome, sala) => {
    const existeUsuario = usuarios.find(user => user.id === id)

    if(existeUsuario){
        return {existeUsuario}
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

const getUsuariosSala = (room) => usuarios.filter(user => user.sala === room)

const getSalas = () => [...new Set(usuarios.map(x=> x.sala))];

module.exports = { adicionaUsuario, getUsuario, deletaUsuario, getUsuariosSala, getSalas }