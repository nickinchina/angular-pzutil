var sgReact = React.createClass( {
    propTypes : {
        items: React.PropTypes.array.isRequired,
        columns: React.PropTypes.array.isRequired,
        rowClick: React.PropTypes.func.isRequired
    },
    componentDidMount: function() {
        if (!this.rowHeight && this.domRef.offsetHeight>0){
            this.domRef.onscroll = function(e){
                console.log(e.scrollTop);
            };
            this.rowHeight = this.domRef.offsetHeight/this.itemPerPage;
            this.domRef.style.height=Math.ceil(this.rowHeight*this.noOfItems) + "px";
        }
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
            items = [];
            for (var i =0;i<this.itemPerPage;i++){
                items.push(this.props.items[offset+i]);
            }
        }
        else 
            items = this.props.items;
        
        const divStyle = {
          "min-height": '100%'
        };
        return (
            <div style={divStyle} >
            <div ref={ getDomRef } >
            { items.map(function(item) {
                    var boundItemClick = self.props.rowClick.bind(self, item);
                    return <div key={item.id} className={getRowClass(item)} onClick={boundItemClick}>
                        {
                            self.props.columns.map(function(col){
                                return (
                                <div className={col.$getColumnClass(item)} title={col.$getText(item)} style={col.$getColumnStyleReact()}>
                                    {col.$getText(item)}
                                </div>);
                            })
                        }</div>
                })
            }
            </div>
            </div>);
        }
    });