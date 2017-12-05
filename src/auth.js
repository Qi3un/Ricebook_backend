const md5 = require('md5')
const cookieKey = require('./middleware.js').cookieKey
const loginUrl = require('./middleware.js').loginUrl
const homeUrl = require('./middleware.js').homeUrl
const User = require('./model.js').User
const Profile = require('./model.js').Profile
const Post = require('./model.js').Post
const SessionUser = require('./model.js').SessionUser
const middleware = require('./middleware.js')
const session = require('express-session')
const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy
const request = require('request')
const qs = require('querystring')

const mySecretMessage = 'sekret'

const showItems = (err, items) => {
	if(err)
		console.error(err)
	console.log(items)
}

const register = (req, res) => {
	var username = req.body.name
	var password = req.body.pass
	var phone = req.body.phone
	var email = req.body.email
	var dob = req.body.birth
	var zipcode = req.body.code
	var displayName = req.body.disName || ''
	var headline = req.body.headline || 'default headline'

	console.log("req.body", req.body)
	if(!username || !password || !email || !dob || !zipcode) {
		console.log("incomplete information")
		res.sendStatus(400)
		return
	}

	User.find({ username: username }, function(err, items) {
		if(err) {
			console.error(err)
		}
		else if(items.length != 0) {
			return res.status(200).send({ result: "duplicate name" })
		}
		else {
			var salt = (Math.random() + 1).toString(36).substring(7)
			var hash = md5(password + salt)
			// var id = req.id
			var user = { username: username, hash: hash, salt: salt }
			var profile = { username: username, fbID: "", displayName: displayName, phone: phone,
				email: email, dob: dob, zipcode: zipcode, avatar: {}, follow: [], headline: headline }

			new User(user).save()
			new Profile(profile).save(function() {
				User.find(showItems)
				Profile.find(showItems)
			})

			const payload = {username: username, result: 'success'}
			return res.send(payload)
		}
	})
}

