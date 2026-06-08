Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

here = fso.GetParentFolderName(WScript.ScriptFullName)
node = "C:\Program Files\nodejs\node.exe"
If Not fso.FileExists(node) Then
  node = "node"
End If

shell.CurrentDirectory = here
command = """" & node & """ serve-static.mjs"
shell.Run command, 0, False
WScript.Sleep 1000
shell.Run "http://127.0.0.1:8765/index.html", 1, False
