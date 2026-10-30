import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {requireAuth} from './middleware/autentificacion.js'
import {crearUsuariosRoutes} from './routes/usuariosRoutes.js'
import { RepositorioUsuarios } from '../src/models/repositorioUsuarios.js';


const usuarios = new RepositorioUsuarios();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

  const app = express();
  app.use(express.json());

  app.use(
    session({
      name: 'clase08.sid',
      secret: 'secret',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 1000 },
    }),
  );

    app.use((req, res, next) => {
    req.user = req.session.userId ? usuarios.buscarUsuarioPorCorreo(req.session.userId) : null;
    next();
  });

  app.use('/api/usuarios', crearUsuariosRoutes(usuarios));


  app.get('/api/me', requireAuth, (req, res) => res.json(usuarios.toPublic(req.user)));
  app.use(express.static(path.join(__dirname,"..", 'public')));
  export default app;

