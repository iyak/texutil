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
    var s = showFolderFileList(".");
    $("#treeViewArea").html(s);

    // bind event and action
    $(".treeViewFile .filename").each(function(i){
        $(this).on("click", function(){openExternally($(this).attr("name")); return(false);});
    });
}
