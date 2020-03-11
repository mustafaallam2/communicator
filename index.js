
const ServersController = require('./servers-controller');
const childProcess = require('child_process');

// simple response to http request using the tcp socket 
sendResponse = (body,socket,statusCode=200) => {
    try {
        let responseState = 'HTTP/1.1 200 OK';
            if (statusCode == 400) {
               responseState='HTTP/1.1 400 bad request'
           } 
        let headersArray = [
            responseState,
            'Content-Type: application/json; charset=UTF-8',
            'Content-Encoding: UTF-8',
            'Accept-Ranges: bytes'
        ]
     
        socket.write(headersArray.join('\n') + '\n\n');
    
        socket.write(JSON.stringify(body));
    
        socket.end();
    
    } catch (e) {
        // send new request with the action 
    }
}


start = async ()=>{
    try {
        // start the http service it is required to send and receive data from the operator 
        httpService = await childProcess.fork("./http-service")
        // start new instance of server controller class , it will be responsable for start , stop ,restart, send commands to servers  
        serversController= new ServersController()
        httpService.on('message', async (message,socket) => {
            // if the http emits message , switch the message type
            switch (message.type) {
                case 'startServer':
                    // start single server

                    try {
                        runningServers = await serversController.startServer(message.server,httpService);
                       sendResponse({
                           status : 'success',
                           runningServers: runningServers

                       }, socket)

                    } catch (e) {
                        sendResponse({
                            status: 'error',
                            reason: ['server name is invalid', e],
                            runningServers: serversController.getRunningServers()
                        }, socket,400)
                    }


                    break;
                case 'startAllServers':
                    // start all servers

                    try {
                    let skipIfRunning = message.skip_if_running;

                    runningServers = await serversController.startAllServers(skipIfRunning, httpService);
                    sendResponse({
                            status: 'success',
                            runningServers: runningServers
                        },socket);
                    } catch (e) {
                        sendResponse({
                            status: 'error',
                            reason: ['server name is invalid', e],
                            runningServers: serversController.getRunningServers()
                        },socket,400)
                    }


                    break;
                case 'startServersArray':
                    // start array of servers
                        errors = [];
                        serversLength = message.server.length
                        for (let i = 0; i < serversLength; i++) {
                            try {

                                await serversController.startServer(message.server[i], httpService)

                            } catch (e) {
                                errors.push(e)
                            }

                        }

                        if (errors.length === 0) {
                            sendResponse({
                                status: 'success',
                                runningServers: serversController.getRunningServers()
                            },socket);

                        } else {
                            sendResponse({
                                status: 'error',
                                reason: errors,
                                runningServers: serversController.getRunningServers()
                            },socket,400)
                        }


                    break;
                case 'stopServer':
                // start single server

                try {
                    runningServers = await serversController.stopServer(message.server);
                    sendResponse({
                        status: 'success',
                        runningServers: runningServers
                    },socket);
                } catch (e) {
                    sendResponse({
                        status: 'error',
                        reason: ['server name is invalid', e],
                        runningServers: serversController.getRunningServers()
                    },socket,400)
                }


                    break;
                case 'stopServersArray':
                    // stop array of servers
                        errors = [];
                        serversLength = message.server.length
                        for (let i = 0; i < serversLength; i++) {
                            try {

                                await serversController.stopServer(message.server[i])

                            } catch (e) {
                                errors.push(e)
                            }

                        }

                        if (errors.length === 0) {
                            sendResponse({
                                status: 'success',
                                runningServers: serversController.getRunningServers()
                            },socket,400);

                        } else {
                            sendResponse({
                                status: 'error',
                                reason: errors,
                                runningServers: serversController.getRunningServers()
                            },socket,400)
                        }


                    break;

                case 'restartServer':
                    // restart single server 
                        try {
                            runningServers = await serversController.restartServer(message.server, httpService)
                            sendResponse({
                                status: 'success',
                                runningServers: runningServers
                            }, socket);
                        
                        } catch (error) {
                            sendResponse({
                                status: 'error',
                                reason: error,
                                runningServers: serversController.getRunningServers()
                            }, socket, 400)
                        }

                    break;
                case 'restartServersArray':
                    // restart array of servers

                    errors = [];
                    serversLength = message.server.length
                    for (let i = 0; i < serversLength; i++) {
                        try {

                            await serversController.restartServer(message.server[i], httpService)

                        } catch (e) {
                            errors.push(e)
                        }

                    }

                    if (errors.length === 0) {
                        sendResponse({
                            status: 'success',
                            runningServers: serversController.getRunningServers()
                        }, socket, 400);

                    } else {
                        sendResponse({
                            status: 'error',
                            reason: errors,
                            runningServers: serversController.getRunningServers()
                        }, socket, 400)
                    }

                    break;
                case 'getRunningServer':
                        sendResponse({
                            runningServers: serversController.getRunningServers()
                        },socket)
                    break;
                case 'sendCommand':
                        try {
                            delete message.type
                            await serversController.sendCommand(message)
                            sendResponse({
                                status: 'success'
                            },socket)

                        } catch (e) {
                            sendResponse({
                                status: 'error',
                                reason: e
                            },socket,400)
                        }
                    break;
                default:
                    break;
            }


        })
    } catch (e) {
        console.log(e)
    }

    //.......................................................................................................................
   

}


start()


