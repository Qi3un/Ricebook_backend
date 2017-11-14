const SessionUser = require('./model.js').SessionUser
const Profile = require('./model.js').Profile
const multer = require('multer')
const cachePath = './upload_cache'
const upload = multer({ dest: cachePath })
const cookieKey = 'sid'
const MAX_COOKIE = 20

const isLoggedIn = (req, res, next) => {
	console.log("entered isLoggedIn")
	// console.log(req.cookies)
	var sid = ""
	if(req.cookies) {
		console.log("req.cookies", req.cookies)
		sid = req.cookies[cookieKey]
		if(!sid) {
			console.log("cookie expired")
			return res.status(401).send("cookie expired")
		}
	}
	else {
		console.log("no cookie")
		return res.status(401).send("no cookie")
	}

	// console.log("sid", sid)

	SessionUser.find({sessionKey: sid}, function(err, items) {
		if(err) {
			console.error(err)
			return
		}
		else if(items.length === 0) {
			res.status(401).send("invalid cookie")
			return
		}
		else {
			var username = items[0].username
			req.username = username
			next()
		}
	})
}

const enableCORS = (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", true)
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE")
  next();
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
	upload: upload
}
