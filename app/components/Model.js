var placeholder = "The HTML template element &lt;template&gt; is a mechanism for holding client-side content that is not to be rendered when a page is loaded but may subsequently be instantiated during runtime using JavaScript. Think of a template as a content fragment that is being stored for subsequent use in the document. The parser does process the content of the &lt;template&gt; element during the page load to ensure that it is valid, however.";

var Model = function(data) {
    this._data = data || {};
    this._previous = {};
};

Model.prototype = {
    get: function(key) {
        if (this._data.hasOwnProperty(key)) {
            var result = this._data[key];
            this._previous[key] = result;
            return result || placeholder;
        }
    },
    previous: function(key) {
        if (this._previous.hasOwnProperty(key)) {
            return this._previous[key];
        }
    },
    trigger: function(event) {

    }
};

module.exports = Model;