// this is dbarticle.js
var User = require('./model.js').User
var Profile = require('./model.js').Profile
var SessionUser = require('./model.js').SessionUser


User.remove(function(err) {
  if(err)
    return console.error(err)
})

Profile.remove(function(err) {
  if(err)
    return console.error(err)
})

SessionUser.remove(function(err) {
  if(err)
    return console.error(err)
})

User.find(function(err, items) {
  if(err)
    return console.error(err)
  console.log(items)
})

Profile.find(function(err, items) {
  if(err)
    return console.error(err)
  console.log(items)
})

SessionUser.find(function(err, items) {
  if(err)
    return console.error(err)
  console.log(items)
  process.exit()
})

function find(req, res) {
     findByName(req.params.user, function(items) {
          res.send({items})
     })
}

module.exports = (app) => {
     app.get('/find/:user', find)
}


function findByName(username, callback) {
	User.find({ username: username }).exec(function(err, items) {
		console.log('There are ' + items.length + ' entries for ' + username)
    if(items.length) {
      console.log('username: ' + items[0].username +
        ', salt: ' + items[0].salt + ', salted password: ' + items[0].hash)
      callback(items[0])
    }
		// var totalLength = 0
		// items.forEach(function(article) {
		// 	totalLength += article.text.length
		// })
		// console.log('average length', totalLength / items.length)
	})
}

// new User({username: "a", salt: "salt a", hash: "salted password a"}).save();
// new User({username: "b", salt: "salt b", hash: "salted password b"}).save(function() {
//   console.log('done with save')
//   User.find().exec(function(err, items) {
//     console.log('There are ' + items.length + ' users total in db')

//     findByName('a', function(item) {
//       console.log('a: ', item)
//       findByName('b', function(item) {
//         console.log("b: ", item)
//         process.exit()
//       })
//     })
//   })
// })

//////////////////////////////
// remove these examples 

// new Article({ id: 1, author: 'mrj1', img: null, date: new Date().getTime(), text: 'This is my first article'}).save()
// new Article({ id: 2, author: 'mrj1', img: null, date: new Date().getTime(), text: 'This is my second article'}).save()
// new Article({ id: 3, author: 'jmg3', img: null, date: new Date().getTime(), text: "This is Max's article"}).save(function() {
//      console.log('done with save')
//      Article.find().exec(function(err, items) { 
//           console.log("There are " + items.length + " articles total in db") 

//           findByAuthor('mrj1', function() {
//               findByAuthor('jmg3', function(items) {
//                   console.log(items)
//                   console.log('complete')
//                   process.exit()
//               })
//           })
//      })
// })

//////////////////////////////
// remove the above example code
//////////////////////////////
