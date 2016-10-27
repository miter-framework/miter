import { Server } from './server';

let serverInst = new Server();

//get port from environment and store in Express.
var port = normalizePort(process.env.PORT || 8080);
serverInst.setPort(port);

serverInst.listen();

function normalizePort(val) {
   var port = parseInt(val, 10);
   
   if (isNaN(port)) {
      // named pipe
      return val;
   }
   
   if (port >= 0) {
      // port number
      return port;
   }
   
   return false;
}
