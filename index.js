const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const enableCORS = require('./src/middleware.js').enableCORS
const articles = require('./src/articles.js')
const auth = require('./src/auth.js')
const profile = require('./src/profile.js')

const hello = (req, res) => res.send({ hello: 'world' })

const app = express()
app.use(bodyParser.json())
app.use(enableCORS)
app.get('/', hello)
app.use(cookieParser())
auth(app)
profile(app)
articles(app)

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000
const server = app.listen(port, () => {
     const addr = server.address()
     console.log(`Server listening at http://${addr.address}:${addr.port}`)
})
