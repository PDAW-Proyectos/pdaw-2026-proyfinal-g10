export const config = {
  nominatimBaseUrl: 'https://nominatim.openstreetmap.org/search'
};

export function loadConfig(env = process.env) {
const production = env.NODE_ENV === 'production';
const missing = [];
const required = (name, devDefault) => {
if (env[name]) return env[name];
if (production) missing.push(name);
return devDefault;
};

 const configServer = {
env: env.NODE_ENV || 'development',
port: Number(env.PORT) || 3000,
sessionSecret: required('SESSION_SECRET', 'solo-para-desarrollo'),
version: env.npm_package_version || '1.0.0',
};
if (missing.length) throw new Error(`Faltan variables: ${missing.join(', ')}`);
return Object.freeze(configServer);
}



export default config;
