const md5 = require('md5')
const cookieKey = require('./middleware.js').cookieKey
const User = require('./model.js').User
const Profile = require('./model.js').Profile
const SessionUser = require('./model.js').SessionUser
const middleware = require('./middleware.js')

const mySecretMessage = 'sekret'

const showItems = (err, items) => {
	if(err)
		console.error(err)
	console.log(items)
}

const register = (req, res) => {
	var username = req.body.username
	var password = req.body.password
	var email = req.body.email
	var dob = req.body.dob
	var zipcode = req.body.zipcode
	var displayName = req.body.displayName || ''

	if(!username || !password || !email || !dob || !zipcode) {
		console.log("incomplete information")
		res.sendStatus(400)
		return
	}

	var salt = (Math.random() + 1).toString(36).substring(7)
	var hash = md5(password + salt)
	// var id = req.id
	var user = { username: username, hash: hash, salt: salt }
	var profile = { username: username, displayName: displayName,
		email: email, dob: dob, zipcode: zipcode, avatar: {}, follow: [] }

	new User(user).save()
	new Profile(profile).save(function() {
		User.find(showItems)
		Profile.find(showItems)
	})

	const payload = {username: username, result: 'success'}
	res.send(payload)
	return
}

const login = (req, res, next) => {
	var username = req.body.username
	var password = req.body.password
	if(!username || !password) {
		res.sendStatus(400)
		return
	}
	else {
		var users = User.find({username: username}, function(err, items) {
			if(err)
				console.error(err)
			if(items.length == 0) {
				res.status(401).send("no such user: " + username)
				return
			}
			else {
				var hash = md5(password + items[0].salt)
				if(hash !== items[0].hash) {
					res.status(401).send("wrong password")
					return
				}
				else {
					next()
				}
			}
		})
	}
}

const resLogin = (req, res) => {
	var username = req.body.username
	var sessionKey = md5(mySecretMessage + new Date().getTime() + username)
	// sessionUser[sessionKey] = items[0]
	new SessionUser({sessionKey: sessionKey, username: username})
		.save(function() {
			// SessionUser.find(showItems)
		})
	res.cookie(cookieKey, sessionKey, { maxAge: 3600*1000, httpOnly: true })
	const payload = {"username": username, "result": 'success'}
	res.send(JSON.stringify(payload))
	return
}

const logout = (req, res) => {
	// console.log(req.username)
	SessionUser.remove({username: req.username}, function(err) {
		if(err)
			console.error(err)
		SessionUser.find(showItems)
		res.clearCookie(cookieKey)
		res.status(200).send(req.username + ' logged out')
	})
}

const changePwd = (req, res) => {
	const payload = {username: req.body.username, status: 'you can\'t change your password, sorry.'}
	res.send(payload)
}

module.exports = (app) => {
	// app.use(cookieParser())
	app.post('/login', login, middleware.manageCookie, resLogin)
	app.post('/register', register)
	app.use(middleware.isLoggedIn)
	app.put('/logout', logout)
	app.put('/password', changePwd)
}