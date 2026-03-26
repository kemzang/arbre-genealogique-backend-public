"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var socket_1 = require("./lib/socket");
var port = 3002;
var server = (0, http_1.createServer)();
// Initialize Socket.io from our shared lib
(0, socket_1.initSocket)(server);
server.listen(port, function () {
    console.log("> Socket.io server is running on http://localhost:".concat(port));
});
