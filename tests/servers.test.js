const request = require('supertest')
const app = require('../http-service')

test('Should start m528 server', async () => {
    const response = await request(app)
        .post('/servers/start')
        .send({
            server: "m528"
        })
        .expect(200)
    
expect(response.body.runningServers).toEqual(expect.arrayContaining(['m528']))

})


test('Should start all servers', async () => {
    const response = await request(app)
        .post('/servers/start')
        .send({
            server: "all",
            skip_if_running: true
        })
        .expect(200)

    expect(response.body.runningServers.length).toEqual(3)

})

test('Should restart m528 server', async () => {
    const response = await request(app)
        .post('/servers/restart')
        .send({
            server: "m528"
        })
        .expect(200)

    expect(response.body.runningServers.length).toEqual(3)

})

test('Should stop m528 server', async () => {
    const response = await request(app)
        .post('/servers/stop')
        .send({
            server: "m528"
        })
        .expect(200)

    expect(response.body.runningServers['m528']).toBe(undefined)

})