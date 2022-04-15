const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
})

app.get('/node_modules/three/build/*', (req, res) => {
    res.sendFile(__dirname + '/node_modules/three/build/' + req.params[0]);
})

app.get('/assets/js/*', (req, res) => {
    res.sendFile(__dirname + '/assets/js/' + req.params[0]);
})




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
