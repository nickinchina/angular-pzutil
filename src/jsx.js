var sgReact = React.createClass( {displayName: "sgReact",
    propTypes : {
        items: React.PropTypes.array.isRequired,
        columns: React.PropTypes.array.isRequired
    },

    getDefaultProps: function() {
        return { items: [], columns: [] };
    },

    render: function() {
        var self = this;
        return (React.createElement("div", null, 
             this.props.items.map(function(item) {
                    return React.createElement("div", {key: item.id, className: "row sg-gridrow"}, 
                        
                            self.props.columns.map(function(col){
                                return (
                                React.createElement("div", {className: col.$getColumnClass(item), title: col.$getText(item)}, 
                                    col.$getText(item)
                                ));
                            })
                        )
                })
            
            ));
        }
    });