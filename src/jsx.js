var sgReact = React.createClass( {displayName: "sgReact",
    propTypes : {
        items: React.PropTypes.array.isRequired,
        columns: React.PropTypes.array.isRequired,
        rowClick: React.PropTypes.func.isRequired
    },
    componentDidMount: function() {
      console.log('self.domRef:',self.domRef.offsetHeight);
    },
    getDefaultProps: function() {
        return { items: [], columns: [] };
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
            for (var i =0;i<this.itemPerPage;i++){
                items.push(this.props.items[offset+i]);
            }
        }
        else 
            items = this.props.items;
        
        return (React.createElement("div", {ref:  getDomRef }, 
             this.props.items.map(function(item) {
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
            
            ));
        }
    });