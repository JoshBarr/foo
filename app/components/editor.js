var Core = require("./Core.js");
var View = require("./View.js");
var keyCodes = require("./keycodes.js");
var SelectionTools = require("./selection.js");
var Blocks = require("./blocks.js");


// Break this up:
//  - block manager
//  - keyboard navigator
//  - model saving thingy.

var Editor = Core.extend(View, function(hiddenInputElement) {
    var blockRemoved,
        blockPrevious,
        blockNext,
        blockFocus,
        initialData;

    var inputFieldName = hiddenInputElement.name;

    this.jsonDataSelector = "[data-content]";
    this.blocksSelector = "[data-blocks]";
    this.controlsSelector = "[data-controls]";
    
    this.template = document.getElementById("editor");

    this.debug = true;
    this._blockTypes = {};
    
    this.el = document.importNode(this.template.content, true).firstElementChild;
    this.inputField = hiddenInputElement;

    if (inputFieldName) {
        this.el.dataset.jsEditor = inputFieldName;
    }

    this.blockEl = this.el.querySelector(this.blocksSelector);
    this.controlEl = this.el.querySelector(this.controlsSelector);
    this.blocks = [];
    this.activeBlockId = 0;

    initialData = this.loadDataFrom(hiddenInputElement); 

    this.registerBlockTypes(Blocks);

    this.seedInitialBlocks(initialData);
    this.setActiveBlock(0);

    this.el.addEventListener("keyup", this, false);
    this.el.addEventListener("keydown", this, false);
    this.el.addEventListener("click", this, false);

    blockRemoved = PubSub.subscribe('block.remove', this.onBlockRemoved.bind(this));
    blockPrevious = PubSub.subscribe('block.navigation.previous', this.onBlockNavigatePrevious.bind(this));
    blockNext = PubSub.subscribe('block.navigation.next', this.onBlockNavigateNext.bind(this));
    // blockFocus = PubSub.subscribe('block.focus', this.selectBlock.bind(this));

    hiddenInputElement.parentNode.insertBefore(this.el, hiddenInputElement.nextSibling);

}, {
    
    registerBlockTypes: function(blockTypes) {
        var blocks = {};

        for (var blockName in blockTypes){
            var block = blockTypes[blockName];
            var blockStringType = block.prototype.blockType;
            
            if (blockStringType) {
                blocks[blockStringType] = block;
            }
        }

        this._blockTypes = blocks;
        return blocks;
    },

    getBlockConstructor: function(name){

        var ctr = this._blockTypes[name];

        if (!ctr) {
            ctr = this._blockTypes["p"];
        }

        return ctr;
    },


    log: function(e) {
        if (this.debug) {
            console.log(e);
        }
    },

    loadDataFrom: function(element) {
        var data = {};

        try {
            data = JSON.parse(element.value);
        } catch(e) {
            this.log(e);
        }

        return data;
    },

    seedInitialBlocks: function(data) {
        var blockList  = data.blocks || [];
        var len = blockList.length;
        var blockId, block;

        for (var i = 0; i < len; i++) {
            var blockData = blockList[i];
            var blockObject = this.createBlock(blockData.type, blockData.data);
            this.blockEl.appendChild(blockObject.render());
            this.blocks.push(blockObject);
        }

        if (!len) {
            this.createBlock("p", {}, false);
        }
    },

    createBlock: function(blockType, blockData) {        
        var BlockConstructor = this.getBlockConstructor(blockType);
        var i, block, len = blockData.length, blockObject, children;
        block = new BlockConstructor(blockType).init(blockData);
        return block;
    },

    insertBlockAfterCurrent: function(blockType, blockData, triggerFocus) {
        var current = this.getActiveBlock();
        var activeIndex = this.activeBlockId;
        var block = this.createBlock(blockType, blockData);

        this.blockEl.insertBefore(block.render(), current.el.nextSibling);
        this.blocks.splice(activeIndex + 1, 0, block);
        this.setActiveBlock(activeIndex +1);
    },


    insertBlockAtCurrent: function(blockType, blockData, triggerFocus) {
        var current = this.getActiveBlock();
        var activeIndex = this.activeBlockId;
        var block = this.createBlock(blockType, blockData);

        this.blockEl.insertBefore(block.render(), current.el.nextSibling);
        current.remove();
        this.blocks.splice(activeIndex, 0, block);
        this.setActiveBlock(activeIndex);
    },


    handleEvent: function(e) {
        switch(e.type) {
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

    handleKeyUp: function(e) {
        switch (e.keyCode) {
            case keyCodes.enter:
                this.insertBlockAfterCurrent("p", "foo", true);
                break;
            // case keyCodes.down:
            //     this.moveCaret(1, {
            //         skip: true
            //     });
            //     break;
            // case keyCodes.left:
            //     this.moveCaret(-1, {});
            //     break;
            // case keyCodes.right:
            //     this.moveCaret(1);
            //     break;
        }           
    },

    handleKeyDown: function(e) {
        var target = e.target;

        switch (e.keyCode) {
            case keyCodes.del:
                target.prevHTML = target.innerHTML;
                target.charOffset = SelectionTools.getCaretCharacterOffsetWithin(target);
                break;
        }           
    },


    handleClick: function(e) {
        var target = e.target;
        var action = target.dataset.action;

        if (action) {
            this.triggerMethod(action);
        }
    },

    selectBlock: function(messageName, block) {
        return this.setActiveBlock(this.blocks.indexOf(block));
    },

    setActiveBlock: function(id) {
        var blocks = this.blocks,
            block,
            len = this.blocks.length;

        if (id === -1) {
            id = len - 1;
        }

        if (id > len - 1) {
            id = 0;
        }

        console.log("setActiveBlock %s", id);
            
        if (this.activeBlockId) {
            var currentBlock = this.blocks[this.activeBlockId];

            if (currentBlock) {
                currentBlock.deactivate();
            } else {
                this.activeBlockId = this.blocks.length -1;
            }

            console.log("activeBlockId", this.activeBlockId);
    
            
        }

        block = blocks[id];
        block.activate();
        this.activeBlockId = id;
        this.activeBlockType = block.getHumanName();
        this.controlEl.querySelector('[data-bind]').innerHTML = this.activeBlockType;
        return block;
    },

    onBlockRemoved: function(messageName, block) {
        var blocks = this.blocks,
            index = this.blocks.indexOf(block),
            prev = index - 1;

        if (index > -1) {
            blocks.splice(index, 1);
            this.setActiveBlock(prev);
        }
    },

    onBlockNavigatePrevious: function(messageName, data) {
        console.log(messageName, data);
        this.setActiveBlock(this.activeBlockId - 1);
    },

    onBlockNavigateNext: function(messageName, data) {
        console.log(messageName, data);
        this.setActiveBlock(this.activeBlockId + 1);
    },

    getBlockData: function() {
        var blockIndex,
            block,
            data = [];

        for (blockIndex in this.blocks) {
            var block = this.blocks[blockIndex];
            data.push(block.save());
        }

        return {
            transaction: {
                mtime: new Date()
            },
            blocks: data
        }
    },

    getActiveBlock: function() {
        return this.blocks[this.activeBlockId];
    },

    json: function(data) {
        return JSON.stringify(data);
    },

    save: function() {
        var data = this.getBlockData();
        var json = this.json(data);

        this.inputField.value = json;

        PubSub.publish("editor.save", {
            editor: this,
            json: json,
            data: data
        });
    },

    moveCaret: function(dir, options) {
        var options = options || false;

        var current = document.activeElement;
        var previous = current.previousSibling;
        var next = current.nextSibling;
        var offset = SelectionTools.getCaretCharacterOffsetWithin(current);

        if (!current.dataset.block) {
            return;
        }
        
        // up/previous
        if (dir < 0) {
            if ("focus" in previous && current.charOffset === 0) {
                previous.focus();
                SelectionTools.setEndOfContenteditable(previous);
            } else {
                if (options && options.next) {
                    if (next && offset === 0) {
                        next.focus();
                        next.charOffset = 0;
                    }
                } else {
                    var last = current.parentNode.lastElementChild;
                    if (offset === 0 && current.charOffset == 0) {
                        last.focus();
                        SelectionTools.setEndOfContenteditable(last);
                        last.charOffset = 0;
                    }
                }
            }
        }

        // next/down
        if (dir > 0) {
            var max = current.innerText.length;
            console.log(max, offset, current.charOffset);

            if (current.charOffset === max) {
                if (next && "focus" in next) {
                    next.focus();
                    next.charOffset = 0;
                } else {
                    var first = current.parentNode.firstElementChild;
                    if (first !== current) {
                        first.focus();
                        first.charOffset = 0;
                    }
                }
            }
        }
        current.charOffset = offset;
    },

    test: function() {
        var activeBlock = this.getActiveBlock();
        var id = this.activeBlockId;
        var data = activeBlock.save();
        var newType = "p";

        if (activeBlock.blockType === "p") {
            newType = "h1";
        }

        this.insertBlockAtCurrent(newType, data.data, false);
    },
});


module.exports = Editor;