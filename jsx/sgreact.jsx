var sgReact = React.createClass( {
    propTypes : {
        items: React.PropTypes.object.isRequired,
        columns: React.PropTypes.object.isRequired
    },

    getDefaultProps: function() {
        return { items: [], columns: [] };
    },

    render: function() {
        return (<div>
            { this.props.items.map(function(item) {
                    return <div class="row sg-gridrow">
                        {
                            this.props.columns.map(function(col){
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