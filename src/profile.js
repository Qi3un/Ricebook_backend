const cachePath = require('./middleware.js').cachePath
const upload = require('./middleware.js').upload
const fs = require('fs')
const md5 = require('md5')
const isLoggedIn = require('./middleware.js').isLoggedIn
const Profile = require('./model.js').Profile
const User = require('./model.js').User
const ObjectId = require('mongodb').ObjectId

const headlineField = (req, res, next) => {
	req.field = "headline"
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
					if(field == 'avatar')
						res.send({ avatar: payloads })
					else
						res.send(payload)
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

const updateProfile = (req, res) => {
	var username = req.username
	var displayName = req.body.disName
	var email = req.body.email
	var phone = req.body.phone
	var zipcode = req.body.code
	var password = req.body.pass
	var file = req.file
	var img = {}
	if(file) {
		img = {
			url: cachePath + '/' + file.filename,
			data: fs.readFileSync(cachePath + '/' + file.filename),
			contentType: file.mimetype
		}
	}

	Profile.findOne({ username: username }, function(err, item) {
		if(err) {
			console.error(err)
			res.sendStatus(500)
			return
		}
		else {
			if(displayName) {
				item.displayName = displayName
			}
			if(email) {
				item.email = email
			}
			if(phone) {
				item.phone = phone
			}
			if(zipcode) {
				item.zipcode = zipcode
			}
			if(file) {
				item.avatar.url = cachePath + '/' + req.file.filename
				item.avatar.data = fs.readFileSync(cachePath + '/' + req.file.filename)
				item.avatar.contentType = req.file.mimetype
			}
			item.save(function(err, updated) {
				if(err) {
					console.error(err)
					return res.sendStatus(500)
				}
				else if(password) {
					console.log("new password", password)
					User.findOne({ username: username }, function(err, user) {
						if(err) {
							console.error(err)
							return res.sendStatus(500)
						}
						else {
							console.log("new password", password)
							var salt = (Math.random() + 1).toString(36).substring(7)
							var hash = md5(password + salt)
							user.hash = hash
							user.salt = salt
							user.save(function(err, updated) {
								if(err) {
									console.error(err)
									return res.sendStatus(500)
								}
								else {
									console.log("password changed")
									return res.sendStatus(200)
								}
							})
						}
					})
				}
				else {
					return res.sendStatus(200)
				}
			})
		}
	})
}

const deleteFollow = (req, res) => {
	var unfollowName = req.params.user
	var username = req.username
	console.log("delete name", unfollowName)
	Profile.find({ username: username }, function(err, items) {
		if(err) {
			console.error(err)
			res.sendStatus(500)
			return
		}
		else {
			var index = items[0].follow.indexOf(unfollowName)
			if(index > -1) {
				items[0].follow.splice(index, 1)
				items[0].save(function(err) {
					if(err) {
						console.error(err)
						res.sendStatus(500)
						return
					}
					else {
						console.log("delete succeed")
						var payload = { username: username, result: 'success' }
						res.send(payload)
						return
					}
				})
			}
		}
	})
}

const getProfile = (req, res) => {
	var username = req.username
	Profile.find({ username: username }, function(err, items) {
		if(err) {
			console.error(err)
			return res.sendStatus(500)
		}
		else {
			var profile = items[0]
			return res.send(items[0])
		}
	})
}

const constructFollow = (profile) => {
	var follow = {}
	follow.name = profile.username
	follow.id = profile._id
	follow.avatar = profile.avatar
	follow.alt = "avatar of " + profile.displayName
	follow.title = profile.displayName
	follow.subTitle = profile.headline
	return follow
}

/* return following user of current uer, in the form of class follow defined in follow.ts */
const getFollow = (req, res) => {
	var username = req.username
	var follow = []
	Profile.findOne({ username: username }, function(err, item) {
		var followNum = item.follow.length
		if(followNum) {
			var count = 0
			console.log("following for " + username, item.follow)
			item.follow.map(user => {
				Profile.findOne({ username: user }, function(err, item) {
					count = count + 1
					if(item) {
						follow.push(constructFollow(item))
					}
					if(count === followNum) {
						return res.send({ username: username, follow: follow })
					}
				})
			})
		}
		else {
			res.send({ username: username, follow: follow })
		}
	})
}

const addFollow = (req, res, next) => {
	var username = req.username
	var follow = req.params.user
	console.log("entered addFollow")
	console.log("new follow", follow)
	Profile.find({ username: follow }, function(err, items) {
		if(err) {
			console.error(err)
			return res.sendStatus(500)
		}
		else if(items.length == 0) {
			return res.status(202).send("Sorry, user not found.")
		}
		else {
			Profile.findOne({ username: username }, function(err, item) {
				if(err) {
					console.error(err)
					return res.sendStatus(500)
				}
				else {
					if(item.follow.find(element => element === follow)) {
						return res.status(202).send("Duplicate following.")
					}
					else {
						item.follow.push(follow)
						item.save(function(err, updatedItem) {
							if(err) {
								console.error(err)
								return res.sendStatus(500)
							}
							else {
								console.log("updated follow", updatedItem)
								next()
							}
						})
					}
				}
			})
		}
	})
}

module.exports = (app) => {
	app.get('/profile', getProfile)
	app.get('/follow', getFollow)
	app.put('/follow/:user', addFollow, getFollow)
	app.delete('/follow/:user', deleteFollow)
	app.put('/headline', headlineField, updateInfo)
 	app.put('/profile', upload.single('avatar'), updateProfile)
 }

exports.cachePath = cachePath
exports.upload = upload