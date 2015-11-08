
exports.activate = function () {
	$('#recordButton').removeClass('inactive').addClass('active');
	$('#recordButton .text').text('Stop');
}

exports.deactivate = function () {
	$('#recordButton').removeClass('active').addClass('inactive');
	$('#recordButtonAnimWrap').css('padding', '');
	$('#recordButton .text').text('Record');
}

exports.setVolume = function (vol) {
	$('#recordButtonAnimWrap').css('padding', vol/2 + '%');
}