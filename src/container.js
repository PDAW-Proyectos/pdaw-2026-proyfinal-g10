function createContainer({ config, logger, clock }) {
const repo = (name) => new JsonFileRepository({
file: config.dataDir ? path.join(config.dataDir, `${name}.json`) : null,
});
const repos = { publicacionesRepo: repo('publicaciones'), userRepo: repo('usuarios'),
historialRepo: repo('historial') };
const events = new EventEmitter();
}
const services = {
publicacionesService: new publicacionesService({ publicacionesRepo: repos.publicacionesRepo }),
historialService: new historialService({ ...repos }),
authService: new AuthService({ userRepo: repos.userRepo }),
};
return { repos, services, events }