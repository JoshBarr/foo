var Core = require("./Core.js");
var View = require("./View.js");
var SelectionTools = require("./selection.js");
var keyCodes = require("./keycodes.js");
var Model = require("./Model.js");



/**
 * Field methods...
 * @param {[type]} data [description]
 */
var Field = function(data) {
    this._data = data;
};

var StringField = Core.extend(Field, null, {
    render: function() {
        var el = document.createElement("div");
        el.innerHTML = "<div contenteditable='true' class='block__textarea' type='text'>" + this._data + "</div>";
        this.el = el.firstElementChild;
        return this.el;
    },
    save: function() {
        console.log(this);
        var input = this.el;
        return input.innerText;
    }
});

var KeyValField = Core.extend(Field, function(data) {
    this.validKeys = [];

    for (keyName in data) {
        this.validKeys.push(keyName)
    }
}, {
    handleEvent: function(e) {
        var t = e.target.dataset.type;   

        if (e.type === "keyup") {
            if (t) {
                this._data[t] = e.target.innerText;
            }
        }
    },
    render: function() {
        var item = this._data;
        var el = document.createElement("div");
        el.classList.add("field__keyval");
        var html = "";

        for (keyName in item) {
            html += "<div class='itemcontainer'>";
            html += "<label>" + keyName + "</label>";
            html += "<div contenteditable='true' class='input' type='text' data-type='" + keyName + "'> " + item[keyName] + "</div>";
            html += "</div>";
        }   

        el.addEventListener("keyup", this, false);
        el.innerHTML = html;
        return el;
    },
    save: function() {
        var item = this._data;
        var data = {};

        return this._data;

    }
});




/**
 * Block options
 * @param  {[type]} options A hash of options
 * @return {BlockControls}  A view for handling the block's controls
 */
var BlockControls = Core.extend(View, function(options) {
    this.selector = options.selector;
    this.block = options.block;
    this.el = this.block.el.querySelector(this.selector);
    this.actionElements = this.el.querySelectorAll("[data-action]");
    this.hide();
    return this;
}, {
    hide: function() {
        this.el.style.display = "none";
    },
    show: function() {
        this.el.style.display = "block";
    },
    remove: function() {

    }
});



/**
 * Basic block that all custom blocks will inherit.
 * Deals with:
 *      Adding/removing the block
 *      Handling keyboard interations
 *      Focus and event binding
 */
