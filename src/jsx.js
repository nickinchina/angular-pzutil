var sgReact = React.createClass( {displayName: "sgReact",
    propTypes : {
        items: React.PropTypes.array.isRequired,
        columns: React.PropTypes.array.isRequired,
        rowClick: React.PropTypes.func.isRequired
    },
    componentDidUpdate: function() {
        if (!this.virtualized) return;
        
        var self = this;
        var getViewPortHeight = function(){ return window.innerHeight-self.domVpRef.offsetTop-40;}
        var arrangeChildren = function(){
            for (var i =0;i<this.domRef.childNodes.length;i++){
                this.domRef.childNodes[i].style.top = (self.scrollOffset + i*this.rowHeight) + "px";
            }
        }
        if (this.domRef.offsetHeight>0){
            this.domVpRef = this.domRef.parentNode.parentNode;
            var vp = getViewPortHeight();
            this.domVpRef.style.height=vp+"px";
            this.domVpRef.onscroll = function(e){
                self.scrollOffset = self.domVpRef.scrollTop;
                var oFirstRow = self.firstRow;
                self.firstRow = Math.floor(self.scrollOffset / self.rowHeight); 
                if (oFirstRow!=self.firstRow){
                    console.log('self.forceUpdate2');
                    self.forceUpdate();
                }
            };
            this.rowHeight = this.domRef.offsetHeight/this.itemPerPage;
            this.domRef.style.height=Math.ceil(this.rowHeight*this.noOfItems) + "px";
            var oItemPerPage = this.itemPerPage;
            this.itemPerPage=Math.ceil(vp/this.rowHeight); 
            if (oItemPerPage<this.itemPerPage) {
                console.log('self.forceUpdate');
                self.forceUpdate();
            }
            else {
                arrangeChildren();
            }
        }
    },
    getDefaultProps: function() {
        return { items: [], columns: [], rowClick: function(){} };
    },

    render: function() {
        var self = this;
        var getRowClass = function(item){
            var r = "row sg-gridrow";
            if (item.$__selected) r+=" sg-gridrow-active";
            return r;
        }
        var getDomRef = function(ref){
            self.domRef = ref;
        }
        this.itemPerPage = 50;
        this.noOfItems = this.props.items.length;
        var items;
        if (this.noOfItems>this.itemPerPage){
            var firstRow = self.firstRow||0;
            items = [];
            for (var i =0;i<this.itemPerPage;i++){
                items.push(this.props.items[firstRow+i]);
            }
            this.virtualized = true;
        }
        else 
            items = this.props.items;
            
        var styleWrapper = function(style){
            if (this.virtualized) style.position= "absolute";
            return style;
        }
        return (
            React.createElement("div", {ref:  getDomRef }, 
             items.map(function(item) {
                    var boundItemClick = self.props.rowClick.bind(self, item);
                    return React.createElement("div", {key: item.id, className: getRowClass(item), onClick: boundItemClick}, 
                        
                            self.props.columns.map(function(col){
                                return (
                                React.createElement("div", {className: col.$getColumnClass(item), title: col.$getText(item), style: styleWrapper(col.$getColumnStyleReact())}, 
                                    col.$getText(item)
                                ));
                            })
                        )
                })
            
            ));
        }
    });