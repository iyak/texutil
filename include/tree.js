var openExternally = function(fullpath)
{
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
    var editor = $("select[name='editor'] option:selected").text();
    var filename = fullpath.replace(/^.*[\\\/]/, '');
    var wshShell = new ActiveXObject("WScript.Shell");
    if (true == wshShell.appActivate(filename)) {
        return;
    }
    var objShell = new ActiveXObject("shell.application");
    objShell.ShellExecute(editor, fullpath, "", "open", 4);
}
var definitelyOpen = function(fullpath)
{
    var editor = $("select[name='editor'] option:selected").text();
    var filename = fullpath.replace(/^.*[\\\/]/, '');
    var objShell = new ActiveXObject("shell.application");
    objShell.ShellExecute(editor, fullpath, "", "open", 4);
}
var refreshTreeView = function()
{
    /* construct tree structure
     * node.id = file name with extension.
     * node.path = file directory.
     * node.children = array of children nodes.
     */
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var workingDir = fso.getFolder(".");

    /* get array of all tex files under the working directory */
    var fileObjArray = [];
    var dfsListFiles = function(array, folderObj) {
        var fileCollector = new Enumerator(folderObj.files);
        for (; !fileCollector.atEnd(); fileCollector.moveNext()) {
            var fileObj = fileCollector.item();
            if (-1 == fileObj.name.search(/\.tex$/)) { /* ignore non-tex files */
                continue;
            }
            array.push(fileObj);
        }
        var folderCollector = new Enumerator(folderObj.subFolders);
        for (; !folderCollector.atEnd(); folderCollector.moveNext()) {
            dfsListFiles(array, folderCollector.item());
        }
        return;
    }
    dfsListFiles(fileObjArray, workingDir);

    /* read tex files' dependency to pass it to jstree */
    var nodes = [];
    var isChild = [];
    var dfsTexDependency = function(fileObj) {
        /* readonly as ascii */
        var textFile = fso.OpenTextFile(fileObj.path, 1/* readonly */, false/* create? */, 0/* ascii */);
        var node = {id: fileObj.path, text: fileObj.name, children: [], state: {opened: true}};
        while(!textFile.atEndOfStream) {
            /* read line by line */
            var line = textFile.readLine();
            /* match input or include (or includegraphics??) */
            /* TODO?: support comment-out handling */
            var child;
            var inputRegexp = /\\input *\{ *(.+?) *\}/g;
            var includeRegexp = /\\include *\{ *(.+?) *\}/g;
            if (undefined != (child = inputRegexp.exec(line)/* [0] is whole matched string */)) {
                child = child[1];
                if (-1 == child.search(/\.tex$/)) { /* input{} allows for extension to be missed */
                    child = child + ".tex";
                }
            }
            else if (undefined != (child = includeRegexp.exec(line))) {
                child = child[1];
            }
            else { /* nothing hit */
                continue;
            }
            childObj = fso.getFile(fileObj.ParentFolder.path + "/" + child);
            alert(childObj.path);
            isChild[childObj.path] = true;
            node.children.push(dfsTexDependency(childObj));
        }
        return(node);
    }
    for (var i = 0; i < fileObjArray.length; ++ i) {
        nodes.push(dfsTexDependency(fileObjArray[i]));
    }
    /* erase children nodes from root */
    nodes = $.grep(nodes, function(node) {return(undefined === isChild[node.id]);});
    
    /* pass node information to jstree */
    $('#treeViewArea').jstree({core: { data: nodes}}).on("select_node.jstree", function(e, data){
        openExternally(data.node.id);
    });
}
