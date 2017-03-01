var sgReact = React.createClass( {displayName: "sgReact",
    propTypes : {
        items: React.PropTypes.object.isRequired,
        columns: React.PropTypes.object.isRequired
    },

    getDefaultProps: function() {
        return { items: [], columns: [] };
    },

    render: function() {
        return (React.createElement("div", null, 
             this.props.items.map(function(item) {
                    return React.createElement("div", {class: "row sg-gridrow"}, 
                        
                            this.props.columns.map(function(col){
                                return (
                                React.createElement("div", {class: "{col.$getColumnClass(item)}", style: "{col.$getColumnStyle()}", title: "{col.$getText(item)}"}, 
                                    "col.$getText(item)"
                                ));
                            })
                        )
                })
            
            ));
        }
    });