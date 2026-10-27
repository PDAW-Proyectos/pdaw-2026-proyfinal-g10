import express from 'express';
//import session from 'express-session';
//import { createApiRouter } from './api.js';
//import { requestLogger, createErrorHandler, notFound } from './middleware.js';  
let app
export function createApp({ config, logger, services }) {
const app = express();
//app.use(requestLogger(logger));        
// 1. registro de cada solicitud
app.use(express.json({ limit: '100kb' })); // 2. parseo del cuerpo
//app.use(session({ /* ... */ }));       
// 3. sesión
app.use('/api', createApiRouter({ services }));  // 4. rutas de la API
app.use(express.static('public'));     
//app.use(notFound);                     
return app;                            
}
//app.use(createErrorHandler(logger))
/*
function parseListQuery(query) {
const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
const raw = Number.parseInt(query.limit, 10) || 10;
const limit = Math.min(50, Math.max(1, raw));
const available = query.available === undefined
? undefined
: query.available === 'true';
return { q: query.q, available, page, limit };
}

usuarios.get('/', (req, res) =>
res.json(repositorioUsuarios.listarUsuarios(parseListQuery(req.query))));

usuarios.post('/', (req, res) => {
const usuario = repositorioUsuarios.agregarUsuario(req.body);
res.status(201).location(`/api/usuario/${usuario.correo}`).json(usuario);
});


app.use(express.urlencoded({ extended: false }));
app.post('/form/usuarios', (req, res) => {
const input = {
nombre: req.body.nombre,
correo: req.body.correo,
contrasena: req.body.contrasena
};
try {
const usuario = repositorioUsuarios.agregarUsuario(input);
res.redirect(303, `/form.html?creado=${encodeURIComponent(usuario.nombre)}`);
} catch (err) {
if (!(err instanceof ValidationError)) throw err;
const msg = err.errors.map((e) => e.mensaje).join('. ');
res.redirect(303, `/form.html?error=${encodeURIComponent(msg)}`);
}
});
/*

function logRequests(req, res, next) {
const start = Date.now();
res.on('finish', () => {
const ms = Date.now() - start;
console.log(req.method, req.originalUrl, res.statusCode, `${ms} ms`);
});
next(); // pasa al siguiente middleware
}
function requireJson(req, res, next) {
}
const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
if (hasBody && !req.is('application/json'))
return res.status(415).json({ error: 'Se requiere JSON' });
next();
app.use(logRequests);   // toda la aplicación
books.use(requireJson); 



app.use(session({
name: 'clase08.sid',
secret: process.env.SESSION_SECRET,  // firma la cookie
resave: false,
saveUninitialized: false,            
cookie: {
httpOnly: true,
sameSite: 'lax',
secure: production,                
maxAge: 60 * 60 * 1000,            
},
}));
// sin sesiones para anónimos
// HTTPS en producción
// 1 hora
// En producción, detrás del proxy HTTPS de la plataforma:
app.set('trust proxy', 1);

const regenerate = (req) =>
new Promise((ok, fail) => req.session.regenerate((e) => (e ? fail(e) : ok())));
app.post('/api/login', async (req, res) => {
const user = await users.verify(req.body?.email, req.body?.contrasena);
if (!user) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
await regenerate(req);          
// nuevo identificador de sesión
req.session.userId = user.id;   // solo el id, no el usuario completo
res.json(toPublic(user));
});
app.post('/api/logout', requireAuth, async (req, res) => {
await destroy(req);
res.clearCookie('clase08.sid').status(204).end();
});


app.use((req, res, next) => {
req.user = req.session.userId ? users.findById(req.session.userId) : null;
next();
});
const requireAuth = (req, res, next) =>
req.user ? next() : res.status(401).json({ error: 'Es necesario iniciar sesión' });
// Autorización por rol: una función que DEVUELVE un middleware.
const requireRole = (role) => (req, res, next) => {
if (!req.user) return res.status(401).json({ error: 'Es necesario iniciar sesión' });
if (req.user.role !== role) return res.status(403).json({ error: 'Sin permisos' });
next();
}*/