const login = (req, res, next) => {
	var username = req.body.username
	var password = req.body.password
	if(!username || !password) {
		res.sendStatus(400)
		return
	}
	else {
		console.log("password", password)
		var users = User.find({username: username}, function(err, items) {
			if(err)
				console.error(err)
			if(items.length == 0) {
				res.status(202).send("no such user: " + username)
				return
			}
			else {
				var hash = md5(password + items[0].salt)
				if(hash !== items[0].hash) {
					res.status(202).send("wrong password")
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
			res.cookie(cookieKey, sessionKey, { maxAge: 3600*1000, httpOnly: true })
			const payload = {"username": username, "result": 'success'}
			return res.send(JSON.stringify(payload))
		})
}

const logout = (req, res) => {
	// console.log(req.username)
	SessionUser.remove({username: req.username}, function(err) {
		if(err) {
			console.error(err)
			return res.sendStatus(500)
		}
		else {
			SessionUser.find(showItems)
			res.clearCookie(cookieKey)
			return res.status(200).send(req.username + ' logged out')
		}
	})
}

var config = {
	clientID: '142111829716364',
    clientSecret: '431702cba55feabcdaa7eaab4a91e962',
    callbackURL: "",
    profileFields: [ 'id', 'displayName', 'photos', 'email' ]
}
var currentUser = ""

const tploginFunc = (token, refreshToken, profile, done) => {
	process.nextTick(function() {
		var newUser = profile._json

		Profile.find({ fbID: newUser.id }, function(err, items) {
			if(err) {
				console.error(err)
				return done(null, profile)
				// return res.sendStatus(500)
			}
			else {
				if(items.length === 0) {
					var newProfile = {
						username: newUser.id,
						fbID: newUser.id,
						displayName: newUser.name,
						phone: "",
						email: newUser.email,
						dob: "",
						zipcode: "",
						avatar: { url: newUser.picture.data.url },
						follow: [],
						headline: "I logged in with Facebook"
					}
					new Profile(newProfile).save(function() {
						return done(null, profile)
					})
				}
				else {
					return done(null, profile)
				}
			}
		})
	})
}

var processFunc = tploginFunc
configAuth = (req, res, next) => {
	console.log("config auth")
	config.callbackURL = "https://ricebook233-backend.herokuapp.com/callback"
	processFunc = tploginFunc
	passport.use(new FacebookStrategy(config, processFunc))
	next()
}

const linkFunc = (token, refreshToken, profile, done) => {
	console.log("entered linkFunc")
	process.nextTick(function() {
		var newUser = profile._json
		console.log("link fb account", newUser)

		/* find profile for the facebook user who are about to be linked */
		Profile.find({ username: newUser.id }, function(err, items) {
			if(err) {
				console.error(err)
				currentUser = ""
				return done(null, profile)
				// return res.sendStatus(500)
			}
			else {
				/* find profile of current user */
				Profile.findOne({ username: currentUser }, function(err, item) {
					if(err) {
						console.error(err)
						currentUser = ""
						return done(null, profile)
						// return res.sendStatus(500)
					}
					/* if there doesn't exist a profile for this Facebook user, link it directly */
					else if(items.length === 0) {
						console.log("fb account not found")
						item.fbID = newUser.id
						item.save(function(err, updated) {
							if(err) {
								console.error(err)
								currentUser = ""
								return done(null, profile)
								// return res.sendStatus(500)
							}
							else {
								currentUser = ""
								return done(null, profile)
							}
						})
					}
					/* if an existing profile found, merge it with current user's before link */
					else {
						console.log("fb account found")
						console.log("fbID", items[0].fbID)
						console.log("username", items[0].username)
						item.fbID = newUser.id
						/* merge following to current user's */
						items[0].follow.map(f => {
							if(item.follow.indexOf(f) === -1) {
								item.follow.push(f)
							}
						})
						/* save merged following */
						item.save(function(err, updated) {
							if(err) {
								console.error(err)
								currentUser = ""
								return done(null, profile)
								// return res.sendStatus(500)
							}
							else {
								Profile.remove({ username: newUser.id }, function(err) {
									if(err) {
										console.error(err)
										currentUser = ""
										return done(null, profile)
										// return res.sendStatus(500)
									}
									else {
										/* find articles of Facebook user */
										Post.find({ author: newUser.id }, function(err, articles) {
											if(err) {
												console.error(err)
												currentUser = ""
												return done(null, profile)
												// return res.sendStatus(500)
											}
											else {
												/* if there's no articles belong to Facebook user */
												if(articles.length === 0) {
													currentUser = ""
													return done(null, profile)
												}
												/* merge articles by changing the author of it ot current user */
												else {
													var articleNum = articles.length
													var counter = 0
													articles.map(article => {
														article.author = currentUser
														article.save(function(err, updated) {
															counter = counter + 1
															if(err) {
																console.error(err)
																currentUser = ""
																return done(null, profile)
																// return res.sendStatus(500)
															}
															else if(counter === articleNum) {
																currentUser = ""
																return done(null, profile)
															}
														})
													})
												}
											}
										})
									}
								})
							}
						})
					}
				})
			}
		})
	})
}

configLink = (req, res, next) => {
	console.log("config link")
	currentUser = req.username
	config.callbackURL = "https://ricebook233-backend.herokuapp.com/linkCB"
	processFunc = linkFunc
	passport.use(new FacebookStrategy(config, processFunc))
	next()
}

passport.serializeUser(function(user, done) {
	done(null, user)
})

passport.deserializeUser(function(obj, done) {
	done(null, obj)
})


const FBSucceed = (req, res) => {
	return res.redirect(homeUrl)
}

const FBFail = (req, res) => {
	return res.redirect(loginUrl)
}

const unlink = (req, res) => {
	Profile.findOne({ username: req.username }, function(err, user) {
		if(err) {
			console.error(err)
			return res.sendStatus(500)
		}
		else {
			user.fbID = ""
			user.save(function(err) {
				if(err) {
					console.error(err)
					return res.sendStatus(500)
				}
				else {
					res.sendStatus(200)
				}
			})
		}
	})
}

module.exports = (app) => {
	app.use(session({
		secret: 'ThisIsMySecretMessageHowWillYouGuessIt',
	    resave: false,
	    saveUninitialized: false
	}))
	app.use(passport.initialize())
	app.use(passport.session())
	app.use('/loginFacebook', configAuth, passport.authenticate('facebook', { scope: 'email'}))
	app.use('/callback', passport.authenticate('facebook', {
		successRedirect: '/succeed', failureRedirect: '/fail'
	}))
	app.use('/fail', FBFail)
	app.post('/login', login, middleware.manageCookie, resLogin)
	app.post('/register', register)
	app.use(middleware.isLoggedIn)
	app.use('/succeed', FBSucceed)
	app.use('/link', configLink, passport.authenticate('facebook', { scope: 'email' }))
	app.use('/linkCB', passport.authenticate('facebook', {
		successRedirect: '/linkFinish', failureRedirect: '/linkFinish'
	}))
	app.use('/linkFinish', FBSucceed)
	app.put('/logout', logout)
	app.delete('/unlink', unlink)
}