/*
 * Test suite for articles.js
 */
const expect = require('chai').expect
const fetch = require('node-fetch')

const url = path => `http://localhost:3000${path}`
const testuser = { username: "user6", password: "123" }
const loginOption = {
	credentials: 'include',
	method: 'POST',
	body: JSON.stringify(testuser),
	headers: {
		'Accept': 'application/json',
		'Content-Type': 'application/json'
	}
}

describe('Validate Article functionality', () => {

	xit('should return 401 because user hasn\'t logged in', (done) => {
		fetch(url("/articles"))
		.then(res => {
			expect(res.status).to.eql(401)
		})
		.then(done)
		.catch(done)
	})

	it('should return articles after logged in', (done) => {
		fetch(url("/login"), loginOption)
		.then(res => {
			console.log("log in success")
			expect(res.status).to.eql(200)
			return res.json()
		})
		.then(body => {
			console.log("start fetching")
			fetch(url("/articles/user6"), {
				credentials: 'include'
			})
			.then(res => {
				expect(res.status).to.eql(200)
				return res.json()
			})
			.then(body => {
				console.log(body)
				expect(body.articles.length).to.above(2)
			})
			.then(done)
			.catch(done)
		})
			// return res.json()
		// })
		// .then(body => {
		// 	expect(body.username).to.eql(testuser.username)
		// 	expect(body.result).to.eql("success")
		// })
	})

	xit('should give me three or more articles', (done) => {
		// IMPLEMENT ME
		// done(new Error('Not implemented'))
		fetch(url("/articles/user6"), {
			// credentials: 'include',
			method: 'GET',
			// body: JSON.stringify(body),
			headers: new Headers({
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'cookie': ['sid=04c3e02b08fd7ceadb6f363f415bb5af']
			})
		})
		.then(res => {
			expect(res.status).to.eql(200)
			return res.json()
		})
		.then(body => {
			expect(body.articles.length).to.above(2)
		})
		.then(done)
		.catch(done)
 	}, 200)

	xit('should add two articles with successive article ids, and return the article each time', (done) => {
		// add a new article
		// verify you get the article back with an id
		// verify the content of the article
		// add a second article
		// verify the article id increases by one
		// verify the second artice has the correct content
		// done(new Error('Not implemented'))
		let data = {"author": "Mark", "text": "Mark text"};
		var id = "-1";
		fetch(url("/article"),  {
		  method: "POST",
		  body: JSON.stringify(data),
		  headers: {
		    "Content-Type": "application/json"
		  }
		})
		.then(res => {
			expect(res.status).to.eql(200)
			return res.json()
		})
		.then(body => {
			id = body.id;
			// expect(body.id).to.eql('4');
			expect(body.author).to.eql('Mark');
			expect(body.text).to.eql('Mark text');
		})

		// let data = {"author": "Mark", "text": "Mark text"};
		fetch(url("/article"),  {
		  method: "POST",
		  body: JSON.stringify(data),
		  headers: {
		    "Content-Type": "application/json"
		  }
		})
		.then(res => {
			expect(res.status).to.eql(200)
			return res.json()
		})
		.then(body => {
			expect(body.id).to.eql(parseInt(id) + 1 + "");
			expect(body.author).to.eql('Mark');
			expect(body.text).to.eql('Mark text');
		})
		.then(done)
		.catch(done)
 	}, 200)

	xit('should return an article with a specified id', (done) => {
		// call GET /articles first to find an id, perhaps one at random
		// then call GET /articles/id with the chosen id
		// validate that only one article is returned
		// done(new Error('Not implemented'))
		var id = "-1";
		fetch(url("/articles"))
		.then(res => {
			expect(res.status).to.eql(200)
			return res.json()
		})
		.then(body => {
			id = body.articles[0].id
			expect(id).to.eql("1")
		})
		fetch(url("/articles/1"))
		.then(res => {
			expect(res.status).to.eql(200)
			return res.json()
		})
		.then(body => {
			expect(body.articles.length).to.eql(1);
			expect(body.articles[0].id).to.eql(id);
		})
		.then(done)
		.catch(done)
	}, 200)

	xit('should return nothing for an invalid id', (done) => {
		// call GET /articles/id where id is not a valid article id, perhaps 0
		// confirm that you get no results
		// done(new Error('Not implemented'))
		fetch(url("/articles/-1"))
		.then(res => {
			expect(res.status).to.eql(200)
			return res.json()
		})
		.then(body => {
			expect(body.articles.length).to.eql(0)
		})
		.then(done)
		.catch(done)
	}, 200)

});
