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
	var key = req.params.id
	if(key) {
		console.log("key", key)
		Post.find(function() {
			return this.author === key || this.id === key
		}).exec(function(err, items) {
			if(err) {
				console.error(err)
				return res.sendStatus(500)
			}
			else {
				items = items.map(article => article = filter(article))
				var payload = { articles: items }
				return res.send(payload)
			}
		})
	}
	else {
		var follow = []
		Profile.where({ username: username }).findOne(function(err, item) {
			if(err) {
				console.error(err)
				return res.sendStatus(500)
			}
			else {
				var follow = item.follow
				var articles = []
				var count = 0
				console.log("follow", follow)
				follow.map(f => {
					// console.log("follow", follow)
					// console.log("count", count)
					Profile.where(ObjectId(f)).findOne(function(err, item) {
						var followUser = item.username
						console.log("followUser", followUser)
						Post.find({ author: followUser }, function(err, items) {
							count++
							console.log("items", items)
							// console.log("articles", articles)
							articles = articles.concat(items)
							// console.log("articles", articles)
							if(count === follow.length) {
								console.log("search complete")
								var payload = { articles: articles }
								return res.send(payload)
							}
						})
					})
				})
			}
		})
	}
}

const updateArticle = (req, res) => {
	var username = req.username
	var text = req.body.text
	var commentId = req.body.commentId
	var id = req.params.id
	if(id) {
		Post.find(ObjectId(id)).exec(function(err, articles) {
			if(articles.length === 0) {
				console.log("no matched record for id:", id)
				return res.sendStatus(204)
			}
			if(commentId) {
				if(commentId === -1) {
					var comment = new Comment({ author: username, body: text, date: new Date() })
					articles[0].comments.push(comment)
					articles[0].save(function(err) {
						if(err) {
							console.error(err)
							return res.sendStatus(500)
						}
						return res.send({ articles: [ filter(articles[0]) ] })
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
						if(articles[0].img) {
							articles[0].img = articles[0].img.url
						}
							return res.send({ articles: [ filter(articles[0]) ]})
					})
				}
			}
			else {
				if(articles[0].author !== username) {
					return res.sendStatus(403)
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
	var username = req.username
	var text = req.body.text
	var file = req.file

	var img = {
		url: cachePath + '/' + file.filename,
		data: fs.readFileSync(cachePath + '/' + file.filename),
		contentType: file.mimetype
	}
	var newPost = new Post({ author: username, body: text, date: new Date(), img: img, comments: []})
	newPost.save(function(err) {
		if(err) {
			console.error(err)
			return res.sendStatus(500)
		}
		else {
			return res.send({ articles: [ filter(newPost) ]})
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
	app.get('/articles/:id*?', getArticles)
	app.put('/articles/:id', updateArticle)
	app.post('/article', upload.single('postImg'), postArticle)
}