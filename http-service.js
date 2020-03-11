const needle = require('needle');
const express = require('express')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())


process.on('message',(message)=>{
//sends any thing it receives to the operator 
needle('post', 'http://localhost:3100/communicator_chanel', {
        ...message
    }, {
        json: true
    })
    .then(function (response) {
        // console.log(response.body.status)
    })
    .catch(function (err) {
        console.log(err)
    })
})



app.post('/servers/start', async (req, res) => {
    // start all servers 
    if (req.body.server === 'all') {
        try {
            //just send command type and data and the response socket so the master process could handle the response 
            process.send({
                type: 'startAllServers',
                ...req.body
            }, res.socket)

        } catch (e) {
            res.status(500).send({
                status: 'error',
                reason: e

            })
        }
    } 
    // starting array of servers 
    else if (Array.isArray(req.body.server)) {

        try {
            process.send({
                type: 'startServersArray',
                ...req.body
            }, res.socket)

        } catch (e) {
            res.status(500).send({
                status: 'error',
                reason: e,

            })
        }


    }
    // starting single server 
     else if (typeof req.body.server === "string") {
          try {
            process.send({
                type: 'startServer',
                ...req.body
            }, res.socket)

          } catch (e) {
          res.status(400).send({
              status: 'error',
              reason: [e]
          })
          }



    }
    // available arguments :  array of server names , single server name  , all   
    else {
            res.status(400).send({
                status: 'error',
                reason: ['server name is invalid']
            })

    }




})



app.post('/servers/stop', async (req, res) => {


        // stop single server 
     if (typeof req.body.server === "string") {
          try {
              process.send({
                  type: 'stopServer',
                  ...req.body
              }, res.socket)

          } catch (e) {
              res.status(400).send({
                  status: 'error',
                  reason: [e]
              })
          }



    }
    // stop array of servers 
    else if (Array.isArray(req.body.server)) {
            try {
                process.send({
                    type: 'stopServersArray',
                    ...req.body
                }, res.socket)

            } catch (e) {
                res.status(500).send({
                    status: 'error',
                    reason: e

                })
            }



    }

    // available arguments :  array of server names , single server name    
    else {
        res.status(400).send({
            status: 'error',
            reason: ['server name is invalid']
        })

    }




})


app.post('/servers/restart', async (req, res) => {


    // stop single server 
    if (typeof req.body.server === "string") {
        try {
            process.send({
                type: 'restartServer',
                ...req.body
            }, res.socket)
        } catch (e) {
            res.status(400).send({
                status: 'error',
                reason: [e]
            })
        }



    }
    // stop array of servers 
    else if (Array.isArray(req.body.server)) {

            try {
                process.send({
                    type: 'restartServersArray',
                    ...req.body
                }, res.socket)

            } catch (e) {
                res.status(500).send({
                    status: 'error',
                    reason: e

                })
            }


    }

    // available arguments :  array of server names , single server name    
    else {
        res.status(400).send({
            status: 'error',
            reason: ['server name is invalid']
        })

    }




})


app.post('/send_command', async (req, res) => {
try {
    req.body.identifier= parseInt(req.body.identifier)
    if (!Number.isInteger(req.body.identifier)) {
        res.status(400).send({
            status: 'error',
            reason: ['invalid identifier , only integer values accepted']
        })
        return ;
    }
    process.send({
        type: 'sendCommand',
        ...req.body
    },res.socket)


} catch (e) {
        res.status(400).send({
            status: 'error',
            reason: e
        })
}



})


app.get('/servers', async (req, res) => {
    process.send({
        type: 'getRunningServer'
    }, res.socket)





})

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})



// this is for super test to work this file is not required in any other script , it runs as independent process also thats why app.listen is placed here 
module.exports= app
