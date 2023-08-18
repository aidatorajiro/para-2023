const net = require('net');
const WebSocket = require('ws');
const struct = require('python-struct');

function sliceBuffer(chunksize, buf) {
    let out_main = []
    while (buf.length >= chunksize) {
        let sliced = buf.slice(0, chunksize)
        buf = buf.slice(chunksize)
        out_main.push(sliced)
    }
    return [out_main, buf]
}

const tlsServer = net.createServer(socket => {
    let incoming_buffer = Buffer.from([])

    let incoming_parsed = []

    socket.on('data', data => {
        incoming_buffer = Buffer.concat([incoming_buffer, data])

        let struct_key = "dddddddbbbbQ";

        let chunksize = struct.sizeOf(struct_key);

        let [buffer_split, remaining] = sliceBuffer(chunksize, incoming_buffer);

        incoming_buffer = remaining;

        buffer_split.map(buf => {
            let [q0, q1, q2, q3, a0, a1, a2, c0, c1, c2, c3, t] = struct.unpack(struct_key, buf)
            incoming_parsed.push({
                quaternion: [q0, q1, q2, q3],
                linear_acceleration: [a0, a1, a2],
                calibration_status: [c0, c1, c2, c3],
                time: t
            })
        });

        broadcast_data(JSON.stringify(incoming_parsed))

        console.log("sent", incoming_parsed.length, "data")

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