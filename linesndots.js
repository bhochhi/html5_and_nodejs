var canvas;
var ctx;
var verticalLines = [];
var horizontalLines = [];
var boxes = [];
var hr = 5;
var vt = 5;
var startX = 20;
var startY = 20;
var isCusorOnLine = false;
var lineClicked = "";
var connection;
var errContainer;
var userName = "";
var userColor = "";
var turn = false;
var opponent = "";
var opponentScore = 0;
var userScore = 0;

function registerUser() {
	var newUser = $("#userName").val();
	if(newUser.length > 0) {
		var opntUser = "";
		if($(".user-list input").length > 0) {
			opntUser = $(".user-list input:checked").val();
			if(opntUser) {
			} else {
				alert("You didn't select the opponent!! Someone will soon select you. Please wait");
				opntUser = "";
			}
		}
		var json = JSON.stringify({
			type : 'init',
			newUser : newUser,
			opntUser : opntUser
		});
		connection.send(json);
	} else {
		alert("Unable to initiate!! Please select your opponent and register your user name to play.");
	}
}

function displayWaitingUsers(users) {
	var user_list = $(".user-list");
	if(users.length > 0) {
		user_list.html("");
		users.forEach(function(user) {
			user_list.append("<input type='radio' name='userGroup' value='" + user + "'>" + user + "<br/>");
		});
	} else {
		user_list.html("No players waiting... Please register and wait for someone to connect with you.");
	}
}

function initializeSeverCommunication() {

	// if user is running mozilla then use it's built-in WebSocket
	window.WebSocket = window.WebSocket || window.MozWebSocket;

	// if browser doesn't support WebSocket, just show some notification and exit
	if(!window.WebSocket) {
		errContainer.html($('<p>', {
			text : 'Sorry, but your browser doesn\'t ' + 'support WebSockets.'
		}));
		return;
	}

	// open connection
	connection = new WebSocket('ws://bhochhibhoya-pc:8000');
	//new WebSocket('ws://108.203.180.203:8000');
	connection.onopen = function() {
		$("#userNameLabel").text("Connected to server. Register user name to play:")
	};
	connection.onerror = function(error) {
		alert('Sorry, problem encountered while communicating with server');
		// errContainer.html($('<p>', {
		// text : 'Sorry, problem encountered while communicating with server'
		// }));
	};
	// most important part - incoming messages
	connection.onmessage = function(message) {
		// try to parse JSON message that server sends.
		try {
			var json = JSON.parse(message.data);
			if(json["type"] == "init") {//just after connection.
				idleUsers = json["idleUsers"];
				displayWaitingUsers(idleUsers);
			} else if(json["type"] == "init_wait") {//response to register  to wait
				userName = json["username"];
				userColor = json["color"];
				var pentext = document.getElementById("pen").getContext("2d");
				pentext.fillStyle = userColor;
				pentext.fillRect(0, 0, 50, 10);
				$("#turn").html("Hello " + userName + "!! Please wait for someone to connect with you");
				$(".registerBoard").hide('slow', function() {
					$(".infoBoard").show();
				});
			} else if(json["type"] == "init_play_for_waiting_player") {//response to register  to play
				userName = json["username"];
				userColor = json["color"];
				opponent = json["opntUser"];
				$("#turn").html("Hello " + userName + "!! You can Play now...<br/>You are playing against: " + opponent + "<br/>Turn: " + userName)
				$("#game-stage").mousemove(handleMouseMove);
				$("#game-stage").click(handleMouseClick);
				turn = true;
			} else if(json["type"] == "init_play") {//response to register  to play
				userName = json["username"];
				userColor = json["color"];
				opponent = json["opntUser"];
				$("#turn").html("Hello " + userName + "!! You can Play now...<br/>You are playing against: " + opponent + "<br />Turn: " + opponent)
				var pentext = document.getElementById("pen").getContext("2d");
				pentext.fillStyle = userColor;
				pentext.fillRect(0, 0, 50, 10);
				$("#game-stage").mousemove(handleMouseMove);
				$("#game-stage").click(handleMouseClick);
				turn = false;
				$(".registerBoard").hide('slow', function() {
					$(".infoBoard").show();
				});
			} else if(json["type"] == "play") {
				var lineClicked = json["line"];
				var colorToUse = json["color"];
				var fromUser = json["username"];
				var line = getLine(lineClicked);
				checkLine(line, colorToUse);
				var isScore = checkBox(line, fromUser, colorToUse);
				if(isScore == true) {
					if(fromUser == userName) {
						turn = true;
						$("#turn").html("Turn: " + userName + " (You)");
					} else {
						turn = false;
						$("#turn").html("Turn: " + opponent);
					}
				} else {
					if(fromUser == userName) {
						turn = false;
						$("#turn").html("Turn: " + opponent);
					} else {
						turn = true;
						$("#turn").html("Turn: " + userName + " (You)");
					}
				}
			}
		} catch (e) {
			console.log(e);
			console.log('This doesn\'t look like a valid JSON: ', message.data);
		}
	};
}

