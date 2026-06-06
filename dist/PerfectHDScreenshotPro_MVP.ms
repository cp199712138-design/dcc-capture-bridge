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
    version = "0.4.1",
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

rollout PHDS_MainRollout "DCC Capture Bridge" width:520 height:560
(
    local detectedSize = [0, 0]
    local lastOutput = ""
    local lastFolder = ""

    label lblTitle "DCC Capture Bridge / AI 捕捉桥" width:470 align:#left
    label lblSubtitle "从 3ds Max 视口导出 AI 可读图包 / AI-ready viewport capture pack" width:470 align:#left

    group "1. 捕捉来源 / Capture"
    (
        dropdownlist ddlMode "模式 / Mode:" items:#("AI 捕捉包 / AI Capture Pack", "视口快照 / Viewport Snapshot", "当前渲染器 / Production Render") selection:1 width:330 align:#left
        label lblViewport "视口 / Viewport: 未检测" width:430 align:#left
        button btnDetect "检测视口 / Detect" width:150 height:26 align:#left
        label lblModeHint "生成视口图 + metadata，作为后续 AI 输入。" width:450 align:#left
    )

    group "2. 渲染尺寸 / Render Size"
    (
        label lblRenderNote "只在 Production Render 模式启用；AI 捕捉包使用真实视口像素。" width:450 align:#left
        dropdownlist ddlPreset "预设 / Preset:" items:#("当前渲染尺寸 / Current Render Size", "1920 x 1080", "3840 x 2160", "7680 x 4320", "自定义 / Custom") selection:2 width:260 align:#left
        spinner spnWidth "宽 / Width:" range:[1,32768,1920] type:#integer fieldwidth:96 align:#left
        spinner spnHeight "高 / Height:" range:[1,32768,1080] type:#integer fieldwidth:96 align:#left
        button btnRenderSetup "打开渲染设置 / Render Setup" width:190 height:26 align:#left
    )

    group "3. 输出 / Output"
    (
        dropdownlist ddlFormat "格式 / Format:" items:PHDS.formats selection:1 width:120 align:#left
        edittext edtFolder "目录 / Folder:" text:(getDir #image) width:430 align:#left
        button btnFolder "选择目录 / Pick Folder" width:160 height:26 align:#left
        edittext edtPrefix "命名 / Prefix:" text:"PHDS" width:260 align:#left
        checkbox chkAlpha "透明通道 / Alpha" checked:false align:#left
        checkbox chkGamma "Gamma 校正 / Gamma Correct" checked:true align:#left
        checkbox chkVfb "显示 VFB / Show VFB" checked:false align:#left
        checkbox chkMetadata "写入 metadata / Metadata sidecar" checked:true align:#left
        checkbox chkOpenFolder "保存后打开目录 / Open folder after save" checked:false align:#left
    )

    button btnSave "保存 AI 捕捉包 / Save Pack" width:230 height:36 align:#center
    group "4. 结果 / Result"
    (
        edittext edtLastOutput "最近 / Last:" text:"" width:430 align:#left
        button btnOpenLast "打开图片 / Open Image" width:150 height:26 align:#left
        button btnOpenFolder2 "打开目录 / Open Folder" width:150 height:26 align:#left
        label lblStatus "准备就绪 / Ready" width:450 align:#left
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
            lblModeHint.text = "使用当前 3ds Max 渲染设置和渲染器。"
            btnSave.text = "执行渲染 / Render"
        )
        else if isPackMode() then
        (
            lblModeHint.text = "生成视口图 + metadata，作为后续 AI 输入。"
            btnSave.text = "保存 AI 捕捉包 / Save Pack"
        )
        else
        (
            lblModeHint.text = "保存当前视口真实像素，不做假的 4K/8K 放大。"
            btnSave.text = "保存视口快照 / Save Snapshot"
        )
    )

    fn setDetected size =
    (
        detectedSize = size
        lblViewport.text = "视口 / Viewport: " + (size.x as string) + " x " + (size.y as string)
    )

    fn detect =
    (
        local result = PHDS.detectViewportSize alpha:chkAlpha.checked gamma:chkGamma.checked
        if result.ok then
        (
            setDetected result.value
            lblStatus.text = "已检测视口；AI 捕捉包会使用这个真实尺寸。"
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
        lblStatus.text = "模式已切换 / Mode changed."
    )

    on btnDetect pressed do detect()

    on ddlPreset selected index do
    (
        applyPreset()
        lblStatus.text = "渲染尺寸已应用 / Render size applied."
    )

    on btnRenderSetup pressed do
    (
        try (renderSceneDialog.open()) catch (messageBox "Could not open Render Setup." title:PHDS.appName)
    )

    on btnFolder pressed do
    (
        local picked = getSavePath caption:"Pick Output Folder / 选择输出目录" initialDir:edtFolder.text
        if picked != undefined do edtFolder.text = picked
    )

    on btnSave pressed do
    (
        lblStatus.text = "处理中 / Working..."
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
            lblStatus.text = "已保存 / Saved: " + filenameFromPath result.value
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
        if lastOutput != "" and doesFileExist lastOutput then shellLaunch lastOutput "" else messageBox "No saved image yet. / 还没有保存图片。" title:PHDS.appName
    )

    on btnOpenFolder2 pressed do
    (
        local folderToOpen = if lastFolder != "" then lastFolder else edtFolder.text
        if folderToOpen != "" and doesFileExist folderToOpen then shellLaunch folderToOpen "" else messageBox "Output folder is not available. / 输出目录不可用。" title:PHDS.appName
    )
)

if PHDS_HEADLESS_TEST != true do
(
    createDialog PHDS_MainRollout style:#(#style_titlebar, #style_sysmenu, #style_toolwindow)
)
