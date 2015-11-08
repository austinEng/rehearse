
exports.activate = function () {
	$('#recordButton').removeClass('inactive').addClass('active');
}

exports.deactivate = function () {
	$('#recordButton').removeClass('active').addClass('inactive');
	$('#recordButtonAnimWrap').css('padding', '');
}

exports.setVolume = function (vol) {
	$('#recordButtonAnimWrap').css('padding', vol/2 + '%');
}