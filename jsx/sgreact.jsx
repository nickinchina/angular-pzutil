var sgReact = React.createClass( {
    propTypes : {
        items: React.PropTypes.array.isRequired,
        columns: React.PropTypes.array.isRequired
    },

    getDefaultProps: function() {
        return { items: [], columns: [] };
    },

    render: function() {
        var self = this;
        return (<div>
            { this.props.items.map(function(item) {
                    return <div class="row sg-gridrow">
                        {
                            self.props.columns.map(function(col){
                                return (
                                <div class="{col.$getColumnClass(item)}" style="{col.$getColumnStyle()}" title="{col.$getText(item)}">
                                    col.$getText(item)
                                </div>);
                            })
                        }</div>
                })
            }
            </div>);
        }
    });