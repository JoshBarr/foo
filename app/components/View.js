var View = function() {

};

View.prototype = {
    triggerMethod: function(methodName, args) {
        if (methodName in this) {
            return this[methodName].apply(this, args);
        }
        return false;
    }
}

module.exports = View;
