
import { createApp } from './src/app.js';
import { RepositorioUsuarios } from './src/models/repositorioUsuarios.js';
const repositorioUsuarios = new RepositorioUsuarios()
  const usuarios = repositorioUsuarios;
  createApp({ usuarios }).listen(3000, () => {
    console.log('http://localhost:3000  ·  tomas@ejemplo.test / lucia@ejemplo.test  ·  contraseña: clase08');
  });
;