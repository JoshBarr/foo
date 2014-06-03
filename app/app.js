(function(document, window) {

	var Editor = require("./components/editor.js");
	var debugEl = document.querySelector("[data-debug]");

	var debugOutput = function(channel, data) {
		debugEl.innerHTML = JSON.stringify(data.data, null, '  ');
		window.location.hash = "";
		window.location.hash = "#debugger";
	};


	var init = function() {
		var inputFields = document.querySelectorAll("[data-editor]");
		var editors = [];

		for (var i = 0; i < inputFields.length; i++) {
			var inputField = inputFields[i];
			editors.push(new Editor(inputField));
		}

		window.editors = editors;

		var token = PubSub.subscribe("editor.save", debugOutput);

	};

	document.addEventListener("DOMContentLoaded", init, false);

})(document, window);