$(function() {"use strict";
	errContainer = $('#errMessage');
	canvas = document.getElementById("game-stage");
	ctx = canvas.getContext("2d");
	if(!ctx) {
		errContainer.html($('<p>', {
			text : 'Sorry, but your browser doesn\'t ' + 'support Canvas.'
		}));
		return;
	}
	ctx.globalAlpha = 0.2;
	drawStageOnCanvas();
	ctx.restore();
	$(".infoBoard").hide();
	$("#result").hide();
	initializeSeverCommunication()
});
function getLine(lineName) {
	if(lineName[0] == 'h') {
		for(var idx in horizontalLines) {
			var lname = horizontalLines[idx].get('name');
			if(lname == lineName)
				return horizontalLines[idx];
		}
	} else
		for(var idx in verticalLines) {
			var lname = verticalLines[idx].get('name');
			if(lname == lineName)
				return verticalLines[idx];
		}
}

function checkLine(line, colorToUse) {

	line.set({
		state : "CHECKED"
	});
	var lineImg = line.get('image');
	var myImage = ctx.getImageData(line.get("xPos"), line.get("yPos"), lineImg.width, lineImg.height);

	var picLength = lineImg.width * lineImg.height;
	var rgb = hex2Rgb(colorToUse);

	// Loop through data.
	for(var i = 0; i < picLength * 4; i += 4) {
		myImage.data[i] = rgb.R;
		myImage.data[i + 1] = rgb.G;
		myImage.data[i + 2] = rgb.B;
		myImage.data[i + 3] = 255;
	}
	ctx.putImageData(myImage, line.get("xPos"), line.get("yPos"));
}

function hex2Rgb(hex) {
	hex = hex.replace('#', '0x');

	var r = (hex & 0xff0000) >> 16;

	var g = (hex & 0x00ff00) >> 8;

	var b = hex & 0x0000ff;

	return {
		R : r,
		G : g,
		B : b
	};
}

function handleMouseMove(ev) {
	if(opponent === "")
		return;
	var x, y;
	if(ev.clientX || ev.clientX == 0) {
		x = ev.clientX - this.offsetLeft;
		y = ev.clientY - this.offsetTop;
	} else
		return;

	if((x < 20 || y < 20) || (x > 535 || y > 535)) {
		$("#game-stage").css('cursor', 'default');
		isCusorOnLine = false;
		return;
	}

	$("#pos").html(x + " , " + y);

	for( idx = 0; idx < horizontalLines.length; idx++) {
		var dx = startX + horizontalLines[idx].get('xPos');
		var dy = startY + horizontalLines[idx].get('yPos');
		if((x > (dx - 10) && x < (dx + 75)) && (y > (dy - 20) && y < (dy - 5))) {
			$("#game-stage").css('cursor', 'pointer');
			isCusorOnLine = true;
			lineClicked = horizontalLines[idx];
			return;
		} else {
			$("#game-stage").css('cursor', 'default');
			isCusorOnLine = false;
		}
	}
	for( idx = 0; idx < verticalLines.length; idx++) {
		var dx = startX + verticalLines[idx].get('xPos');
		var dy = startY + verticalLines[idx].get('yPos');
		if((y > (dy - 10) && y < (dy + 75)) && (x > (dx - 20) && x < (dx - 5))) {
			$("#game-stage").css('cursor', 'pointer');
			isCusorOnLine = true;
			lineClicked = verticalLines[idx];
			return;
		} else {
			$("#game-stage").css('cursor', 'default');
			isCusorOnLine = false;
		}
	}
}

function handleMouseClick(ev) {
	if(isCusorOnLine == true && turn == true) {
		if(lineClicked.get('state') == "DRAWN") {
			var json = JSON.stringify({
				type : 'play',
				line : lineClicked.get('name'),
				color : userColor
			});
			connection.send(json);
		}
	}
}

function drawStageOnCanvas() {
	createHorizontalLines();
	createVerticalLines();
	//creating boxes
	var k = 0;
	for(var j = 0; j < vt; j++) {
		for( i = 0; i < hr; i++) {
			var newBox = new Box({
				row : j,
				col : i,
				topLine : horizontalLines[k],
				bottomLine : horizontalLines[k + hr],
				leftLine : verticalLines[j + k],
				rightLine : verticalLines[j + k + 1],
				owner : ""
			});
			newBox.draw_box();
			boxes[k] = newBox;
			k++;
		}
	}
}

function createHorizontalLines() {
	//creating lines horizontal
	for(var i = 0; i < (hr * vt + hr); i++) {
		var newLine = new Line({
			name : "h" + i,
			orient : "H",
			state : "NEW"
		});
		horizontalLines.push(newLine);
	}
}

function createVerticalLines() {
	//creating lines vertical
	for(var i = 0; i < (hr * vt + vt); i++) {

		var newLine = new Line({
			name : "v" + i,
			orient : "V",
			state : "NEW"
		});
		verticalLines.push(newLine);
	}
}

