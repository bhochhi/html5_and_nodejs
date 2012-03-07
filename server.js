/**
 * @author RBhochhibhoya
 *
 * This is websocket server communicates with node.js
 */"use strict"; 
var lineClicked = "";
var clients = new Array();
var webSocketServer = require('websocket').server;
// Port where we'll run the websocket server
var webSocketsServerPort = 8000;
var color = ["#FF0000", "#0000FF", "#00FF00", "#000000", "#880015", "##ff7f27"];

/**
 * HTTP server
 */
var http = require('http');
var server = http.createServer(function(request, response) {
	// Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});
/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. To be honest I don't understand why.
	httpServer : server
});
var STATUS = {
	PlAY : "Play",
	WAIT : "Wait",
	CONNECTED : "Connected"
}
function GetIdleUsers() {
	var idleUserNames = [];
	for(var clidx in clients) {	
		if(clients[clidx].status == STATUS.WAIT)
			idleUserNames.push(clients[clidx].userName);
	}
	return idleUserNames;
}

function GetUser(userName) {
	for(var idx in clients) {
		if(clients[idx].userName === userName)
			return clients[idx];
	}	
}

wsServer.on('request', function(request) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	// accept connection
	var connection = request.accept(null, request.origin);
	
	var waitingPlayers = GetIdleUsers();	
	connection.sendUTF(JSON.stringify({
		type : 'init',
		idleUsers : waitingPlayers
	}));

	// we need to know client index to remove them on 'close' event
	var index = clients.push(connection) - 1;
	var userName = false;
	var userColor = "";
	var status = STATUS.CONNECTED;
	var opponent = "";
		
	console.log((new Date()) + ' Connection accepted.');

	// user sent some message
	connection.on('message', function(message) {
		if(message.type === 'utf8') {
			var json = JSON.parse(message.utf8Data);

			if(json["type"] == "init" && userName == false) {// registration
				userName = json["newUser"];
				connection.userName = userName;
				var opponentName = json["opntUser"];				
				userColor = color.pop();
				connection.userColor = userColor;
				if(opponentName == "") {
					status = STATUS.WAIT;
					connection.status = status;
					connection.sendUTF(JSON.stringify({
						type : 'init_wait',
						username : userName,
						color : userColor
					}));
				} else {
					status = STATUS.PlAY;
					connection.status = status;
					opponent = GetUser(opponentName);					
					opponent.status = status;					
					connection.opponent = opponent;
					opponent.opponent = connection;
					
					connection.sendUTF(JSON.stringify({
						type : 'init_play',
						username : userName,
						opntUser : opponentName,
						color : userColor
					}));
					opponent.sendUTF(JSON.stringify({
						type : 'init_play_for_waiting_player',
						username : opponentName,
						opntUser : userName,
						color : opponent.userColor
					}));
				}

			} else {
				var line = json["line"];
				var colorToUse = json["color"];
				connection.sendUTF(JSON.stringify({
					type : 'play',
					username : userName,
					line : json["line"],
					color : colorToUse
				}));
				connection.opponent.sendUTF(JSON.stringify({
					type : 'play',
					username : userName,
					line : json["line"],
					color : colorToUse
				}));
			}
		}
	});
	// user disconnected
	connection.on('close', function(connection) {
		if(userName !== false) {
			console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
			// remove user from the list of connected clients
			clients.splice(index, 1);
			color.push(userColor);
		}
	});
});
