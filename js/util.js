
/**
 * 
 */
var URLUtil = {
	
	queryValue: function( key ) {
		var query = window.location.search.substring(1).split("&");
		
		for ( var i = 0; i < query.length; i++ ) {
			var entity = query[i].split("=");
			
			if ( entity[0] == key ) {
				return entity[1];
			}
		}
	}
	
};

// shim layer with setTimeout fallback from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(callback, element){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function rnd(limit) {
    return Math.floor(Math.random() * limit);
}

function loadJSON(url, element, callback) {
	$.ajax({
		url: url,
		dataType: "text",
		success: function (data) {
			callback(element, JSON.parse(data));
		}
	});
}