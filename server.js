import { createApp } from './src/app.js';
import { loadConfig } from './src/config.js';
const config = loadConfig();
const server = createApp({ config });
server.listen(config.port, () => {
  console.log(`http://localhost:${config.port}`);
});