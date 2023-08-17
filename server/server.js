const net = require('net');

let incoming_buffer = ""

let incoming_parsed = []

const server = net.createServer(socket => {
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

        console.log(incoming_parsed.length)
    });

    socket.on('close', () => {
        console.log('client closed connection');
    });

    socket.on('error', () => {
        console.log('error');
    });

}).listen(3000);

console.log('listening on port 3000');