
// require modules 
const childProcess = require('child_process');
const fs = require('fs');



class serverController {
 constructor (){
     this.runningServers = [];
     this.serversDirectory = './servers';
 }

 // restart a single server takes server name and server gateway 
 // the server gateway is required so the event listener knows where to send data to whenever the server emits message 
 // the gate way is a child process object
      restartServer (name, gateWay)  {
          return new Promise(async (resolve, reject) => {

              try {
                  await this.stopServer(name)
                  await this.startServer(name, gateWay)
                  resolve(Object.keys( this.runningServers))
                  return;
              } catch (e) {
                  reject('could not restart the server : ' + e)
                  return;
              }
          })



      }

      startAllServers (skipIfRunning = true,gateWay) {

          return new Promise((resolve, reject) => {
              fs.readdir(this.serversDirectory, async (err, files) => {
                  if (err) {
                      reject(err);
                      return;
                  }

                  try {
                     let filesLength = files.length;
                      for (let i = 0; i < filesLength; i++) {
                          
                         let serverFile = files[i].replace('.js', '');
                         // check if the server is already running
                          if ( this.runningServers[serverFile]) {
                              if (!skipIfRunning) {
                                  // if skipIfRunning is set to false , start the server 
                                  await restartServer(serverFile, gateWay);
                              } else {
                                // do nothing actually just skip the server  
                            }

                          } else {
                              // if the server is not already running , start it 
                              await this.startServer(serverFile, gateWay)


                          }

                      }
                      // the server started correctly 
                      resolve(Object.keys( this.runningServers));
                      return;
                  } catch (e) {
                      reject(e.message)
                  }
                  

              })


          });

      }



      startServer  (name, gateWay) {
          return new Promise((resolve, reject) => {

              if ( this.runningServers[name]) {
                  reject(`server ${name} is already running, try to restart it `)
                  return;

              }
              //make sure that the server exist in the servers directory 
              fs.exists(this.serversDirectory + "/" + name + ".js", async (exist) => {
                  if (!exist) {
                      reject('server dose not exist')
                      return;

                  }
                  try {
                      let server = await childProcess.fork(this.serversDirectory + "/" + name);
                      server.name = name;


                      server.on('message', (data) => {
                        gateWay.send(data)
                      });

                      server.on('error', (data) => {
                          // if the server emits an error , try to restart it
                          try {
                          this.restartServer(server.name, gateWay)
                          } catch (e) {
                          // if restarting failed do not try restart it again , that will caus infinite loop .
                          }
                      });

                      server.on('exit', (code) => {
                          // if code === null that means that we stopped the process using kill function ,
                          // no need to restart it
                          if (code !== null) {
                            // if the server emits an error , try to restart it
                            try {
                                this.restartServer(server.name, gateWay)
                            } catch (e) {
                                // if restarting failed do not try restart it again , that will caus infinite loop .
                            }
                          }
                      });

                      // add the server to running servers array 
                       this.runningServers[name] = server;                       

                      resolve(Object.keys( this.runningServers));
                      return;
                  } catch (e) {
                      reject(`error occurred  while starting the server  : ${name} \n` + e.message);
                      return;
                  }

              })



          })
      }

      stopServer (name)  {
          return new Promise((resolve, reject) => {
              // if it's not running , reject
              if (! this.runningServers[name]) {
                  reject(`server ${name} not found in the running servers`);
              }

              // kill the process (will exit with code null) , then delete it from the array
               this.runningServers[name].kill();
              delete  this.runningServers[name];
              resolve(Object.keys( this.runningServers));
              return;

          })

      }
      sendCommand  (commandData)  {
          return new Promise((resolve, reject) => {
              //if the server name is not running , reject
              if (! this.runningServers[commandData.serverName]) {
                  reject(`server ${commandData.serverName} not found in the running servers`);
                  return;
              }

              try {
                  // send the command to the responsable server (the server handles the command and response to the operator in separate chanel  )
                   this.runningServers[commandData.serverName].send(commandData);

                  resolve();
                  return;

              } catch (e) {
                  reject(e);

              }

          })
      }
      getRunningServers  ()  {
          // return running servers
          return Object.keys(this.runningServers);
      }



      

 }




    

module.exports = serverController;
