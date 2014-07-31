/**
 * @author RBhochhibhoya
 */
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