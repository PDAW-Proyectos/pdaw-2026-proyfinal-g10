import express from 'express';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {requireAuth} from './middleware/autentificacion.js'
import usuariosRoutes from './routes/usuariosRoutes.js'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const regenerate = (req) => new Promise((ok, fail) => req.session.regenerate((e) => (e ? fail(e) : ok())));
const destroy = (req) => new Promise((ok, fail) => req.session.destroy((e) => (e ? fail(e) : ok())));

export function createApp({ usuarios, secret = 'secreto-solo-para-desarrollo', production = false }) {
  const app = express();
  if (production) app.set('trust proxy', 1);
  app.use(express.json());
  app.use(
    session({
      name: 'clase08.sid',
      secret, // firma la cookie: impide que el cliente la falsifique
      resave: false,
      saveUninitialized: false, // no crear sesiones para visitantes anónimos
      cookie: { httpOnly: true, sameSite: 'lax', secure: production, maxAge: 60 * 60 * 1000 },
    }),
  );

  // AUTENTICACIÓN: ¿quién hace la solicitud?
    app.use((req, res, next) => {
    req.user = req.session.userId ? usuarios.findById(req.session.userId) : null;
    next();
  });

  app.post('/api/login', async (req, res) => { 
    const usuario = await usuarios.verify(req.body?.correo ?? '', req.body?.contrasena ?? '');
    console.log(await usuarios.verify(req.body?.correo ?? '', req.body?.contrasena ?? ''))
    console.log(usuario,'login')
    if (!usuario) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    await regenerate(req);
    req.session.userId = usuario.correo;
    res.json(usuarios.toPublic(usuario));
  });

  app.post('/api/logout', requireAuth, async (req, res) => {
    await destroy(req);
    res.clearCookie('clase08.sid').status(204).end();
  });

   app.post('/api/signIn', async (req, res) => {
    const usuario = req.body
    if(usuarios.buscarUsuarioPorCorreo(usuario.correo))return res.status(401).json({ error: 'Correo en uso' });
    await regenerate(req);
    req.session.userId = usuario.correo;
    res.json(usuario);
  });
  app
  app.use('/api/usuarios', usuariosRoutes)
  //app.use('/api/publicaciones', requireAuth,  publicacionesRoutes),


  app.get('/api/me', requireAuth, (req, res) => res.json(usuarios.toPublic(req.user)));
  app.use(express.static(path.join(__dirname,"..", 'public')));
  return app;
}
