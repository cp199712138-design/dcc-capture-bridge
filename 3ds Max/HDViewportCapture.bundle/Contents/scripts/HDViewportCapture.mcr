macroScript HDViewportCapture
category:"HD Viewport Capture"
toolTip:"HD Viewport Capture"
buttonText:"HD Capture"
(
    global HDVC_Rollout

    fn HDVC_joinPath folder fileName =
    (
        local cleanFolder = folder
        if cleanFolder == undefined or cleanFolder == "" do cleanFolder = getDir #image
        if cleanFolder[cleanFolder.count] != "\\" and cleanFolder[cleanFolder.count] != "/" do cleanFolder += "\\"
        cleanFolder + fileName
    )

    fn HDVC_safeName value =
    (
        local result = value as string
        local badChars = #("\\", "/", ":", "*", "?", "\"", "<", ">", "|")
        for c in badChars do result = substituteString result c "_"
        result
    )

    fn HDVC_defaultBaseName =
    (
        local sceneName = getFilenameFile maxFileName
        if sceneName == undefined or sceneName == "" then "ViewportCapture" else sceneName
    )

    fn HDVC_ensureFolder folder =
    (
        if folder == undefined or folder == "" then
        (
            false
        )
        else
        (
            local directoryClass = dotNetClass "System.IO.Directory"
            if not (directoryClass.Exists folder) do makeDir folder all:true
            directoryClass.Exists folder
        )
    )

    fn HDVC_captureBitmap useWindowSnapshot gammaCorrect alpha =
    (
        local dib = undefined

        if useWindowSnapshot then
        (
            try
            (
                dib = windows.snapshot (viewport.getHWnd()) captureAlpha:alpha gammaCorrect:gammaCorrect captureScreenPixels:true
            )
            catch
            (
                dib = undefined
            )
        )

        if dib == undefined do
        (
            try
            (
                dib = viewport.getViewportDIB captureAlpha:alpha gammaCorrect:gammaCorrect
            )
            catch
            (
                try
                (
                    dib = gw.getViewportDib captureAlpha:alpha gammaCorrect:gammaCorrect
                )
                catch
                (
                    dib = gw.getViewportDib()
                )
            )
        )

        dib
    )

    fn HDVC_saveCapture outPath width height useViewportSize useWindowSnapshot gammaCorrect alpha =
    (
        local dib = HDVC_captureBitmap useWindowSnapshot gammaCorrect alpha
        if dib == undefined do throw "Could not capture the active viewport."

        local saveBmp = dib
        if not useViewportSize do
        (
            saveBmp = bitmap width height filename:outPath
            copy dib saveBmp
        )

        saveBmp.filename = outPath
        save saveBmp

        if saveBmp != dib do close saveBmp
        close dib
        gc light:true
        outPath
    )

    try destroyDialog HDVC_Rollout catch()

    rollout HDVC_Rollout "HD Viewport Capture" width:360 height:330
    (
        groupBox grpOutput "Output" pos:[10,10] width:340 height:92
        editText edtFolder "Folder:" pos:[20,32] width:270 text:(getDir #image)
        button btnBrowse "..." pos:[300,30] width:38 height:22
        editText edtBaseName "Name:" pos:[20,62] width:318 text:(HDVC_defaultBaseName())

        groupBox grpSize "Size" pos:[10,112] width:340 height:86
        checkbox chkViewportSize "Use viewport size" pos:[20,134] checked:true
        spinner spWidth "Width:" pos:[36,162] width:130 range:[1,32768,3840] type:#integer enabled:false
        spinner spHeight "Height:" pos:[188,162] width:130 range:[1,32768,2160] type:#integer enabled:false
        label lblResizeNote "Custom size resizes bitmap pixels; it is not a render." pos:[20,184] width:320

        groupBox grpOptions "Options" pos:[10,208] width:340 height:76
        dropdownList ddlFormat "Format:" pos:[20,230] width:120 items:#("png", "jpg", "tif", "bmp") selection:1
        checkbox chkGamma "Gamma correct" pos:[170,232] checked:true
        checkbox chkAlpha "Alpha" pos:[170,256] checked:false
        checkbox chkWindowSnapshot "Capture screen pixels" pos:[20,256] checked:false

        button btnCapture "Capture Active Viewport" pos:[10,294] width:220 height:28
        button btnOpenFolder "Open Folder" pos:[238,294] width:112 height:28

        local lastSavedPath = undefined

        fn updateSizeFields =
        (
            spWidth.enabled = not chkViewportSize.checked
            spHeight.enabled = not chkViewportSize.checked
        )

        fn buildOutputPath =
        (
            local ext = ddlFormat.items[ddlFormat.selection]
            local stamp = formattedPrint (timeStamp()) format:"08d"
            local fileName = (HDVC_safeName edtBaseName.text) + "_" + stamp + "." + ext
            HDVC_joinPath edtFolder.text fileName
        )

        on HDVC_Rollout open do
        (
            local viewSize = getViewSize()
            spWidth.value = viewSize.x
            spHeight.value = viewSize.y
            updateSizeFields()
        )

        on chkViewportSize changed state do updateSizeFields()

        on btnBrowse pressed do
        (
            local picked = getSavePath caption:"Choose Capture Folder" initialDir:edtFolder.text
            if picked != undefined do edtFolder.text = picked
        )

        on btnCapture pressed do
        (
            try
            (
                if not (HDVC_ensureFolder edtFolder.text) do throw "Output folder is not available."
                local outPath = buildOutputPath()
                lastSavedPath = HDVC_saveCapture outPath spWidth.value spHeight.value chkViewportSize.checked chkWindowSnapshot.checked chkGamma.checked chkAlpha.checked
                messageBox ("Saved:\n" + lastSavedPath) title:"HD Viewport Capture"
            )
            catch ex
            (
                messageBox (ex as string) title:"HD Viewport Capture Error"
            )
        )

        on btnOpenFolder pressed do
        (
            if HDVC_ensureFolder edtFolder.text do shellLaunch edtFolder.text ""
        )
    )

    createDialog HDVC_Rollout
)
