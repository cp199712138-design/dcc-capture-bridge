Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

here = fso.GetParentFolderName(WScript.ScriptFullName)
node = "C:\Program Files\nodejs\node.exe"
If Not fso.FileExists(node) Then
  node = "node"
End If

shell.CurrentDirectory = here
ready = False
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP")
http.open "GET", "http://127.0.0.1:8765/api/status", False
http.setTimeouts 500, 500, 1000, 1000
http.send
ready = (http.status = 200)
On Error GoTo 0

If Not ready Then
  command = "cmd.exe /c start ""DCC Capture Canvas"" /D """ & here & """ /min """ & node & """ serve-static.mjs"
  shell.Run command, 0, False
  WScript.Sleep 1500
End If
shell.Run "http://127.0.0.1:8765/index.html", 1, False
