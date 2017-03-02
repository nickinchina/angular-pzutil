var sgReact = React.createClass( {displayName: "sgReact",
    propTypes : {
        items: React.PropTypes.array.isRequired,
        columns: React.PropTypes.array.isRequired,
        rowClick: React.PropTypes.func.isRequired
    },
    componentDidUpdate: function() {
        var self = this;
        var getViewPortHeight = function(){ return window.innerHeight-self.domVpRef.offsetTop-40;}
        if (this.domRef.offsetHeight>0){
            var vp = getViewPortHeight();
            this.domVpRef = this.domRef.parentNode.parentNode;
            this.domVpRef.style.height=vp+"px";
            this.domVpRef.onscroll = function(e){
                var scrollOffset = self.domVpRef.scrollTop;
                if ((self.itemPerPage*self.rowHeight-scrollOffset-vp)<10){
                    self.offset = Math.floor(scrollOffset / self.rowHeight); 
                    self.domRef.style.top = self.domRef.scrollTop+"px";
                    console.log('self.forceUpdate');
                    self.forceUpdate();
                }
            };
            this.rowHeight = this.domRef.offsetHeight/this.itemPerPage;
            this.domRef.parentNode.style.height=Math.ceil(this.rowHeight*this.noOfItems) + "px";
            var oItemPerPage = this.itemPerPage;
            this.itemPerPage=Math.ceil(vp/this.rowHeight); 
            if (oItemPerPage<this.itemPerPage) {
                console.log('self.forceUpdate');
                self.forceUpdate();
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
            var offset = self.offset||0;
            items = [];
            for (var i =0;i<this.itemPerPage;i++){
                items.push(this.props.items[offset+i]);
            }
        }
        else 
            items = this.props.items;
        const style = {
            position: "absolute",
            top: "0px"
        };
        return (
            React.createElement("div", {style: style}, 
            React.createElement("div", {ref:  getDomRef }, 
             items.map(function(item) {
                    var boundItemClick = self.props.rowClick.bind(self, item);
                    return React.createElement("div", {key: item.id, className: getRowClass(item), onClick: boundItemClick}, 
                        
                            self.props.columns.map(function(col){
                                return (
                                React.createElement("div", {className: col.$getColumnClass(item), title: col.$getText(item), style: col.$getColumnStyleReact()}, 
                                    col.$getText(item)
                                ));
                            })
                        )
                })
            
            )
            ));
        }
    });