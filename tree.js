var openExternally = function(fullpath) {
    /* open a file with an external application.
     * i tried shellExecute(fullpath) directly but it failed.
     * file type association does not seem available.
     * 
     * appActivate() is done to check a file is already open.
     * but it just check if one of running program's title bar
     * contains the file name.
     * it does not work in many cases so i made definitelyOpen()
     * function, in which already opened files would be opened again.
     * but is it really necessary?
     */
    var filename = fullpath.replace(/^.*[\\\/]/, '');
    var wshShell = new ActiveXObject("WScript.Shell");
    if (true == wshShell.appActivate(filename)) {
        return;
    }
    var objShell = new ActiveXObject("shell.application");
    objShell.ShellExecute(editor, fullpath, "", "open", 4);
}
var definitelyOpen = function(fullpath) {
    var editor = $("select[name='editor'] option:selected").text();
    var filename = fullpath.replace(/^.*[\\\/]/, '');
    var objShell = new ActiveXObject("shell.application");
    objShell.ShellExecute(editor, fullpath, "", "open", 4);
}
var drawTree = function(nodes) {
    $("#treeViewArea").empty();
    var drawTreeRec = function(dad, deapth) {
        var style = "margin-left:" + deapth * 30;
        var expand_mark = "";
        if (0 < dad.children.length) {
            expand_mark = dad.expand? "- ": "+ ";
        }
        var div = "<div class=\"filenode"
            + "\" index=\"" + dad.id + "\">"
            + "<span class=\"mark\" style=\"" + style
            + "\">" + expand_mark + "</span>"
            + "<span class=\"name"
            + "\">" + dad.text + "</span></div>";
        $("#treeViewArea").append(div);
        /* bind click event to file-open */
        if (dad.expand) {
            for (var i = 0; i < dad.children.length; ++ i) {
                drawTreeRec(nodes[dad.children[i]], deapth + 1);
            }
        }
    }
    for (var i = 0; i < nodes.length; ++ i) {
        if (nodes[i].is_root) {
            drawTreeRec(nodes[i], 0);
        }
    }
    $(".filenode .name").on("click", function() {
        var i = $(this).parent().attr("index");
        openExternally(nodes[i].path);
    });
    $(".filenode .mark").on("click", function() {
        var i = $(this).parent().attr("index");
        if (0 < nodes[i].children.length) {
            nodes[i].expand = !nodes[i].expand;
        }
        drawTree(nodes);
    });
}
var constructTree = function() {
    /* construct tree structure. each node have properties below.
     * node.text: text to be displayed.
     * node.id: index. nodes[node.id] returns the node itself.
     * node.path: file directory.
     * node.children: array of id of children nodes.
     * node.expand: boolean whether to expand children.
     * node.is_root: boolean whether to be a child of any nodes.
     */
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var workingDir = fso.getFolder(workdir);

    /*
     * the way to treat files is,
     * 1.path -> 2.FileObj <-> 3.fullpath <-> 4.id
     * to refer children of a node, read tex source from 2.FileObj,
     * get list of 1.path of children, convert them to 4.id.
     */
    var fullpath2id = new Object();
    var id2fileobj = new Array();
    var path2id = function(path) {
        var fo = fso.getFile(path);
        var fullpath = fo.path;
        return fullpath2id[fullpath];
    }
    var is_root = new Array();

    /* get array of all tex files under the working directory */
    var dfsListFiles = function(folderObj) {
        var fileCollector = new Enumerator(folderObj.files);
        for (; !fileCollector.atEnd(); fileCollector.moveNext()) {
            var fileObj = fileCollector.item();
            if ("tex" != fso.GetExtensionName(fileObj.path)) { /* ignore non-tex files */
                /* latex read files without .tex if it is included from or inputed from 
                 * some other .tex files. Exclusion here does not conflict with this spec.
                 */
                continue;
            }
            fullpath2id[fileObj.path] = id2fileobj.length;
            id2fileobj.push(fileObj);
            is_root.push(true);
        }
        var folderCollector = new Enumerator(folderObj.subFolders);
        for (; !folderCollector.atEnd(); folderCollector.moveNext()) {
            dfsListFiles(folderCollector.item());
        }
        return;
    }
    dfsListFiles(workingDir);

    var n = id2fileobj.length;
    var nodes = new Array();
    for (var i = 0; i < n; ++ i) {
        var fo = id2fileobj[i];
        var node = {
            id: i,
            text: fo.name,
            path: fo.path,
            children: new Array(),
            expand: true,
            is_root: true
        };
        var tex = fso.OpenTextFile(fo.path, 1/* readonly */, false/* create? */, 0/* ascii */);
        var comment = false;
        while(!tex.atEndOfStream) {
            var line = tex.readLine();
            /* match input or include (or includegraphics??) */
            /* ignore characters after %, not folloing \(escape) */
            line = line.replace(/([^\\])%.+$/,"$1");
            line = line.replace(/^%.+$/,"");

            /* latex is not cleaver enough to understand nested comment block.
             * neither do i.
             */
            if (-1 != line.search(/\\begin *\{ *comment *\}/)) {
                comment = true;
            }
            if (-1 != line.search(/\\end *\{ *comment *\}/)) {
                comment = false;
            }
            line = line.replace(/\\begin *\{ *comment *\}.*?\\end *\{ *comment *\}/,""); /* in one line */
            if (comment) {
                continue;
            }

            var child;
            var inputRegexp = /\\input *\{ *(.+?) *\}/g;
            var includeRegexp = /\\include *\{ *(.+?) *\}/g;
            if (undefined != (child = inputRegexp.exec(line))) {
                child = child[1]; /* [0] is whole matched string */
                /* input{} allows extension be missed */
                if ("" == fso.GetExtensionName(child)) {
                    child = child + ".tex";
                }
            }
            else if (undefined != (child = includeRegexp.exec(line))) {
                child = child[1];
            }
            else { /* nothing hit */
                continue;
            }
            var childPath = fo.ParentFolder.path + "/" + child;
            var id = path2id(childPath);
            if (-1 == node.children.indexOf(id))
                node.children.push(id);
            is_root[id] = false;
        }
        nodes.push(node);
    }
    for (var i = 0; i < nodes.length; ++ i) {
        nodes[i].is_root = is_root[nodes[i].id];
    }
    return nodes;
}
var refreshTreeView = function()
{
    var nodes = constructTree();
    drawTree(nodes);
}
