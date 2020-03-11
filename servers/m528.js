// Include  modules.
const Net = require('net');
const port = 3500;
const server = new Net.createServer();
const BinarySearchTree = require('binary-search-tree').BinarySearchTree;


var KnownConnections = []; // connections with valid identifiers 
var unKnownConnections = []; // connections with no valid identifier 
var commandsBuffer = new BinarySearchTree(); // commands that couldn't be sent 
var sentCommands = new BinarySearchTree(); // commands sent but waiting for reply 

//starting the server 
server.listen(port, ()=> {
   
   //process.send("m528 server is running on port " + port);

   
});



// receive command to send to device
process.on('message', (commandData) => {
    try {
    
        let  unitConnection = KnownConnections[commandData.identifier];
        // check if there is device connected to send the command to
        if (!unitConnection || unitConnection.destroyed) {
            // if there is no connection , add the command to the buffer and reply to the operator

            // set the time out
            commandData.timeOut = commandData.timeOut || 60 ;
            commandData.AddedTime = new Date() ;

            commandsBuffer.insert(commandData.identifier, commandData) ;
            process.send({
            status : 'error',
            reason: 'could not send command no connection found or destroyed , command added to buffer',
            commandData
            })
        }else{
            // if there is a connection send the command then reply to operator
            unitConnection.write(commandData.command);
            // this should be changed later , the server must wait for the device to reply that the command received 
            // if the device dose not reply the command received , this code is  okay  
            process.send({
                status: 'success',
                commandData
            })
        }   
    } catch (e) {
    // incase of error reply to the operator 
    process.send({
        status: 'error',
        reason: e.message,
        commandData
    })
    }
         


});


server.on('connection', function (socket) {
    // generate random temp id for the connection  
    socket.identifier = Math.floor(Math.random() * 10000000) ; 
    unKnownConnections[socket.identifier]= socket;
    // set time out this should be changed to env variable 
    socket.setTimeout(100000);
    // console.log(`new unknown connection joined`);
    socket.on('data', function (chunk) {

        try {
                //update the socket time out
                socket.setTimeout(100000);
                //parse incoming data
                incomingData = JSON.parse(chunk.toString());
                // console.log(incomingData.time)
                process.send(incomingData)

                //check if the system number is in unknown connections 
                if (socket.identifier != incomingData.identifier) {
                    unitConnection = KnownConnections[incomingData.identifier];
                    if (unitConnection) {
                        //its a unit try to reconnect 
                        // update socket id and remove the old connection then move the new connection to known connections 
                        delete unKnownConnections[incomingData.identifier];
                        delete KnownConnections[incomingData.identifier];

                        socket.identifier = incomingData.identifier;
                        KnownConnections[socket.identifier] = socket;
                        // console.log('the unit ' + incomingData.identifier + ' is reconnected')

                    } else {

                        // update socket id and insert it in the known connections
                        delete unKnownConnections[socket.identifier];


                        socket.identifier = incomingData.identifier;
                        KnownConnections[incomingData.identifier] = socket;
                        //check if there is waiting commands 
                        waitingCommands = commandsBuffer.search(incomingData.identifier)
                        // if yes , send them 
                        if (waitingCommands.length !== 0) {
                            waitingCommands.forEach(command => {
                                setTimeout(() => {
                                    socket.write(command.command)

                                    process.send({
                                        status: 'resent',
                                        commandData: command
                                    })
                                }, 1000)

                            });
                            commandsBuffer.delete(incomingData.identifier);

                        }
                    }
                }
        } catch (e) {
            console.log(e)
        }
        
    });

    socket.on('end', function () {
        delete KnownConnections[socket.identifier];
        delete unKnownConnections[socket.identifier];

    });


    socket.on('error', function (err) {
        delete KnownConnections[socket.identifier];
        delete unKnownConnections[socket.identifier];
    });

    socket.on('timeout', function () {
        socket.write('socket timed out');
        socket.end();
        delete KnownConnections[socket.identifier];
        delete unKnownConnections[socket.identifier];
        
        console.log('connection time out for ' + socket.identifier)

    });
});


commandsBufferCleaner = ()=>{
    setInterval(() => {
        commandsBuffer.data.forEach((command, index) => {
            if (new Date() - command.AddedTime > command.timeOut * 1000) {
                delete commandsBuffer.data[index]
            }

        });
        console.log(commandsBuffer.data)
    }, 30000)
};