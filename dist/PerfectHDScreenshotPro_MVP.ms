/*
    DCC Capture Bridge - 3ds Max MVP
    Product label: Perfect HD Screenshot Pro
    Drag this file into a 3ds Max viewport.

    MVP focus:
    - Fast viewport snapshot for references / AI input.
    - Optional production render using the current 3ds Max Render Setup.
*/

global PHDS
global PHDS_MainRollout

try (destroyDialog PHDS_MainRollout) catch()

struct PHDS_Result
(
    ok = false,
    value = undefined,
    error = ""
)

struct PHDS_Request
(
    mode = #capture,
    width = 1920,
    height = 1080,
    folder = "",
    prefix = "PHDS",
    format = "PNG",
    alpha = false,
    gamma = true,
    showVfb = false
)

struct PHDS_API
(
    version = "0.2.0",
    appName = "Perfect HD Screenshot Pro",
    formats = #("PNG", "TIF", "JPG", "BMP"),

    fn success value =
    (
        PHDS_Result ok:true value:value error:""
    ),

    fn failure message =
    (
        PHDS_Result ok:false value:undefined error:message
    ),

    fn pad2 value =
    (
        local s = value as string
        if s.count < 2 then ("0" + s) else s
    ),

    fn timestamp =
    (
        local d = getLocalTime()
        (d[1] as string) + pad2 d[2] + pad2 d[4] + "_" + pad2 d[5] + pad2 d[6] + pad2 d[7]
    ),

    fn extensionFor formatName =
    (
        case (toUpper formatName) of
        (
            "PNG": ".png"
            "TIF": ".tif"
            "TIFF": ".tif"
            "JPG": ".jpg"
            "JPEG": ".jpg"
            "BMP": ".bmp"
            default: ".png"
        )
    ),

    fn ensureFolder folderPath =
    (
        if folderPath == undefined or folderPath == "" then
        (
            failure "Output folder is empty."
        )
        else
        (
            try
            (
                if not (doesFileExist folderPath) do makeDir folderPath all:true
                if doesFileExist folderPath then success folderPath else failure ("Output folder is not available: " + folderPath)
            )
            catch
            (
                failure ("Could not create output folder: " + folderPath)
            )
        )
    ),

    fn buildOutputPath request actualWidth:undefined actualHeight:undefined suffix:"" =
    (
        local w = if actualWidth == undefined then request.width else actualWidth
        local h = if actualHeight == undefined then request.height else actualHeight
        local safePrefix = if request.prefix == undefined or request.prefix == "" then "PHDS" else request.prefix
        local safeSuffix = if suffix == undefined or suffix == "" then "" else ("_" + suffix)
        local fileName = safePrefix + safeSuffix + "_" + (w as string) + "x" + (h as string) + "_" + timestamp() + extensionFor request.format
        success (pathConfig.appendPath request.folder fileName)
    ),

    fn grabViewport alpha:false gamma:true =
    (
        local bmp = undefined
        try
        (
            bmp = viewport.getViewportDib captureAlpha:alpha gammaCorrect:gamma
        )
        catch
        (
            try (bmp = gw.getViewportDib captureAlpha:alpha gammaCorrect:gamma) catch (bmp = undefined)
        )
        bmp
    ),

    fn detectViewportSize alpha:false gamma:true =
    (
        local bmp = grabViewport alpha:alpha gamma:gamma
        if bmp == undefined then
        (
            failure "Could not read active viewport."
        )
        else
        (
            local size = [bmp.width, bmp.height]
            close bmp
            success size
        )
    ),

    fn saveBitmap bmp filePath =
    (
        try
        (
            bmp.filename = filePath
            save bmp
            close bmp
            success filePath
        )
        catch
        (
            try (close bmp) catch()
            failure ("Could not save bitmap: " + filePath)
        )
    ),

    fn captureViewport request =
    (
        local folder = ensureFolder request.folder
        if not folder.ok then return folder

        local bmp = grabViewport alpha:request.alpha gamma:request.gamma
        if bmp == undefined then return failure "Could not capture active viewport."

        local output = buildOutputPath request actualWidth:bmp.width actualHeight:bmp.height suffix:"viewport"
        if not output.ok do
        (
            try (close bmp) catch()
            return output
        )

        saveBitmap bmp output.value
    ),

    fn renderImage request =
    (
        local folder = ensureFolder request.folder
        if not folder.ok then return folder

        local output = buildOutputPath request suffix:"render"
        if not output.ok then return output

        local bmp = undefined
        try
        (
            bmp = render outputwidth:request.width outputheight:request.height outputfile:output.value vfb:request.showVfb
            if bmp != undefined do close bmp
            success output.value
        )
        catch
        (
            if bmp != undefined do try (close bmp) catch()
            failure ("Render failed. Check the current 3ds Max Render Setup. Output: " + output.value)
        )
    ),

    fn save request =
    (
        if request.mode == #render then renderImage request else captureViewport request
    )
)

PHDS = PHDS_API()

