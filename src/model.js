// this is model.js
var mongoose = require('mongoose')
require('./db.js')

var imgSchema = new mongoose.Schema({ url: String, data: Buffer, contentType: String })

var profileSchema = new mongoose.Schema({
	username: String, follow: [ String ], avatar: imgSchema, email: String, zipcode: String, dob: String, headline: String
})

var userSchema = new mongoose.Schema({
	username: String, salt: String, hash: String
})

var sessionUserSchema = new mongoose.Schema({
	sessionKey: String, username: String
})

var commentSchema = new mongoose.Schema({
	author: String, body: String, date: Date
})

var postSchema = new mongoose.Schema({
	author: String, body: String, date: Date, img: imgSchema, comments: [ commentSchema ]
})

exports.User = mongoose.model('user', userSchema)
exports.Profile = mongoose.model('profile', profileSchema)
exports.SessionUser = mongoose.model('sessionUser', sessionUserSchema)
exports.Comment = mongoose.model('comment', commentSchema)
exports.Post = mongoose.model('post', postSchema)