import { createServer } from 'http';
import { initSocket } from './lib/socket';

const port = 3002;
const server = createServer();

// Initialize Socket.io from our shared lib
initSocket(server);

server.listen(port, () => {
  console.log(`> Socket.io server is running on http://localhost:${port}`);
});
