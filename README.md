# README #

This is the backend of [Ricebook](http://ricebook233.surge.sh).

# API Explanation
	For users, I choose username as the unique identification. In registration, I will check the value of username in
	database to ensure it to be unique. If a duplication is found, my server will return a nitification to user that s/
	he needs to change the username to be registerred because of duplication. When a user logs in with facebook, I
	use the facebook ID obtained by facebook api as his/her username to make it unique.

	For articles, I choose the automatically produced ID in MongoDB as the unique ID. As MongoDB has done the ensuring
	unique issue for me, I can use it directly. And I do the same for the comments in each article.

# Review
  	1. https://hz56hw6.surge.sh
  		a. CSS style not so good (color, layout, widgets)
  		b. post article malfunctioning
  		c. articles only appear after add a follow
  		d. review_time: 11:25 PM 12/04/2017
  		e. grade: 6/10

  	2. https://shappymedia.surge.sh
  		a. edit article not implemented
  		b. comment not persistent
  		c. comment not friendly: can't cancel current editing
  		d. review_time: 11:37 PM 12/04/2017
  		e. grade: 8/10

  	3. http://brief-land.surge.sh
  		a. goodlooking style
  		b. headline not persistent
  		c. crash after refresh (advice: use hash in router)
  		d. edit malfunctioning
  		e. review_time: 11:47 PM 14/04/2017
  		f. grade: 8/10

  	4. http://https://ricebooklp.surge.sh
  		a. good layout and bootstrap widgets
  		b. comment not so friendly but function is perfect
  		c. grade: 10/10

  	5. https://riceboot_jj56.surge.sh
  		a. gootlooking CSS style and layout
  		b. function is perfect
  		c. grade: 10/10


### What is this repository for? ###

This repository is for the backend part of COMP531 project.
* Quick summary
* Version
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

* Summary of set up
* Configuration
* Dependencies
* Database configuration
* How to run tests
* Deployment instructions

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
* Other community or team contact