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

var putLinkToFilename = function(fobj)
{
    /* construct clickable file tiles.
    */
    var fullpath = fobj.path.replace(/\\/g, "\\\\");
    var link = "<span class=\"treeViewFile\">"
        + "<span class=\"filename\""
        + "name=\"" + fullpath + "\">"
        + fobj.Name
        + "</span></span>";
    return(link);
}
var showFolderFileList = function(folderspec)
{
    /* get file system information here and pass it to other functions
    */
    var fso, f, fc, s;
    fso = new ActiveXObject("Scripting.FileSystemObject");
    f = fso.GetFolder(folderspec);
    fc = new Enumerator(f.files);
    s = "";
    for (; !fc.atEnd(); fc.moveNext())
    {
        s += putLinkToFilename(fc.item());
        s += "<br>";
    }
    return(s);
}
var refreshTreeView = function()
{
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var dir = fso.GetFolder(".");
    var file = new Enumerator(dir.files);
    var nodes = [];
    var isChild = [];
    var dfs = function(node) {
        //alert(JSON.stringify(node));
        /* readonly as ascii */
        var textFile = fso.OpenTextFile(node.id, 1, true, 0);
        while(!textFile.AtEndOfStream) {
            /* line by line */
            var line = textFile.readLine();
            /* match input or include (or includegraphics??) */
            /* TODO?: support comment-out handling */
            var inputRe = /\\input\{(.+?)\}|\\include\{(.+?)\}/g;
            var match = inputRe.exec(line);
            if (null === match) { /* not hit */
                continue;
            }
            match.splice(0,1); /* first element is whole matching string so remove it */
            match = $.grep(match, function(n) {return(n);}); /* erase undefined elements */

            /* create new child node */
            var child = {id: match[0], text: match[0], children: [], state: {opened: true}};            
            isChild[match[0]] = true;

            dfs(child);
            node.children.push(child);
        }
    }
    for (; !file.atEnd(); file.moveNext())
    {
        /* ignore files without .tex extension */
        if (-1 == file.item().name.search(/\.tex$/)) {
            continue;
        }

        /* create new node of jstree */
        var node = {id: file.item().name, text: file.item().name, children: [], state: {opened: true}};
        dfs(node);
        nodes.push(node);
    }
    /* erase children nodes from root */
    nodes = $.grep(nodes, function(node) {return(undefined === isChild[node.id]);});
    
    $('#treeViewArea').jstree({core: { data: nodes}}).on("select_node.jstree", function(e, data){
        openExternally(data.node.text);
    });
}
