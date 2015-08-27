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
    var drawTreeRec = function(dad, deapth, last, prefix) {
        var expand_mark = "";
        if (0 < dad.children.length) {
            expand_mark = dad.expand? "- ": "+ ";
        }
        var div = "<div class=\"filenode\""
            + " index=\"" + dad.id + "\">"
            + prefix
            + (last? "<img src=\"2.bmp\">": "<img src=\"0.bmp\">")
            + (dad.expand? "<img src=\"4.bmp\" class=\"mark\">": "<img src=\"5.bmp\" class=\"mark\">")
            + "<div class=\"name\" title=\"" + dad.path + "\">" + dad.text + "</div></div>";
        $("#treeViewArea").append(div);
        /* bind click event to file-open */
        if (dad.expand) {
            for (var i = 0; i < dad.children.length; ++ i) {
                drawTreeRec(nodes[dad.children[i]], deapth + 1, (dad.children.length-1 == i), prefix + (last? "<img src=\"3.bmp\">": "<img src=\"1.bmp\">"))
            }
        }
    }
    var rootnum = 0;
    for (var i = 0; i < nodes.length; ++ i) if (nodes[i].is_root) ++ rootnum;
    for (var i=0, j=0; j < rootnum; ++ i) {
        if (nodes[i].is_root) {
            ++ j;
            drawTreeRec(nodes[i], 0, (rootnum == j), "");
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
    $(".filenode").on({
        "mouseenter": function() {
            var i = $(this).attr("index");
            $(".filenode[index=\"" + i + "\"]>.name").css("background-color", "yellow");
        },
        "mouseleave": function() {
            var i = $(this).attr("index");
            $(".filenode[index=\"" + i + "\"]>.name").css("background-color", "white");
        }});
}
function rel2absPath(base, relative) {
    var stack = base.split(/[\/\\]/);
    var parts = relative.split(/[\/\\]/);
    /*
     * remove current file name (or empty string)
     * (omit if "base" is the current folder without trailing slash)
     */
    stack.pop();
    for (var i=0; i<parts.length; i++) {
        if (parts[i] == ".")
            continue;
        if (parts[i] == "..")
            stack.pop();
        else
            stack.push(parts[i]);
    }
    return stack.join("\\");
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
    homeoption = $("#homeoption:checked").attr("value");
    var workingDir, mainFile
    if ("workdir" == homeoption) {
        if (undefined === workdir || "undefined" == workdir || "" == workdir) {
            alert ("select working directory");
            selectWorkdir();
        }
        workingDir = fso.getFolder(workdir);
    } else {
        if (undefined === mainpath || "undefined" == mainpath || "" == mainpath) {
            alert ("select main file");
            selectMainFile();
        }
        mainFile = fso.getFile(mainpath);
        workingDir = fso.getFolder(fso.getParentFolderName(mainpath));
    }

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
    var nodes = new Array();

    var addNode = function(fileObj) {
        fullpath2id[fileObj.path] = id2fileobj.length;
        id2fileobj.push(fileObj);
        if (0 == fileObj.path.indexOf(workingDir.path)) {
            text = fileObj.path.substring(workingDir.path.length + 1);
        }
        else {
            text = fileObj.path;
        }
        var node = {
            id: nodes.length,
            text: text,
            path: fileObj.path,
            children: new Array(),
            expand: true,
            is_root: true
        };
        nodes.push(node);
        return nodes.length - 1;
    }
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
            addNode(fileObj);
        }
        var folderCollector = new Enumerator(folderObj.subFolders);
        for (; !folderCollector.atEnd(); folderCollector.moveNext()) {
            dfsListFiles(folderCollector.item());
        }
        return;
    }
    if ("workdir" == homeoption) {
        dfsListFiles(workingDir);
    } else {
        addNode(mainFile);
    }

    for (var i = 0; i < nodes.length; ++ i) {
        var fo = id2fileobj[i];
        var text;
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
            var includegRegexp = /\\includegraphics *\[.*?\] *\{ *(.+?) *\}/g;
            if (undefined != (child = inputRegexp.exec(line))) {
                child = child[1]; /* [0] is whole matched string */
                /* input{} allows extension to be missed */
                if ("" == fso.GetExtensionName(child)) {
                    child = child + ".tex";
                }
            }
            else if (undefined != (child = includeRegexp.exec(line))) {
                child = child[1];
            }
            else if (undefined != (child = includegRegexp.exec(line))) {
                /*
                 * latex does not require an extension when using includegraphics.
                 * TODO: implement this. (now texutil requires an extension)
                 */
                child = child[1];
            }
            else { /* nothing hit */
                continue;
            }
            var cfo;
            if (-1 == child.indexOf(":")) { /* relative */
                var apath = rel2absPath(fo.path, child);
                if (fso.FileExists(apath) == false) {
                    alert ("no such file: " + apath + "\ninput from: " + fo.path);
                    continue;
                }
                var cfo = fso.getFile(rel2absPath(fo.path, child));
            }
            else { /* absolute */
                if (fso.FileExists(child) == false) {
                    alert ("no such file: " + child + "\ninput from: " + fo.path);
                    continue;
                }
                var cfo = fso.getFile(child);
            }
            var id = path2id(cfo.path);
            if (undefined == id) {
                id = addNode(cfo);
            }
            if (-1 == nodes[i].children.indexOf(id)) {
                nodes[i].children.push(id);
            }
            nodes[id].is_root = false;
        }
    }
    return nodes;
}
var refreshTreeView = function()
{
    var nodes = constructTree();
    drawTree(nodes);
}
