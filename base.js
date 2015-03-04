var activateTab = function(i) {
    $("#tabControl").children().each(function(){
        if (i == $(this).index()) $(this).show();
        else $(this).hide();
    });
    $(".controlPanelTabs:eq(" + i + ")").prop("disabled", true);
    $(".controlPanelTabs:not(:eq(" + i + "))").prop("disabled", false);
}

$(function() {
    activateTab(0); // default tab is Home
    
    // bind events and action
    $(".controlPanelTabs").each(function(i){
        $(this).on("click", function(){activateTab(i); return(false);});
    });
    $("input[value='ping']").on("click", function(){goPing(); return(false);});
    $("#treeView").bind("beforeShow", function(){refreshTreeView(); return(false);});
});

// jQuery extension
$(function($) {
  var _oldShow = $.fn.show;
  $.fn.show = function(speed, oldCallback) {
    return $(this).each(function() {
      var obj         = $(this),
          newCallback = function() {
            if ($.isFunction(oldCallback)) {
              oldCallback.apply(obj);
            }
            obj.trigger('afterShow');
          };
      // you can trigger a before show if you want
      obj.trigger('beforeShow');
      // now use the old function to show the element passing the new callback
      _oldShow.apply(obj, [speed, newCallback]);
    });
  }
});
