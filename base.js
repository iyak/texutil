var workdir;
var editor;

var activateTab = function(i)
{
    $("#tabControl").children().each(function(){
        if (i == $(this).index()) $(this).show();
        else $(this).hide();
    });
    $(".controlPanelTabs:eq(" + i + ")").prop("disabled", true);
    $(".controlPanelTabs:not(:eq(" + i + "))").prop("disabled", false);
}
var setWorkdir = function(path)
{
    $("#workdirpath").val(path);
    workdir = path;
}
var setEditor = function(path)
{
    $("#editorpath").val(path);
    editor = path;
}
var selectWorkdir = function()
{
    var dialog = new ActiveXObject("Shell.Application");
    var objFolder = dialog.BrowseForFolder(0, "Working Directory", 0);
    var oFolderItem = objFolder.Items().Item();
    setWorkdir(oFolderItem.Path);
}
var selectEditor = function()
{
    $("#editorselect").trigger("click");
    var path = $("#editorselect").val();
    $("#editorpath").val(path);
    setEditor(path);
}
var saveConfig = function()
{
    workdir = $("#workdirpath").val();
    editor = $("#editorpath").val();
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var configFile = fso.OpenTextFile("./config", 2/* write only */, true/* create? */, 0/* ascii */);
    configFile.writeLine("workdir=" + workdir);
    configFile.writeLine("editor="  + editor);
    configFile.close();
}
$(function() {
    activateTab(0); /* default tab is Home */

    /* read config */
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var configFile = fso.OpenTextFile("./config", 1/* read only */, true/* create? */, 0/* ascii */);

    while(!configFile.atEndOfStream) {
        var line = configFile.readLine();
        var config = line.split('=', 2);
        switch(config[0]) {
            case "workdir":
                setWorkdir(config[1]);
                break;
            case "editor":
                setEditor(config[1]);
                break;
        }
    }
    if (undefined === workdir || "undefined" == workdir) {
        alert("select working directory");
        selectWorkdir(); /* global */
    }
    if (undefined === editor || "undefined" == editor) {
        alert("select editor");
        selectEditor(); /* global */
    }
    saveConfig();

    /* bind events and action */
    $(".controlPanelTabs").each(function(i){ $(this).on("click", function(){activateTab(i); return(false);});});
    $("input[value='ping']").on("click", function(){goPing(); return(false);});
    $("#treeView").on("beforeShow", function(){refreshTreeView(); return(false);});
    $("#refreshTree").on("click", function() {refreshTreeView(); return(false);});
    $("#workdirbutton").on("click", function(){selectWorkdir(); return (false);});
    $("#editorbutton").on("click", function() {selectEditor(); return(false);});
    $("#saveconfig").on("click", function() {saveConfig(); return(false);});
});
/* jQuery extension */
$(function($) {
    var _oldShow = $.fn.show;
    $.fn.show = function(speed, oldCallback) {
        return $(this).each(function() {
            var obj = $(this);
            var newCallback = function() {
                if ($.isFunction(oldCallback)) {
                    oldCallback.apply(obj);
                }
                obj.trigger('afterShow');
            }
            /* you can trigger a before show if you want */
            obj.trigger('beforeShow');
            /* now use the old function to show the element passing the new callback */
            _oldShow.apply(obj, [speed, newCallback]);
        });
    }
});
