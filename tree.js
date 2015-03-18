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
    var workingDir = fso.getFolder(workdir);

    /* get array of all tex files under the working directory */
    var fileObjArray = [];
    var dfsListFiles = function(array, folderObj) {
        var fileCollector = new Enumerator(folderObj.files);
        for (; !fileCollector.atEnd(); fileCollector.moveNext()) {
            var fileObj = fileCollector.item();
            if ("tex" != fso.GetExtensionName(fileObj.path)) { /* ignore non-tex files */
                /* latex read files without .tex if it is included from or inputed from 
                 * some other .tex files. Exclusion here does not conflict with this spec.
                 */
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
         /* ERROR: if dependency conteins loop, this recursion would be endless. */

        /* readonly as ascii */
        var textFile = fso.OpenTextFile(fileObj.path, 1/* readonly */, false/* create? */, 0/* ascii */);
        var name = fileObj.path.replace(workingDir.path + '\\', "");
        var node = {id: fileObj.path, text: name, children: [], state: {opened: true}};
        var hasSibling = [];
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
                if ("" == fso.GetExtensionName(child)) { /* input{} allows extension be missed */
                    child = child + ".tex";
                }
            }
            else if (undefined != (child = includeRegexp.exec(line))) {
                child = child[1];
            }
            else { /* nothing hit */
                continue;
            }
            var childPath = fileObj.ParentFolder.path + "/" + child;
            if (fso.FileExists(childPath)) {
                childObj = fso.getFile(childPath);
                if (undefined === hasSibling[childObj.path]) {
                    hasSibling[childObj.path]= true;
                    isChild[childObj.path] = true;
                    node.children.push(dfsTexDependency(childObj));
                }
                else {
                    continue; /* do nothing */
                }
            }
            else {
                continue; /* do nothing -- should I alert? */ ;
            }
        }
        return(node);
    }
    for (var i = 0; i < fileObjArray.length; ++ i) {
        nodes.push(dfsTexDependency(fileObjArray[i]));
    }
    /* erase from root the nodes which are children of some other nodes */
    nodes = $.grep(nodes, function(node) {return(undefined === isChild[node.id]);});
    
    /* pass node information to jstree
     * and reconstruct the whole tree.
     *
     * what i only need to do is, according to API,
     * $(..).jstree(true).settings.core.data = nodes;
     * $(..).jstree(true).redraw(true);
     *
     * but this does not work at all.
     */
    $("#treeViewArea").jstree("destroy");
    $("#treeViewArea").jstree({core: {multiple: false, data: nodes, state: {opened: true}}});
    $("#treeViewArea").on("activate_node.jstree", function(e, data){openExternally(data.node.id); return(false);});

}
