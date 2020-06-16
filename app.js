var express = require('express');
var app = express();
var request = require('request');
var user;
var data = {};

app.set("view engine", "ejs");
app.use(express.static('public'));

app.get("/", function(req, res){
	res.render("home");	
});

app.get("/findresults", function(req, res) {
	user = req.query.user;
	console.log(user);
	res.redirect('/ratingGraph');
});


/// 1. Rating Graph ///

var points = [];
var contestid = [];

app.get("/ratingGraph", function(req, res) {
	var url = "https://codeforces.com/api/user.rating?handle=" + user;
	request(url, function(error, response, body){
		if(!error && response.statusCode == 200) {
			data = JSON.parse(body);
			if(data["status"] == "FAILED") {
				res.render("errorpage");
			}
			calcRatingGraph();
			res.redirect('/ratingDistribution');
		}
		else {
			res.render("errorpage")
		}
	});
});


/// 2. Rating Distribution ///

var rating = [];
var ques = [];

app.get("/ratingDistribution", function(req, res) {
	var url = "https://codeforces.com/api/user.status?handle=" + user;
	request(url, function(error, response, body){
		if(!error && response.statusCode == 200) {
			data = JSON.parse(body);
			calcRatingDistrbution();
			res.redirect('/tagDistribution');
		}
	});
});


/// 3. Tag Distribution ///

var tag = [];
var tagCnt = [];

app.get("/tagDistribution", function(req, res) {
	calcTagDistrbution();
	res.redirect('/verdictDistribution');
});


/// 4. Verdict Distribution ///

var verdict = [];
var verdictCnt = [];

app.get("/verdictDistribution", function(req, res) {
	calcVerdictDistrbution();
	res.redirect('/showResults');
});


/// Show Results ///

app.get("/showResults", function(req, res) {
	res.render("results", {
		user: user,
		contestid: contestid, points: points,
		rating: rating, ques: ques,
		tag: tag, tagCnt: tagCnt,
		verdict: verdict, verdictCnt: verdictCnt,
	});
});

app.get("*", function(req, res) {
	res.render("errorpage");
});


///////////////////// Functions to filter out useful data //////////////////////

function calcRatingGraph() {
	var cnt = 0;
	points = [1000];
	contestid = [0];
	data["result"].forEach(function(contest) {  
		contestid.push(++cnt);
		points.push(contest["newRating"]);
	});  
}

function calcRatingDistrbution() {
	rating = [];
	ques = [];
	var map = new Map(); 
	 data["result"].forEach(function(prob) {
		if(prob.verdict != "OK") return; 
		var rating = String(prob.problem.rating);
		while(rating.length < 4) { 
		  rating = '0' + rating; 
		} 
		if(map.has(rating) == true) {
			map.set(rating, map.get(rating) + 1);
		}
		else {
			map.set(rating, 1);
		}
	});

	 var mapAsc = new Map([...map.entries()].sort()); 
	
	 mapAsc.forEach(function(value, key) { 
		if(key == "undefined") return; 
		rating.push(key);
		ques.push(value);
	 }); 
}

function calcTagDistrbution() {
	tag = [];
	tagCnt = [];
	var map = new Map();
	
	data["result"].forEach(function(prob) {
		prob["problem"]["tags"].forEach(function(tag) {
			if(map.has(tag) == true) {
				map.set(tag, map.get(tag) + 1);
			}
			else {
				map.set(tag, 1);
			}
		});
	});

	var mapAsc = new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
	
	 mapAsc.forEach(function(value, key) { 
		tag.push(key);
		tagCnt.push(value);
	 }); 
}

function calcVerdictDistrbution() {
	verdict = ["OK","WRONG_ANSWER","TIME_LIMIT_EXCEEDED","RUNTIME_ERROR","SKIPPED","COMPILATION_ERROR","CHALLENGED","MEMORY_LIMIT_EXCEEDED","IDLENESS_LIMIT_EXCEEDED","PRESENTATION_ERROR","PARTIAL"];
	verdictCnt = [];
	var map = new Map(); 
	
	verdict.forEach(function(ver) {
		map.set(ver, 0);
	});

	data["result"].forEach(function(prob) {
		var ver = prob["verdict"];
		if(map.has(ver) == true) {
			map.set(ver, map.get(ver) + 1);
		}
	});

	var mapAsc = new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
	
	 mapAsc.forEach(function(value, key) {
		verdictCnt.push(value);
	 }); 
}

app.listen(3000, function(){
	console.log("servers up");
});