var extend = function(ParentObject, constructor, props) {
	var prop,
		propName,
		Class;

	Class = function(args) {
		ParentObject.apply(this, [args]);
		if (constructor) {
			constructor.apply(this, [args]);
		}
	};

	Class.prototype = Object.create(ParentObject.prototype);

	for (propName in props) {
		prop = props[propName];
		Class.prototype[propName] = prop;
	}

	return Class;
}


module.exports = {
	extend: extend
}