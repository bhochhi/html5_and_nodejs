
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
