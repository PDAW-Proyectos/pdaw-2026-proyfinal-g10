import {crearUsuario} from  "../service/usuariosService.js"

 export  function crearUsuario(req,res) {
    try {
        const user = crearUsuario({
            nombre: req.body.nombre,
            correo: req.body.correo,
            contrasena: req.body.contrasena
        })
        return res.status(200).json(user)
    }catch(error){
        return res.status(400).json({ error: error.messages });

    }

}