var Block = Core.extend(View, function(type) {
    this.children = [];
    this.isFocused = false;
    this.charOffset = 0;
    this.el = this.cloneTemplate();
    this.blockType = type;
    console.log(type);
    // this.setInputEl(this.el.querySelector(this.inputSelector));
    // this.inputEl.addEventListener("focus", this, false);
    // this.inputEl.addEventListener("blur", this, false);

    this.controls = new BlockControls({
        selector: "[data-controls]",
        block: this
    });

    this.el.addEventListener("click", this, false);
},
{
    template: document.getElementById("block"),
    focusedClass: "is-block--focused",
    inputSelector: "[data-input]",
    blockClassName: "p",

    init: function(blockData) {

        var inspect = function(object) {
            
            if (typeof object === "string") {
                return new StringField(object);
            }
            
            else if (object instanceof Array) {
                var data = [];
                for (var i = 0; i < object.length; i++) {
                    var item = object[i];
                    data.push(inspect(item));
                }
                return data;
            }
            
            else if (object instanceof Object) {
                if (object.type) {
                    var block = new Block(object.type).init(object.data);
                    return block;
                } else {
                    return new KeyValField(object);
                }
            }
        };

        var data = inspect(blockData);
        
        this.children = data;
        this.el.classList.add("block--" + this.blockType + "__input");
        this.model = new Model({text: blockData});
                console.log(this);

        return this;
    },

    cloneTemplate: function() {
        return document.importNode(this.template.content, true).firstElementChild;
    },

    triggerMethod: function(methodName, args) {
        if (methodName in this) {
            return this[methodName].apply(this, args);
        }
        return false;
    },

    render: function() {
        var data = this.model.get("text");
        var children = this.children;

        if (children instanceof Field) {
            this.el.appendChild(children.render());
        } else {
            var header = document.createElement('h4');
            header.innerHTML = this.getHumanName() || this.blockType;

            this.el.appendChild(header);

            for (var i = 0; i < children.length; i++) {
                var block = children[i];
                
                if (block instanceof Array) {
                    for (var n = 0; n < block.length; n++) {
                        var item = block[n];
                        this.el.appendChild(item.render());
                    }
                }
                else if (block instanceof Object) {
                    if (block) {
                        this.el.appendChild(block.render());
                    }
                }
            }
        }

        return this.el;
    },

    handleEvent: function(e) {
        switch(e.type) {
            case "focus":
                this.handleFocus(e);
                break;
            case "blur":
                this.handleBlur(e);
                break;
            case "keyup":
                this.handleKeyUp(e);
                break;
            case "keydown":
                this.handleKeyDown(e);
                break;
            case "click":
                this.handleClick(e);
                break;
        }
    },


    bindKeyEvents: function(e) {
        var el = this.getInputEl();
        el.addEventListener("keyup", this, false);
        el.addEventListener("keydown", this, false);
    },
    
    unbindKeyEvents: function(e) {
        var el = this.getInputEl();
        el.removeEventListener("keyup", this, false);
        el.removeEventListener("keydown", this, false);
    },

    handleKeyUp: function(e) {
        switch(e.keyCode) {
            case keyCodes.enter:
                e.preventDefault();
                break;
            case keyCodes.del:
                this.removeBlockIfEmpty(e);
                break;
            case keyCodes.up:
                this.handleUp(e);
                break;
            case keyCodes.down:
                this.handleDown(e);
                break;
            case keyCodes.left:
                this.handleLeft(e);
                break;
            case keyCodes.right:
                this.handleRight(e);
                break;
        }
    },

    handleKeyDown: function(e) {
        switch(e.keyCode) {
            case keyCodes.del:
                var inputEl = this.getInputEl();
                this.prevHTML = inputEl.innerHTML;
                this.charOffset = SelectionTools.getCaretCharacterOffsetWithin(this.el);
                break;
            case keyCodes.enter:
                e.preventDefault();
                e.stopPropagation();
                break;
        }
    },

    handleUp: function(e) {
        var offset = this.getOffset();
        
        PubSub.publish("block.navigation.previous", {
            characterOffset: offset
        });
    },

    handleDown: function(e) {
        var offset = this.getOffset();
        
        PubSub.publish("block.navigation.next", {
            characterOffset: offset
        });
    },

    handleLeft: function(e) {
        var offset = this.getOffset();

        if (this.charOffset === 0) {
            PubSub.publish("block.navigation.previous", {
                characterOffset: 0
            });
        }

        this.charOffset = offset;
    },

    handleRight: function(e) {
        var offset = this.getOffset();
        var inputEl = this.getInputEl();

        // TODO: Improve this dodgy code.
        var max = inputEl.innerText.length;
        console.log("handleRight %s %s", offset, this.charOffset);
        
        if (this.charOffset === max) {
            PubSub.publish("block.navigation.next", {
                characterOffset: "max"
            });
        }
        
        this.charOffset = offset;
    },

    handleClick: function(e) {
        var target = e.target;
        var action = target.dataset.action;

        console.log("handleClick");

        if (action) {
            this.triggerMethod(action);
        }
    },

    handleFocus: function(e) {
        PubSub.publish("block.focus", this);
    },

    ensureFocus: function() {
        var inputEl = this.getInputEl();
        
        if (!this.isFocused) {
            // inputEl.focus();
            this.isFocused = true;
            this.el.classList.add(this.focusedClass);
        }
    },

    activate: function() {
        var inputEl = this.getInputEl();

        if (this.isFocused) {
            return;
        }

        // this.ensureFocus();
        // this.bindKeyEvents();
        // this.controls.show();

        // this.prevHTML = inputEl.innerHTML;
        // SelectionTools.setEndOfContenteditable(inputEl);
    },

    deactivate: function() {
        this.handleBlur({});
        console.log("deactivate", this);
    },

    handleBlur: function(e) {
        this.unbindKeyEvents(e);
        this.isFocused = false;
        this.el.classList.remove(this.focusedClass);
        
        // setTimeout(function() {
        //     this.controls.hide();
        // }.bind(this), 20);
    },

    removeBlockIfEmpty: function(e) {
        var el = this.el;
        var inputEl = this.getInputEl();
        var offset = SelectionTools.getCaretCharacterOffsetWithin(inputEl);

        if (inputEl.innerHTML === "" && !this.prevHTML) {
            this.remove();
        }
    },

    remove: function() {
        var el = this.el;
        var inputEl = this.getInputEl();

        // If it's the last remaining block, don't allow it to be removed,
        // at least for now. In future we can trigger an "editor empty"
        // view or something.
        if (!el.nextElementSibling && !el.previousElementSibling) {
            this.activate();
            return;
        }

        this.unbindKeyEvents();

        inputEl.removeEventListener("focus", this, false);
        inputEl.removeEventListener("blur", this, false);
        el.removeEventListener("click", this, false);

        // this.controls.remove();
        el.parentNode.removeChild(el);

        PubSub.publish("block.remove", this);
    },

    toArray: function() {
        var data = "";

        var recursiveSave = function(obj) {
            var data = [];

            if (typeof obj === "string") {
                return obj;
            } else if (obj instanceof Array) {
                for (var i = 0; i < obj.length; i++) {
                    data.push(recursiveSave(obj[i]));
                }
                return data;
            } else if (obj instanceof Field || obj instanceof Block) {
                console.log(obj);
                return obj.save();
            }
        };

        data = recursiveSave(this.children);
        return data;
    },

    save: function() {
        return {
            type: this.blockType,
            data: this.toArray()
        };
    },

    getOffset: function() {
        var el = this.getInputEl();
        return SelectionTools.getCaretCharacterOffsetWithin(el);
    },

    setInputEl: function(el) {
        this.inputEl = el;

        el.classList.add(this.blockClassName + "__input");
    },

    getInputEl: function() {
        return this.inputEl;
    },  

    getblockClassName: function() {
        return this.blockClassName;
    },

    setblockClassName: function(typeString) {
        this.blockClassName = typeString;
    },

    getHumanName: function() {
        return this.blockHumanName;
    }
});

    

module.exports = Block;