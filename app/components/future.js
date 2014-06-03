var importNode = function(template) {
	console.log(template);
	return document.importNode(template, true).firstElementChild;
}

module.exports = {
	importNode: importNode
}