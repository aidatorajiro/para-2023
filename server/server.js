const net = require('net');
const WebSocket = require('ws');

let incoming_buffer = ""

let incoming_parsed = []

const tlsServer = net.createServer(socket => {
    socket.on('data', data => {
        incoming_buffer += data.toString()

        let buffer_split = incoming_buffer.split("\n");
        for (let i = 0; i < buffer_split.length - 1; i++) {
            let segment = buffer_split[i];
            if (segment !== '') {
                try {
                    let parsed_segment = JSON.parse(segment)
                    incoming_parsed.push(parsed_segment)
                } catch (e) {
                    console.log("parse failed:", segment)
                }
            }
        }

        incoming_buffer = buffer_split[buffer_split.length - 1]

        console.log("sending", incoming_parsed.length, "of data")

        broadcast_data(JSON.stringify(incoming_parsed))

        incoming_parsed = []
    });

    socket.on('close', () => {
        console.log('client closed connection');
    });

    socket.on('error', () => {
        console.log('error');
    });

}).listen(3000);

console.log('listening on port 3000 TLS');





const wsServer = new WebSocket.Server({
    port: 3001
});

console.log('listening on port 3001 WS');

let wssocks = [];
wsServer.on('connection', function(socket) {
  wssocks.push(socket);

  socket.on('message', function(msg) {
  });

  socket.on('close', function() {
    wssocks = wssocks.filter(s => s !== socket);
  });
});

const broadcast_data = (d) => {
    for (let i = 0; i < wssocks.length; i++) {
        let sock = wssocks[i];
        sock.send(d)
    }
}