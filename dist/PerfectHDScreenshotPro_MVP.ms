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
global PHDS_HEADLESS_TEST

try (destroyDialog PHDS_MainRollout) catch()

struct PHDS_Result
(
    ok = false,
    value = undefined,
    error = ""
)

struct PHDS_Request
(
    mode = #pack,
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
    version = "0.4.0",
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

    fn metadataPath imagePath =
    (
        (getFilenamePath imagePath) + (getFilenameFile imagePath) + ".metadata.txt"
    ),

    fn packMetadataPath sessionPath =
    (
        pathConfig.appendPath sessionPath "metadata.txt"
    ),

    fn createSessionFolder request =
    (
        local safePrefix = if request.prefix == undefined or request.prefix == "" then "PHDS" else request.prefix
        local sessionName = safePrefix + "_session_" + timestamp()
        local sessionPath = pathConfig.appendPath request.folder sessionName
        try
        (
            makeDir sessionPath all:true
            makeDir (pathConfig.appendPath sessionPath "capture") all:true
            makeDir (pathConfig.appendPath sessionPath "ai") all:true
            success sessionPath
        )
        catch
        (
            failure ("Could not create session folder: " + sessionPath)
        )
    ),

    fn writeMetadata imagePath captureType width height =
    (
        local metaPath = metadataPath imagePath
        local f = undefined
        try
        (
            f = createFile metaPath
            format "tool=DCC Capture Bridge\n" to:f
            format "product=Perfect HD Screenshot Pro\n" to:f
            format "version=%\n" version to:f
            format "dcc=3ds Max\n" to:f
            format "capture_type=%\n" captureType to:f
            format "image_path=%\n" imagePath to:f
            format "width=%\n" width to:f
            format "height=%\n" height to:f
            format "timestamp=%\n" (timestamp()) to:f
            close f
            success metaPath
        )
        catch
        (
            try (if f != undefined do close f) catch()
            failure ("Could not write metadata: " + metaPath)
        )
    ),

    fn writePackMetadata sessionPath imagePath captureType width height =
    (
        local metaPath = packMetadataPath sessionPath
        local f = undefined
        try
        (
            f = createFile metaPath
            format "tool=DCC Capture Bridge\n" to:f
            format "product=Perfect HD Screenshot Pro\n" to:f
            format "version=%\n" version to:f
            format "dcc=3ds Max\n" to:f
            format "capture_type=%\n" captureType to:f
            format "intent=ai_readable_reference_capture\n" to:f
            format "session_path=%\n" sessionPath to:f
            format "image_path=%\n" imagePath to:f
            format "width=%\n" width to:f
            format "height=%\n" height to:f
            format "timestamp=%\n" (timestamp()) to:f
            format "notes=Viewport pixels are captured from the active viewport. No fake upscale.\n" to:f
            close f
            success metaPath
        )
        catch
        (
            try (if f != undefined do close f) catch()
            failure ("Could not write pack metadata: " + metaPath)
        )
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

    fn capturePack request =
    (
        local folder = ensureFolder request.folder
        if not folder.ok then return folder

        local session = createSessionFolder request
        if not session.ok then return session

        local bmp = grabViewport alpha:request.alpha gamma:request.gamma
        if bmp == undefined then return failure "Could not capture active viewport."

        local captureFolder = pathConfig.appendPath session.value "capture"
        local imagePath = pathConfig.appendPath captureFolder ("viewport" + extensionFor request.format)
        local saved = saveBitmap bmp imagePath
        if not saved.ok then return saved

        local meta = writePackMetadata session.value imagePath "ai_capture_pack_viewport" bmp.width bmp.height
        if not meta.ok do format "Metadata warning: %\n" meta.error

        success imagePath
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
        case request.mode of
        (
            #pack: capturePack request
            #render: renderImage request
            default: captureViewport request
        )
    )
)

PHDS = PHDS_API()

rollout PHDS_MainRollout "Perfect HD Screenshot Pro" width:440 height:610
(
    local detectedSize = [0, 0]
    local lastOutput = ""
    local lastFolder = ""

    label lblTitle "DCC Capture Bridge" align:#left
    label lblSubtitle "Viewport-first capture for reference and AI input" align:#left

    group "Capture Source"
    (
        dropdownlist ddlMode "Type:" items:#("AI Capture Pack", "Viewport Snapshot", "Production Render (current renderer)") selection:1 width:260 align:#left
        label lblViewport "Active viewport: not detected" width:350 align:#left
        button btnDetect "Detect Viewport" width:130 height:24 align:#left
        label lblModeHint "Pack saves viewport image plus metadata for AI workflows." width:360 align:#left
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
        checkbox chkMetadata "AI Ready Pack: write metadata sidecar" checked:true align:#left
        checkbox chkOpenFolder "Open folder after save" checked:false align:#left
    )

    button btnSave "Save AI Capture Pack" width:190 height:34 align:#center
    group "Result"
    (
        edittext edtLastOutput "Last:" text:"" width:390 align:#left
        button btnOpenLast "Open Last Image" width:120 height:24 align:#left
        button btnOpenFolder2 "Open Folder" width:100 height:24 align:#left
        label lblStatus "Ready" width:390 align:#left
    )

    fn isRenderMode =
    (
        ddlMode.selection == 3
    )

    fn isPackMode =
    (
        ddlMode.selection == 1
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
        chkMetadata.enabled = not (isPackMode())
        if isPackMode() do chkMetadata.checked = true

        if renderMode then
        (
            lblModeHint.text = "Uses the current 3ds Max Render Setup and renderer."
            btnSave.text = "Run Production Render"
        )
        else if isPackMode() then
        (
            lblModeHint.text = "Pack saves viewport image plus metadata for AI workflows."
            btnSave.text = "Save AI Capture Pack"
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
        PHDS_Request mode:(if isRenderMode() then #render else (if isPackMode() then #pack else #capture)) width:spnWidth.value height:spnHeight.value folder:edtFolder.text prefix:edtPrefix.text format:PHDS.formats[ddlFormat.selection] alpha:chkAlpha.checked gamma:chkGamma.checked showVfb:chkVfb.checked
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
            lastOutput = result.value
            lastFolder = if isPackMode() then (getFilenamePath (getFilenamePath result.value)) else (getFilenamePath result.value)
            edtLastOutput.text = result.value
            if (not isPackMode()) and chkMetadata.checked do
            (
                local metaWidth = if isRenderMode() then spnWidth.value else detectedSize.x
                local metaHeight = if isRenderMode() then spnHeight.value else detectedSize.y
                local metaType = if isRenderMode() then "production_render" else (if isPackMode() then "ai_capture_pack" else "viewport_snapshot")
                local meta = PHDS.writeMetadata result.value metaType metaWidth metaHeight
                if not meta.ok do format "Metadata warning: %\n" meta.error
            )
            lblStatus.text = "Saved: " + filenameFromPath result.value
            if chkOpenFolder.checked do shellLaunch lastFolder ""
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

    on btnOpenLast pressed do
    (
        if lastOutput != "" and doesFileExist lastOutput then shellLaunch lastOutput "" else messageBox "No saved image yet." title:PHDS.appName
    )

    on btnOpenFolder2 pressed do
    (
        local folderToOpen = if lastFolder != "" then lastFolder else edtFolder.text
        if folderToOpen != "" and doesFileExist folderToOpen then shellLaunch folderToOpen "" else messageBox "Output folder is not available." title:PHDS.appName
    )
)

if PHDS_HEADLESS_TEST != true do
(
    createDialog PHDS_MainRollout style:#(#style_titlebar, #style_sysmenu, #style_toolwindow)
)
