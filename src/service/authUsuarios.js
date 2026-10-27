const bcrypt = require('bcryptjs');
import {bcrypt} from 'bcryptjs';
import {Usuario} from '../models/usuario.js';


async function registrar({ nombre, correo, contrasena }) {
// ... validación y control de correo duplicado ...
const passwordHash = await bcrypt.hash(contrasena, 10);
const usuario = new Usuario({ nombre, correo, passwordHash });
return this.userRepo.insert(usuario.toJSON());
}


async function iniciarSesion(correo, contrasena) {
const data = await this.userRepo.findOne((u) => u.correo === correo);
const valid = data !== null
&& (await bcrypt.compare(contrasena , data.passwordHash));
if (!valid)
throw new AuthenticationError('Correo o contraseña incorrectos');
return User.fromJSON(data);
}