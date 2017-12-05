const fs = require('fs')
const ObjectId = require('mongodb').ObjectId
const isLoggedIn = require('./middleware.js').isLoggedIn
const cachePath = require('./middleware.js').cachePath
const upload = require('./middleware.js').upload
const Comment = require('./model.js').Comment
const Post = require('./model.js').Post
const Profile = require('./model.js').Profile

const getArticles = (req, res) => {
	var username = req.username
	Profile.where({ username: username }).findOne(function(err, item) {
		if(err) {
			console.error(err)
			return res.sendStatus(500)
		}
		else {
			var follow = item.follow
			if(follow.indexOf(username) === -1) {
				follow.push(username) // don't forget user himself
			}
			var articles = []
			var count = 0
			console.log("follow", follow)
			if(follow.length !== 0) {
				follow.map(name => {
					Post.find({ author: name }, function(err, items) {
						count++
						console.log("items", items)
						articles = articles.concat(items)
						if(count === follow.length) {
							console.log("search complete")
							var payload = { articles: articles }
							return res.send(payload)
						}
					})
				})
			}
			else {
				return res.send({ articles: [] })
			}
		}
	})
}

const updateArticle = (req, res) => {
	var username = req.username
	var displayName = req.body.displayName
	var text = req.body.text
	var commentId = req.body.commentId
	var id = req.body.id
	var file = req.file

	if(id) {
		Post.find(ObjectId(id)).exec(function(err, articles) {
			if(articles.length === 0) {
				console.log("no matched record for id:", id)
				return res.sendStatus(204)
			}
			if(commentId) {
				console.log("entered update comment, comment id:", commentId)
				console.log("displayName", displayName)
				if(commentId == "-1") {
					var comment = new Comment({ author: username, displayName: displayName, body: text, date: new Date() })
					articles[0].comments.push(comment)
					articles[0].save(function(err) {
						if(err) {
							console.error(err)
							return res.sendStatus(500)
						}
						console.log("new comment", comment)
						return res.send({ comment: comment })
					})
				}
				else {
					var index = articles[0].comments.findIndex(c => {
						console.log("c._id == commentId", c._id == commentId)
						return (c._id == commentId && c.author === username)
					})
					if(index === -1) {
						return res.sendStatus(403)
					}
					articles[0].comments[index].body = text
					articles[0].save(function(err) {
						if(err) {
							console.error(err)
							return res.sendStatus(500)
						}
						else {
							return res.send({ comment: articles[0].comments[index] })
						}
					})
				}
			}
			else {
				if(articles[0].author !== username) {
					return res.sendStatus(403)
				}
				var img = {}
				if(file) {
					img = {
						url: cachePath + '/' + file.filename,
						data: fs.readFileSync(cachePath + '/' + file.filename),
						contentType: file.mimetype
					}
					articles[0].img = img
				}
				articles[0].body = text
				articles[0].save(function(err) {
					if(err) {
						console.error(err)
						return res.sendStatus(500)
					}
					return res.send({ articles: [ filter(articles[0]) ]})
				})
			}
		})
	}
	else {
		return res.status(402).send('payload is required')
	}
}

const postArticle = (req, res) => {
	console.log(req.body)
	var username = req.username
	var text = req.body.text
	var author = req.body.disName
	var file = req.file

	var img = {}
	if(file) {
		img = {
			url: cachePath + '/' + file.filename,
			data: fs.readFileSync(cachePath + '/' + file.filename),
			contentType: file.mimetype
		}
	}
	var newPost = new Post({ author: username, displayName: author, body: text, date: new Date(), img: img, comments: []})
	newPost.save(function(err) {
		if(err) {
			console.error(err)
			return res.sendStatus(500)
		}
		else {
			return res.send({ articles: [ newPost ]})
		}
	})
}

const deleteArticle = (req, res) => {
	var id = req.params.id
	Post.deleteOne({ _id: ObjectId(id) }, function(err) {
		if(err) {
			console.error(err)
			return res.sendStatus(500)
		}
		else {
			res.sendStatus(200)
		}
	})
}

const deleteComment = (req, res) => {
	var username = req.username
	var id = req.params.id
	var commentID = req.params.commentID
	Post.findOne(ObjectId(id), function(err, article) {
		if(err) {
			console.error(err)
			return res.sendStatus(500)
		}
		else {
			var commentIndex = article.comments.findIndex(comment => comment._id == commentID)
			article.comments.splice(commentIndex, 1)
			article.save(function(err, updated) {
				if(err) {
					console.error(err)
					return res.sendStatus(500)
				}
				else {
					return res.sendStatus(200)
				}
			})
		}
	})
}

const filter = (rawArticle) => {
	var article = {
		_id: rawArticle._id,
		author: rawArticle.author,
		body: rawArticle.body,
		date: rawArticle.date,
		img: rawArticle.img.url,
		comments: rawArticle.comments
	}
	return article
}


module.exports = (app) => {
	app.get('/articles', getArticles)
	app.put('/article', upload.single('img'), updateArticle)
	app.post('/article', upload.single('img'), postArticle)
	app.delete('/article/:id', deleteArticle)
	app.delete('/comment/:id/:commentID', deleteComment)
}