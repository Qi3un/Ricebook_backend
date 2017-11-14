const cachePath = require('./middleware.js').cachePath
const upload = require('./middleware.js').upload
const fs = require('fs')
const isLoggedIn = require('./middleware.js').isLoggedIn
const Profile = require('./model.js').Profile
const ObjectId = require('mongodb').ObjectId

const headlineField = (req, res, next) => {
	req.field = "headline"
	next()
}

const emailField = (req, res, next) => {
	req.field = "email"
	next()
}

const zipcodeField = (req, res, next) => {
	req.field = "zipcode"
	next()
}

const dobField = (req, res, next) => {
	req.field = "dob"
	next()
}

const avatarField = (req, res, next) => {
	req.field = "avatar"
	next()
}

const followField = (req, res, next) => {
	req.field = "follow"
	next()
}

const updateInfo = (req, res) => {
	var field = req.field
	var newInfo = (field !== 'follow') ? req.body[field] : req.params.user
	var username = req.username
	if(newInfo) {
		Profile.find({ username: username }, function(err, items) {
			if(err) {
				console.error(err)
				res.sendStatus(500)
				return
			}
			else {
				if(field !== 'follow') {
					items[0][field] = newInfo
				}
				else {
					if(items[0][field].indexOf(newInfo) === -1)
						items[0][field].push(newInfo)
				}
				items[0].save(function(err, updatedItem) {
					if(err) {
						console.error(err)
						res.sendStatus(500)
						return
					}
					var payload = {}
					payload.username = updatedItem.username
					payload[field] = updatedItem[field]
					res.send(payload)
					return
				})
			}
		})
	}
	else {
		res.status(402).send('Payment is required')
		return
	}
}


const getHeadline = (req, res) => {
	Profile.find({username: req.username}, function(err, items) {
		if(err) {
			console.error(err)
			res.sendStatus(500)
			return
		}
		else {
			res.send({ headline: items[0].headline })
			return
		}
	})
}

const getHeadlines = (req, res) => {
	console.log("users", req.params.users)
	var users = req.params.users

	if(!users) {
		Profile.find(function(err, items) {
			if(err) {
				console.error(err)
				res.sendStatus(500)
				return
			}
			else {
				var headlines = [];
				items.map(p => headlines.push({ username: p.username, headline: p.headline }))
				res.send({ headlines: headlines })
				return
			}
		})
	}
	else {
		var usernames = users.split(',')
		var headlines = []
		var count = 0
		usernames.map(username => {
			Profile.find({ username: username }, function(err, items) {
				count++
				if(err) {
					console.error(err)
					res.sendStatus(500)
					return
				}
				else if(items.length !== 0) {
					headlines.push({ username: items[0].username, headline: items[0].headline })
					if(count === usernames.length) {
						console.log("search complete")
						res.send({ headlines: headlines })
						return
					}
				}
			})
		})
	}
}

const getInfo = (req, res) => {
	var username = req.username
	var id = req.params.user
	var field = req.field
	if(id) {
		console.log('field', field)
		var count = 0
		var payloads = []
		var ids = (field == 'avatar') ? id.split(',') : [id]
		console.log('ids', ids)
		ids.map(id => {
			Profile.find(ObjectId(id), function(err, items) {
				count++
				if(err) {
					console.error(err)
					res.sendStatus(500)
					return
				}
				else {
					if(items.length === 0) {
						if(count === ids.length && payloads.length === 0) {
							res.sendStatus(204)	// id didn't match any record
							return
						}
					}
					else {
						var payload = {}
						console.log('item', items[0])
						payload.username = items[0].username
						payload[field] = (field == 'avatar') ? items[0][field].url : items[0][field]
						payloads.push(payload)
					}
				}
				if(count === ids.length) {
					res.send(payloads)
					return
				}
			})
		})
	}
	else {
		if(field !== 'follow' && field !== 'dob') {
			res.status(402).send('payment is required')
			return
		}
		else {
			Profile.find({ username: username }, function(err, items) {
				if(err) {
					console.error(err)
					res.sendStatus(500)
					return
				}
				else {
					var payload = {}
					payload.username = username
					payload[field] = items[0][field]
					if(field == 'dob') {
						payload[field] = new Date(payload[field]).getTime()
					}
					res.send(payload)
					return
				}
			})
		}
	}
}

const uploadAvatar = (req, res) => {
	var username = req.username
	Profile.find({ username: username }, function(err, items) {
		if(err) {
			console.error(err)
			res.sendStatus(500)
			return
		}
		else {
			items[0].avatar.url = cachePath + '\\' + req.file.filename
			items[0].avatar.data = fs.readFileSync(cachePath + '\\' + req.file.filename)
			items[0].avatar.contentType = req.file.mimetype
			items[0].save()
			res.send("uplad complete")
			return
		}
	})
}

const deleteFollow = (req, res) => {
	var id = req.params.user
	var username = req.username
	if(id) {
		Profile.find({ username: username }, function(err, items) {
			if(err) {
				console.error(err)
				res.sendStatus(500)
				return
			}
			else {
				var index = items[0].follow.indexOf(id)
				if(index > -1) {
					items[0].follow.splice(index, 1)
					items[0].save(function(err) {
						if(err) {
							console.error(err)
							res.sendStatus(500)
							return
						}
						else {
							var payload = { username: username, following: items[0].follow }
							res.send(payload)
							return
						}
					})
				}
			}
		})
	}
}


module.exports = (app) => {
	app.put('/headline', headlineField, updateInfo)
	app.get('/headlines', getHeadline)
	app.get('/headlines/:users?', getHeadlines)

	app.put('/email', emailField, updateInfo)
	app.get('/email/:user', emailField, getInfo)

	app.put('/zipcode', zipcodeField, updateInfo)
	app.get('/zipcode/:user', zipcodeField, getInfo)

	app.get('/dob', dobField, getInfo)

 	app.put('/avatar', upload.single('avatar'), uploadAvatar)
 	app.get('/avatar/:user?', avatarField, getInfo)

 	app.get('/following/:user?', followField, getInfo)
 	app.put('/following/:user', followField, updateInfo)
 	app.delete('/following/:user', deleteFollow)
}

exports.cachePath = cachePath
exports.upload = upload