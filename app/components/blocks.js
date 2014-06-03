var Core = require("./Core.js");
var Block = require("./block.js");


var Paragraph = Core.extend(Block, null, {
    blockType: "p",
    blockClassName: "block--para",
    blockHumanName: "Paragraph"
});

var Heading1 = Core.extend(Block, null, {
    blockType: "h1",
    blockClassName: "block--h1",
    blockHumanName: "Heading 1"
});


var Heading2 = Core.extend(Block, null, {
    blockType: "h2",
    blockClassName: "block--h2",
    blockHumanName: "Heading 2"
});

var Heading3 = Core.extend(Block, null, {
    blockType: "h3",
    blockClassName: "block--h3",
    blockHumanName: "Heading 3"
});


var ListItem = Core.extend(Block, null, {
    blockType: "list-item",
    blockClassName: "block--list-item",
    blockHumanName: "List item",
});

var DefinitionListItem = Core.extend(Block, null, {
    blockType: "list-item",
    blockClassName: "block--list-item",
    blockHumanName: "List item",
    render: function() {
        var data = this.model.get("text");
        var div = document.createElement("div");

        html = "<span contenteditable='true'>" + data.term + "</span>";
        html += "<span contenteditable='true'>" + data.definition + "</span>";
        div.innerHTML = html;
        return div;
    }
});


var List = Core.extend(Block, null, {
    blockType: "list",
    blockClassName: "block--list",
    blockHumanName: "Unordered list",
    listItemClass: ListItem,
    render: function() {
        var inputEl = this.getInputEl();
        var data = this.model.get("text");
        var html = "";

        if (data instanceof Array) {
            var content = [];

            for (var i = 0; i < data.length; i++) {
                var block = data[i];
                var blockObject = new this.listItemClass().init(block);
                this.el.appendChild(blockObject.render());
                console.log(blockObject.render());
            }

        } else {
            html = data;
        }

        inputEl.innerHTML = html;
        this.el.classList.add(this.blockClassName);
        return this.el;
    }
});


var DefList = Core.extend(List, null, {
    blockType: "dl",
    blockClassName: "block--dl",
    blockHumanName: "Definition list",
    listItemClass: DefinitionListItem
});

var StatBlock = Core.extend(Block, null, {
    blockType: "stat-block",
    blockClassName: "block--list",
    blockHumanName: "Stats block",
});

var AnchorLinks = Core.extend(Block, null, {
    blockType: "anchor-links",
    blockClassName: "block--list",
    blockHumanName: "Anchor links",
});

var Content = Core.extend(Block, null, {
    blockType: "content",
    blockClassName: "block--content",
    blockHumanName: "Content block"
});

// Export it!
module.exports = {
    Block: Block,
    Paragraph: Paragraph,
    Heading1: Heading1,
    Heading3: Heading3,
    Heading2: Heading2,
    List: List,
    StatBlock: StatBlock,
    AnchorLinks: AnchorLinks,
    Content: Content,
    DefList: DefList
};