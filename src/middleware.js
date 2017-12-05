const SessionUser = require('./model.js').SessionUser
const Profile = require('./model.js').Profile
const multer = require('multer')
const cachePath = './upload_cache'
const upload = multer({ dest: cachePath })
const cookieKey = 'sid'
const MAX_COOKIE = 20
const loginUrl = "https://ricebook233.surge.sh/#/auth"
const homeUrl = "http://ricebook233.surge.sh/#/article"

const isLoggedIn = (req, res, next) => {
	console.log("entered isLoggedIn")
	if(req.cookies) {
		var sid = ""
		// console.log("req.cookies", req.cookies)
		sid = req.cookies[cookieKey]
		/* check sid first, because it has been cleared when logged out */
		if(!sid) {
			/* if sid is invalid, try facebook authenticate */
			if(req.isAuthenticated()) {
				Profile.findOne({ fbID: req.user.id }, function(err, item) {
					if(err) {
						console.error(err)
						return res.sendStatus(500)
					}
					else {
						if(item) {
							req.username = item.username
							next()
						}
						else {
							console.log("this should be a log out request")
							console.log("fb not logged in: user reg -> user login -> user link -> user logout -> fb login -> fb unlink -> fb logout")
							console.log("fb not logged in: user login -> link -> unlink ->link")
							return res.sendStatus(200)
						}
					}
				})
			}
			/* if neither works, redirect to login page */
			else {
				console.log("cookie expired")
				// return res.status(401).send("cookie expired")
				return res.redirect(loginUrl)
			}
		}
		else {
			/* if sid valid, find the corresponding session info */
			SessionUser.find({sessionKey: sid}, function(err, items) {
				if(err) {
					console.error(err)
					return
				}
				/* if session has been deleted due to LRU cache, redirect to login page */
				else if(items.length === 0) {
					// res.status(401).send("invalid cookie")
					return res.redirect(loginUrl)
					return
				}
				/* if session info found, set username for req */
				else {
					var username = items[0].username
					req.username = username
					next()
				}
			})
		}
	}
	else {
		console.log("no cookie")
		// return res.status(401).send("no cookie")
		return res.redirect(loginUrl)
	}
}

const enableCORS = (req, res, next) => {
	var allowedOrigins = ["https://localhost:4200", "https://www.facebook.com", "https://ricebook233.surge.sh", "ricebook233.surge.sh", "https://ricebook233-backend.herokuapp.com", "ricebook233-backend.herokuapp.com"]
	var origin = req.headers.origin
	// console.log("current origin", origin)
	// if(allowedOrigins.indexOf(origin) > -1) {
  		res.header("Access-Control-Allow-Origin", origin)
  // }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", true)
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS")
  if(req.method == 'OPTIONS') {
  	res.sendStatus(200)
  }
  else {
  	next();
  }
}

const manageCookie = (req, res, next) => {
	console.log("managing cookie")
	SessionUser.find(function(err, items) {
		if(err) {
			console.error(err)
			res.send(500)
		}
		else {
			if(items.length === MAX_COOKIE) {
				SessionUser.remove({ sessionKey: items[0].sessionKey }, function(err) {
					if(err) {
						console.error(err)
						res.sendStatus(500)
					}
					console.log("cookie removed")
				})
			}
			next()
		}
	})
}

module.exports = {
	isLoggedIn: isLoggedIn,
	enableCORS: enableCORS,
	manageCookie: manageCookie,
	cookieKey: cookieKey,
	cachePath: cachePath,
	upload: upload,
	loginUrl: loginUrl,
	homeUrl: homeUrl
}
