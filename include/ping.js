var goPing = function(e) {
    var WshShell = new ActiveXObject("WScript.Shell");
    var ipaddr = $("input[name='ipaddr']").val();
    var rd = $("input[name='rd']:checked").attr("value");
    var pacsize = $("select[name='pacsize'] option:selected").text();
    var command = "ping " + ipaddr + " -n " + rd + " -l " + pacsize;
    alert(command);
    var results = WshShell.Exec(command);
    $("textarea[name='kekka']").val(results.StdOut.ReadAll());
}