rollout PHDS_MainRollout "Perfect HD Screenshot Pro" width:420 height:430
(
    local detectedSize = [0, 0]

    label lblTitle "DCC Capture Bridge" align:#left
    label lblSubtitle "Viewport-first capture for reference and AI input" align:#left

    group "Capture Source"
    (
        dropdownlist ddlMode "Type:" items:#("Viewport Snapshot", "Production Render (current renderer)") selection:1 width:260 align:#left
        label lblViewport "Active viewport: not detected" width:350 align:#left
        button btnDetect "Detect Viewport" width:130 height:24 align:#left
        label lblModeHint "Snapshot saves the active viewport's real pixels." width:360 align:#left
    )

    group "Render Size"
    (
        dropdownlist ddlPreset "Preset:" items:#("Current Render Size", "1920 x 1080", "3840 x 2160", "7680 x 4320", "Custom") selection:2 width:180 align:#left
        spinner spnWidth "Width:" range:[1,32768,1920] type:#integer fieldwidth:96 align:#left
        spinner spnHeight "Height:" range:[1,32768,1080] type:#integer fieldwidth:96 align:#left
        button btnRenderSetup "Open Render Setup" width:140 height:24 align:#left
    )

    group "Output"
    (
        dropdownlist ddlFormat "Format:" items:PHDS.formats selection:1 width:120 align:#left
        edittext edtFolder "Folder:" text:(getDir #image) width:350 align:#left
        button btnFolder "Pick Folder" width:90 height:24 align:#left
        edittext edtPrefix "Prefix:" text:"PHDS" width:240 align:#left
        checkbox chkAlpha "Alpha for viewport snapshot" checked:false align:#left
        checkbox chkGamma "Gamma Correct" checked:true align:#left
        checkbox chkVfb "Show VFB for render" checked:false align:#left
    )

    button btnSave "Save Viewport Snapshot" width:190 height:34 align:#center
    label lblStatus "Ready" width:360 align:#left

    fn isRenderMode =
    (
        ddlMode.selection == 2
    )

    fn syncModeUI =
    (
        local renderMode = isRenderMode()
        ddlPreset.enabled = renderMode
        spnWidth.enabled = renderMode
        spnHeight.enabled = renderMode
        btnRenderSetup.enabled = renderMode
        chkVfb.enabled = renderMode
        chkAlpha.enabled = not renderMode

        if renderMode then
        (
            lblModeHint.text = "Uses the current 3ds Max Render Setup and renderer."
            btnSave.text = "Run Production Render"
        )
        else
        (
            lblModeHint.text = "Snapshot saves the active viewport's real pixels. No fake 8K upscale."
            btnSave.text = "Save Viewport Snapshot"
        )
    )

    fn setDetected size =
    (
        detectedSize = size
        lblViewport.text = "Active viewport: " + (size.x as string) + " x " + (size.y as string)
    )

    fn detect =
    (
        local result = PHDS.detectViewportSize alpha:chkAlpha.checked gamma:chkGamma.checked
        if result.ok then
        (
            setDetected result.value
            lblStatus.text = "Viewport detected. Snapshot output will use this exact size."
        )
        else
        (
            lblStatus.text = result.error
        )
    )

    fn applyPreset =
    (
        case ddlPreset.selection of
        (
            1:
            (
                spnWidth.value = renderWidth
                spnHeight.value = renderHeight
            )
            2: (spnWidth.value = 1920; spnHeight.value = 1080)
            3: (spnWidth.value = 3840; spnHeight.value = 2160)
            4: (spnWidth.value = 7680; spnHeight.value = 4320)
            default: ok
        )
    )

    fn buildRequest =
    (
        PHDS_Request mode:(if isRenderMode() then #render else #capture) width:spnWidth.value height:spnHeight.value folder:edtFolder.text prefix:edtPrefix.text format:PHDS.formats[ddlFormat.selection] alpha:chkAlpha.checked gamma:chkGamma.checked showVfb:chkVfb.checked
    )

    on ddlMode selected index do
    (
        syncModeUI()
        lblStatus.text = "Mode changed."
    )

    on btnDetect pressed do detect()

    on ddlPreset selected index do
    (
        applyPreset()
        lblStatus.text = "Render size preset applied."
    )

    on btnRenderSetup pressed do
    (
        try (renderSceneDialog.open()) catch (messageBox "Could not open Render Setup." title:PHDS.appName)
    )

    on btnFolder pressed do
    (
        local picked = getSavePath caption:"Pick Output Folder" initialDir:edtFolder.text
        if picked != undefined do edtFolder.text = picked
    )

    on btnSave pressed do
    (
        lblStatus.text = "Working..."
        local result = PHDS.save (buildRequest())
        if result.ok then
        (
            lblStatus.text = "Saved: " + filenameFromPath result.value
            messageBox ("Saved:\n" + result.value) title:PHDS.appName
        )
        else
        (
            lblStatus.text = result.error
            messageBox result.error title:PHDS.appName
        )
    )

    on PHDS_MainRollout open do
    (
        syncModeUI()
        detect()
    )
)

createDialog PHDS_MainRollout style:#(#style_titlebar, #style_sysmenu, #style_toolwindow)
