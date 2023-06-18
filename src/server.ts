import * as http from 'http';
import * as socketio from 'socket.io';
import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import validateEnv from '@utils/validateEnv';
import { logger } from '@utils/logger';
import { NODE_ENV, PORT } from '@config';

validateEnv();
const app = new App([new IndexRoute(), new AuthRoute()]);

const pingServer = app.getServer();
const server: http.Server = http.createServer(pingServer);
const io: socketio.Server = new socketio.Server();

io.attach(server,{
    pingTimeout: 60000,
    cors: {
        origin: 'http://localhost:3000'
        // credentials: true,
    }
});


io.on('connection', function(socket) {
    console.log('A user connected');
    socket.on('disconnect', function () {
       console.log('A user disconnected');
    });
});
 
server.listen(PORT, () => {
    logger.info(`=================================`);
    logger.info(`======= ENV: ${NODE_ENV} =======`);
    logger.info(`🚀 App listening on the port ${PORT}`);
    logger.info(`=================================`);
});
