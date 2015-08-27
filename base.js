var workdir;
var mainpath;
var homeoption;

var editor;

var activateTab = function(i)
{
    $("#tabControl").children().each(function(){
        if (i == $(this).index()) $(this).show();
        else $(this).hide();
    });
}
var setHomeOption = function(option)
{
    $("#homeoption").prop("checked", false);
    $("#homeoption[value=" + option + "]").prop("checked", true);
    homeoption = option;
}
var setWorkdir = function(path)
{
    $("#workdirpath").val(path);
    workdir = path;
}
var setMainFile = function(path)
{
    $("#mainpath").val(path);
    mainpath = path;
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
var selectMainFile = function()
{
    $("#mainselect").trigger("click");
    var path = $("#mainselect").val();
    $("#mainpath").val(path);
    setMainFile(path);
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
    mainpath = $("#mainpath").val();
    editor = $("#editorpath").val();
    homeoption = $("#homeoption:checked").attr("value");
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var configFile = fso.OpenTextFile("./config", 2/* write only */, true/* create? */, 0/* ascii */);
    configFile.writeLine("homeoption=" + homeoption);
    configFile.writeLine("workdir=" + workdir);
    configFile.writeLine("mainpath=" + mainpath);
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
            case "homeoption":
                setHomeOption(config[1]);
                break;
            case "workdir":
                setWorkdir(config[1]);
                break;
            case "mainpath":
                setMainFile(config[1]);
                break;
            case "editor":
                setEditor(config[1]);
                break;
        }
    }
    if (undefined === homeoption || "undefined" == homeoption) {
        setHomeOption("workdir");
    }
    if ("mainpath" == homeoption && (undefined === mainpath || "undefined" == mainpath || "" == mainpath)) {
        alert("select main file");
        selectMainFile();
    }
    if ("workdir" == homeoption && (undefined === workdir || "undefined" == workdir || "" == workdir)) {
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
    $("#treeView").on("beforeShow", function(){refreshTreeView(); return(false);});
    $("#refreshTree").on("click", function() {refreshTreeView(); return(false);});
    $("#workdirbutton").on("click", function(){selectWorkdir(); return (false);});
    $("#editorbutton").on("click", function() {selectEditor(); return(false);});
    $("#mainbutton").on("click", function() {selectMainFile(); return(false);});
    $("#saveconfig").on("click", function() {saveConfig(); return(false);});
});
/* js extension */
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
$(function(){
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(elt /*, from*/) {
            var len = this.length >>> 0;
            var from = Number(arguments[1]) || 0;
            from = (from < 0) ? Math.ceil(from) : Math.floor(from);
            if (from < 0) {
                from += len;
            }
            for (; from < len; from++) {
                if (from in this &&
                    this[from] === elt)
                    return from;
            }
            return -1;
        };
    }
    String.prototype.repeat = function(num) {
        return new Array(num + 1).join(this);
    }
});
