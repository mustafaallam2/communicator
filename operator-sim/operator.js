const express = require('express')

const app = express()
const port = process.env.PORT || 3100
app.use(express.json())




app.post('/communicator_chanel', async (req, res) => {
    
    res.send({status:'received'})
    console.log(req.body)


})




app.listen(port, () => {
    console.log('Server is up on port ' + port)
})