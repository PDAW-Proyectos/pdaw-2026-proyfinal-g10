import {RepositorioUsuarios} from "../models/repositorioUsuarios.js"
export  function crearUsuario({nombre,correo,contrasena}) {

   const existente =  RepositorioUsuarios.buscarUsuarioPorCorreo(correo)
   if (existente) throw new Error("El usuario ya existe")   

return  RepositorioUsuarios.agregarUsuario({nombre,correo,contrasena})
}



