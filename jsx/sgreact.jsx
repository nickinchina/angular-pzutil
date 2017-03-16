var sgReact = React.createClass( {
    propTypes : {
        items: React.PropTypes.array.isRequired,
        columns: React.PropTypes.array.isRequired,
        rowClick: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return {
            scrollOffset: 0,
            firstRow : 0,
            itemsPerPage : 1,
            rowHeight: 0,
            noOfItems: this.props.items.length
        };
    },
    componentDidUpdate: function() {
        
        var self = this;
        var getViewPortHeight = function(){ return window.innerHeight-self.domVpRef.offsetTop-40;}
        var arrangeChildren = function(){
            for (var i =0;i<self.domRef.childNodes.length;i++){
                self.domRef.childNodes[i].style.position= "absolute";
                self.domRef.childNodes[i].style.top = (self.state.scrollOffset + i*self.state.rowHeight) + "px";
                self.domRef.childNodes[i].style.width= "100%";
            }
        }
        if (self.domRef.offsetHeight>0){
            self.domVpRef = this.domRef.parentNode.parentNode;
            var vp = getViewPortHeight();
            self.domVpRef.style.height=vp+"px";
            self.domVpRef.scrollTop=self.state.scrollOffset;
            self.domVpRef.onscroll = function(e){
                var scrollOffset = self.domVpRef.scrollTop;
                var firstRow = Math.floor(scrollOffset / self.state.rowHeight); 
                var itemsPerPage= Math.ceil(vp/self.state.rowHeight);
                if (scrollOffset!=self.state.scrollOffset || firstRow != self.state.firstRow){
                    self.setState({
                        scrollOffset:scrollOffset,firstRow:firstRow,itemsPerPage:itemsPerPage
                    });
                }
            };
            if (self.state.rowHeight==0){
                var rowHeight = self.domRef.offsetHeight/self.state.itemsPerPage;
                var itemsPerPage=Math.ceil(vp/rowHeight);
                self.setState({
                    itemsPerPage:itemsPerPage,rowHeight:rowHeight,noOfItems:this.props.items.length
                })
            }
            else {
                self.domRef.style.height=Math.ceil(self.state.rowHeight*self.state.noOfItems) + "px";
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
        var getRowSelected = function(item){
            var r ={
                display: item.$__selected?"block":"none"
            }
            return r;
        }
        var getDomRef = function(ref){
            self.domRef = ref;
        }
        var clickRow = function(row,e){
            self.props.rowClick(row,e);
            self.setState({rowHeight:self.state.rowHeight});
        }
        var items = [];
        for (var i =0;i<self.state.itemsPerPage;i++){
            if (self.state.firstRow+i<this.props.items.length)
                items.push(this.props.items[self.state.firstRow+i]);
        }
        return (
            <div ref={ getDomRef }>
            { items.map(function(item) {
                    var boundItemClick = clickRow.bind(self, item);
                    var count = 0;
                    return <div key={item.id} className={getRowClass(item)} onClick={boundItemClick}>
                        {
                            self.props.columns.map(function(col){
                                count++;
                                if (count>1)
                                    return (
                                    <div className={col.$getColumnClass(item)} title={col.$getText(item)} style={col.$getColumnStyleReact()}>
                                        {col.$getText(item)}
                                    </div>);
                                else
                                    return (
                                    <div className={col.$getColumnClass(item)} title={col.$getText(item)} style={col.$getColumnStyleReact()}>
                                        <i style={getRowSelected(item)} className="fa fa-circle"></i>{col.$getText(item)}
                                    </div>);
                            })
                        }</div>
                })
            }
            </div>);
        }
    });