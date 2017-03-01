var sgReact = React.createClass( {
    propTypes : {
        items: React.PropTypes.array.isRequired,
        columns: React.PropTypes.array.isRequired,
        rowClick: React.PropTypes.array.func
    },

    getDefaultProps: function() {
        return { items: [], columns: [] };
    },

    render: function() {
        var self = this;
        var getRowClass = function(item){
            var r = "row sg-gridrow";
            if (item.item.$__selected) r+=" sg-gridrow-active";
            return r;
        }
        return (<div>
            { this.props.items.map(function(item) {
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
            </div>);
        }
    });