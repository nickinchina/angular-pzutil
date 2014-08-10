/**
 * Created by gordon on 2014/4/16.
 */
angular.module('pzutil.tree', [])
    .factory('zTreeHelper', [function () {
        var buildTreeHelper = function(items, parentItem, ForeignKeyValue, ForeignKey, recursive, pos) {
            var r = _.filter(items, function (i) {
                var pid = i.parentid ? i.parentid : 0;
                if (ForeignKey) {
                    if (parentItem == null)
                        return i[ForeignKey] == ForeignKeyValue && pid == 0;
                    else
                        return pid == parentItem.id && i[ForeignKey] == ForeignKeyValue;
                }
                else
                    return (parentItem == null ?pid == 0 :pid == parentItem.id);
            });
            r = _.sortBy(_.sortBy(r, 'name'), 'position');
            if (parentItem != null)
                parentItem.children = r;

            if (recursive || pos) {
                var pos = 1;
                _(r).forEach(function (i) {
                    if (pos)
                        i.position = pos;
                    if (recursive)
                        buildTreeHelper(items, i, ForeignKeyValue, ForeignKey, recursive, pos);
                    pos++;
                });
            }
            return r;
        };

        var buildDropdownListHelper = function(result, ForeignKey, breadcrumb, items) {
            _(items).forEach(function(i) {
                var text = breadcrumb + i.name;
                if (i[ForeignKey])
                    result.push({id : i.id, name: text});

                buildDropdownListHelper(result,ForeignKey, i.id ? text + " >> " :"", i.children);
            });
        }

        var findBuddy = function(primary, foreign, foreignKey, item, up) {
            var fk = item[foreignKey];
            var pid = 0;
            var col;
            if (fk) {
                pid =  item.parentid ? item.parentid : 0;
                col = (pid==0 ? _.find(primary, { id : fk }): _.find(foreign, { id : pid  })).children;
            }
            else
                col = primary;
            if (up)
                return _.findLast(col, function(i) {
                    var pid2 = i.parentid ? i.parentid : 0 ;
                    console.log(i.position.toString() + ':' + item.position.toString());
                    return (pid==pid2 && i.position<item.position) ;
                });
            else
                return _.find(col, function(i) {
                    var pid2 = i.parentid ? i.parentid : 0 ;
                    return (pid==pid2 && i.position>item.position) ;
                });
        };
        var getMaxId = function(array) {
            return uuid.v4();
        };
        var service = {
            updateTreeValue : function(o, propName, treeValue, replace){
                if (replace)
                    o[propName] =  treeValue;
                else {
                    var v = o[propName];
                    if (v){
                        var vArray = v.split(',');
                        _(treeValue.split(',')).forEach(function(i){
                            if (vArray.indexOf(i)<0){
                                vArray.push(i);
                            }
                        });
                        o[propName] =  vArray.join(',');
                    }
                    else
                        o[propName] =  treeValue;
                }
            },
            buildTree : function(primary, foreign, foreignKey, recursive, pos)
            {
                if (foreignKey) {
                    var position = 1;
                    if (pos)
                        primary.sort(function(a,b){
                            return (a.position - b.position);
                        });
                    _(primary).forEach(function(obj){
                        if (pos)
                            obj.position = position;
                        obj.children = buildTreeHelper(foreign, null, obj.id, foreignKey, recursive, pos);
                        position++;
                    });
                }
                else
                    buildTreeHelper(foreign, null, null, foreignKey, recursive, pos);
            },

            addTreeItem : function(item, primary, foreign, foreignKey, primaryFactory, foreignFactory, cb)
            {
                if (item) {
                    if (item.root && primaryFactory) {
                        var i = primaryFactory();
                        i.children= [];
                        i.id = getMaxId(primary);
                        primary.push(i);
                    }
                    else {
                        var i = foreignFactory();
                        i.children= [];
                        i.id = getMaxId(foreign);
                        if (foreignKey) {
                            if (item[foreignKey])
                            {
                                i[foreignKey] = item[foreignKey];
                                i.parentid = item.id;
                            }
                            else {
                                i[foreignKey] =  item.id;
                            }
                        }
                        else
                        {
                            if (!item.root)
                                i.parentid = item.id;
                        }
                        foreign.push(i);
                    }
                    cb();
                }
            },

            moveTreeItem : function(primary, foreign, foreignKey, item, up, cb) {
                var buddy = findBuddy(primary, foreign, foreignKey, item, up);
                if (buddy)
                {
                    var pos = item.position;
                    item.position = buddy.position;
                    buddy.position = pos;
                    cb();
                }
            },
            buildDropdownList : function(foreignKey, items) {
                var r = [];
                buildDropdownListHelper(r, foreignKey, '', items);
                return r;
            }
        };
        return service;
    }]);