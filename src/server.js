import {createApp} from './app.js';
import {RepositorioUsuarios} from './models/repositorioUsuarios.js';
import {createContainer} from './container.js';

(async () => {
    const usuarios = createContainer({ config: { dataDir: './data' }, logger: console, clock: Date }).repos.userRepo;
    createApp({ usuarios }).listen(3000, () => console.log('Servidor escuchando en http://localhost:3000'));
})();
