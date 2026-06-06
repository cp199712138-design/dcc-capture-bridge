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
global PHDS_Floater
global PHDS_HEADLESS_TEST

try (destroyDialog PHDS_MainRollout) catch()
try (closeRolloutFloater PHDS_Floater) catch()

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
    version = "0.6.1",
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

rollout PHDS_MainRollout "DCC Capture Bridge" width:500 height:720
(
    local detectedSize = [0, 0]
    local lastOutput = ""
    local lastFolder = ""
    local language = #cn
    local canvasUrl = "https://raw.githack.com/cp199712138-design/dcc-capture-bridge/main/capture-canvas/index.html"

    label lblStudio "CAPTURE STUDIO" width:450 align:#left
    label lblTitle "DCC Capture Bridge" width:450 align:#left
    label lblSubtitle "AI capture pack from 3ds Max viewport" width:450 align:#left
    dropdownlist ddlLanguage "Language:" items:#("中文", "English") selection:1 width:130 align:#left

    group "01  Source"
    (
        dropdownlist ddlMode "Mode:" items:#("AI Capture Pack", "Viewport Snapshot", "Production Render") selection:1 width:280 align:#left
        label lblViewport "Viewport: not detected" width:430 align:#left
        label lblModeHint "Capture viewport image and metadata for AI." width:430 align:#left
        button btnDetect "Detect Viewport" width:150 height:28 align:#left
    )

    group "02  Render Options"
    (
        label lblRenderNote "Only enabled for Production Render." width:430 align:#left
        dropdownlist ddlPreset "Preset:" items:#("Current Render Size", "1920 x 1080", "3840 x 2160", "7680 x 4320", "Custom") selection:2 width:240 align:#left
        spinner spnWidth "Width:" range:[1,32768,1920] type:#integer fieldwidth:100 align:#left
        spinner spnHeight "Height:" range:[1,32768,1080] type:#integer fieldwidth:100 align:#left
        button btnRenderSetup "Render Setup" width:135 height:28 align:#left
    )

    group "03  Destination"
    (
        edittext edtFolder "Folder:" text:(getDir #image) width:440 align:#left
        button btnFolder "Pick Folder" width:120 height:28 align:#left
        edittext edtPrefix "Prefix:" text:"PHDS" width:250 align:#left
        dropdownlist ddlFormat "Format:" items:PHDS.formats selection:1 width:110 align:#left
        checkbox chkOpenFolder "Open folder after save" checked:true align:#left
    )

    button btnSave "Capture Pack" width:240 height:42 align:#center
    button btnOpenCanvas "Open Capture Canvas" width:240 height:34 align:#center
    group "04  Result"
    (
        edittext edtLastOutput "Last:" text:"" width:440 align:#left
        button btnOpenLast "Open Image" width:120 height:28 align:#left
        button btnOpenFolder2 "Open Folder" width:120 height:28 align:#left
        label lblStatus "Ready" width:430 align:#left
    )

    checkbox chkAlpha "Alpha" checked:false visible:false
    checkbox chkGamma "Gamma Correct" checked:true visible:false
    checkbox chkVfb "Show VFB" checked:false visible:false
    checkbox chkMetadata "Metadata" checked:true visible:false

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
            lblModeHint.text = if language == #cn then "使用当前 3ds Max 渲染器。" else "Use the current 3ds Max renderer."
            lblRenderNote.text = if language == #cn then "渲染尺寸只影响 Production Render。" else "Render size only affects Production Render."
            btnSave.text = if language == #cn then "开始渲染" else "Run Render"
        )
        else if isPackMode() then
        (
            lblModeHint.text = if language == #cn then "导出视口图和 metadata，提供给 AI。" else "Capture viewport image and metadata for AI."
            lblRenderNote.text = if language == #cn then "AI 捕捉包使用真实视口像素。" else "AI pack uses real viewport pixels."
            btnSave.text = if language == #cn then "捕捉 AI 图包" else "Capture Pack"
        )
        else
        (
            lblModeHint.text = if language == #cn then "保存当前视口真实像素，不做假放大。" else "Save real viewport pixels. No fake upscale."
            lblRenderNote.text = if language == #cn then "快照不使用渲染尺寸。" else "Snapshot does not use render size."
            btnSave.text = if language == #cn then "保存快照" else "Save Snapshot"
        )
    )

    fn applyLanguage =
    (
        language = if ddlLanguage.selection == 1 then #cn else #en

        if language == #cn then
        (
            lblSubtitle.text = "把 3D 视口转成 AI 可读图包"
            ddlMode.items = #("AI 捕捉包", "视口快照", "当前渲染器")
            btnDetect.text = "检测视口"
            ddlPreset.items = #("当前渲染尺寸", "1920 x 1080", "3840 x 2160", "7680 x 4320", "自定义")
            btnRenderSetup.text = "渲染设置"
            btnFolder.text = "选择目录"
            chkOpenFolder.text = "保存后打开目录"
            btnOpenLast.text = "打开图片"
            btnOpenFolder2.text = "打开目录"
            btnOpenCanvas.text = "打开画布"
            lblStatus.text = "准备就绪"
        )
        else
        (
            lblSubtitle.text = "AI capture pack from 3ds Max viewport"
            ddlMode.items = #("AI Capture Pack", "Viewport Snapshot", "Production Render")
            btnDetect.text = "Detect Viewport"
            ddlPreset.items = #("Current Render Size", "1920 x 1080", "3840 x 2160", "7680 x 4320", "Custom")
            btnRenderSetup.text = "Render Setup"
            btnFolder.text = "Pick Folder"
            chkOpenFolder.text = "Open folder after save"
            btnOpenLast.text = "Open Image"
            btnOpenFolder2.text = "Open Folder"
            btnOpenCanvas.text = "Open Capture Canvas"
            lblStatus.text = "Ready"
        )

        syncModeUI()
        if detectedSize.x > 0 do setDetected detectedSize
    )

    fn setDetected size =
    (
        detectedSize = size
        lblViewport.text = (if language == #cn then "视口: " else "Viewport: ") + (size.x as string) + " x " + (size.y as string)
    )

    fn detect =
    (
        local result = PHDS.detectViewportSize alpha:chkAlpha.checked gamma:chkGamma.checked
        if result.ok then
        (
            setDetected result.value
            lblStatus.text = if language == #cn then "已检测视口，捕捉包会使用真实尺寸。" else "Viewport detected. Pack uses this real size."
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

    fn openCaptureCanvas =
    (
        local localCanvas = ""
        try
        (
            local scriptPath = getSourceFileName()
            if scriptPath != undefined and scriptPath != "" do
            (
                local scriptFolder = getFilenamePath scriptPath
                localCanvas = pathConfig.normalizePath (pathConfig.appendPath scriptFolder "..\capture-canvas\index.html")
            )
        )
        catch()

        if localCanvas != "" and doesFileExist localCanvas then
        (
            shellLaunch localCanvas ""
        )
        else
        (
            shellLaunch canvasUrl ""
        )
    )

    fn buildRequest =
    (
        PHDS_Request mode:(if isRenderMode() then #render else (if isPackMode() then #pack else #capture)) width:spnWidth.value height:spnHeight.value folder:edtFolder.text prefix:edtPrefix.text format:PHDS.formats[ddlFormat.selection] alpha:chkAlpha.checked gamma:chkGamma.checked showVfb:chkVfb.checked
    )

    on ddlMode selected index do
    (
        syncModeUI()
        lblStatus.text = if language == #cn then "模式已切换" else "Mode changed."
    )

    on ddlLanguage selected index do applyLanguage()

    on btnDetect pressed do detect()

    on btnOpenCanvas pressed do
    (
        openCaptureCanvas()
    )

    on ddlPreset selected index do
    (
        applyPreset()
        lblStatus.text = if language == #cn then "渲染尺寸已应用" else "Render size applied."
    )

    on btnRenderSetup pressed do
    (
        try (renderSceneDialog.open()) catch (messageBox "Could not open Render Setup." title:PHDS.appName)
    )

    on btnFolder pressed do
    (
        local picked = getSavePath caption:(if language == #cn then "选择输出目录" else "Pick Output Folder") initialDir:edtFolder.text
        if picked != undefined do edtFolder.text = picked
    )

    on btnSave pressed do
    (
        lblStatus.text = if language == #cn then "处理中..." else "Working..."
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
            lblStatus.text = (if language == #cn then "已保存: " else "Saved: ") + filenameFromPath result.value
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
        applyLanguage()
        detect()
    )

    on btnOpenLast pressed do
    (
        if lastOutput != "" and doesFileExist lastOutput then shellLaunch lastOutput "" else messageBox (if language == #cn then "还没有保存图片。" else "No saved image yet.") title:PHDS.appName
    )

    on btnOpenFolder2 pressed do
    (
        local folderToOpen = if lastFolder != "" then lastFolder else edtFolder.text
        if folderToOpen != "" and doesFileExist folderToOpen then shellLaunch folderToOpen "" else messageBox (if language == #cn then "输出目录不可用。" else "Output folder is not available.") title:PHDS.appName
    )
)

if PHDS_HEADLESS_TEST != true do
(
    PHDS_Floater = newRolloutFloater "DCC Capture Bridge" 520 620 lockWidth:false lockHeight:false scrollBar:true
    addRollout PHDS_MainRollout PHDS_Floater
)