Line = Backbone.Model.extend({

});
Box = Backbone.Model.extend({
	sign_box : function(colorToUse) {
		var rgb = hex2Rgb(colorToUse);
		ctx.beginPath();
		ctx.globalAlpha = 1;
		var dx = startX + this.get("col") * 100 + 60;
		var dy = startY + this.get("row") * 100 + 60;
		ctx.arc(dx, dy, 30, 0, 2 * Math.PI, false);
		ctx.fillStyle = "rgb(" + rgb.R + "," + rgb.G + "," + rgb.B + ")";
		ctx.fill();
	},
	draw_box : function() {

		var dx = startX + this.get("col") * 100;
		var dy = startY + this.get("row") * 100;

		if(this.get("topLine").get("state") != "DRAWN") {
			var imagt = new Image();
			imagt.onload = function() {
				ctx.beginPath();
				ctx.drawImage(imagt, dx + 5, dy);
				ctx.closePath();
			}
			imagt.src = "img/grayhline.png";
			this.get("topLine").set({
				xPos : dx + 5,
				yPos : dy,
				state : "DRAWN",
				image : imagt
			});
		}
		if(this.get("bottomLine").get("state") != "DRAWN") {
			var imagb = new Image();
			imagb.onload = function() {
				ctx.beginPath();
				ctx.drawImage(imagb, dx + 5, dy + 100);
				ctx.closePath();
			}
			imagb.src = "img/grayhline.png";

			this.get("bottomLine").set({
				xPos : dx + 5,
				yPos : dy + 100,
				state : "DRAWN",
				image : imagb
			});
		}
		if(this.get("leftLine").get("state") != "DRAWN") {
			var imagl = new Image();
			imagl.onload = function() {
				ctx.beginPath();
				ctx.drawImage(imagl, dx, dy);
				ctx.closePath();
			}
			imagl.src = "img/grayvline.png";

			this.get("leftLine").set({
				xPos : dx,
				yPos : dy,
				state : "DRAWN",
				image : imagl
			});

		}
		if(this.get("rightLine").get("state") != "DRAWN") {
			var imagr = new Image();
			imagr.onload = function() {
				ctx.beginPath();
				ctx.drawImage(imagr, dx + 100, dy);
				ctx.closePath();
			}
			imagr.src = "img/grayvline.png";
			this.get("rightLine").set({
				xPos : dx + 100,
				yPos : dy,
				state : "DRAWN",
				image : imagr
			});
		}
	}
});

function checkIfGameIsOver() {
	if(userScore + opponentScore == hr * vt) {
		if(userScore > opponentScore) {
			$(".infoBoard").hide("slow", function() {
				$("#result").html("Congratulation!! You won the game!! <br/>Refresh to play Again");
				$("#result").show();
			});
		} else {
			$(".infoBoard").hide("slow", function() {
				$("#result").html("Sorry!! You lost the game!! <br/>Refresh to play Again");
				$("#result").show();
			});
		}
		return true;
	}
	return false;
}

function getAssociatedBoxes(mLine) {
	var associatedBoxes = new Array();
	for( i = 0; i < boxes.length; i++) {
		if(mLine.get("orient") == "V") {
			if(boxes[i].get("leftLine").get("name") == mLine.get("name")) {
				associatedBoxes.push(boxes[i]);
			} else if(boxes[i].get("rightLine").get("name") == mLine.get("name")) {
				associatedBoxes.push(boxes[i]);
			}
		} else {
			if(boxes[i].get("topLine").get("name") == mLine.get("name")) {
				associatedBoxes.push(boxes[i]);
			} else if(boxes[i].get("bottomLine").get("name") == mLine.get("name")) {
				associatedBoxes.push(boxes[i]);
			}
		}
		if(associatedBoxes.length == 2)//two boxes max
			break;
	}
	return associatedBoxes;
}

function checkBox(line, playby, colorToUse) {
	var associatedBoxes = getAssociatedBoxes(line);
	var scoredFlag = false;
	for(var idx in associatedBoxes) {
		if(associatedBoxes[idx].get("topLine").get("state") == "CHECKED" && associatedBoxes[idx].get("bottomLine").get("state") == "CHECKED" && associatedBoxes[idx].get("leftLine").get("state") == "CHECKED" && associatedBoxes[idx].get("rightLine").get("state") == "CHECKED") {
			if(playby == userName) {
				associatedBoxes[idx].set({
					owner : userName
				});
				associatedBoxes[idx].sign_box(colorToUse);
				userScore++;
			} else {
				associatedBoxes[idx].set({
					owner : opponent
				});
				associatedBoxes[idx].sign_box(colorToUse);
				opponentScore++;
			}
			scoredFlag = true;
			$("#score").html("<strong>Your Score: " + userScore + "<br/> Opponent(" + opponent + ") Score: " + opponentScore);
		}
	}
	checkIfGameIsOver();
	if(scoredFlag == true)
		return true;
	return false;
}