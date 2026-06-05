/*
    Perfect HD Screenshot Pro - MVP
    Drag this file into a 3ds Max viewport.

    Scope:
    - Detect active viewport size.
    - Save active viewport bitmap.
    - Render active view/camera at selected size.
    - Keep UI thin and core API reusable.
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
    version = "0.1.0",
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
                if doesFileExist folderPath then
                    success folderPath
                else
                    failure ("Output folder is not available: " + folderPath)
            )
            catch
            (
                failure ("Could not create output folder: " + folderPath)
            )
        )
    ),

    fn buildOutputPath request actualWidth:undefined actualHeight:undefined =
    (
        local w = if actualWidth == undefined then request.width else actualWidth
        local h = if actualHeight == undefined then request.height else actualHeight
        local safePrefix = if request.prefix == undefined or request.prefix == "" then "PHDS" else request.prefix
        local fileName = safePrefix + "_" + (w as string) + "x" + (h as string) + "_" + timestamp() + extensionFor request.format
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

        local output = buildOutputPath request actualWidth:bmp.width actualHeight:bmp.height
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

        local output = buildOutputPath request
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
            failure ("Render failed: " + output.value)
        )
    ),

    fn save request =
    (
        if request.mode == #render then renderImage request else captureViewport request
    )
)

PHDS = PHDS_API()

rollout PHDS_MainRollout "Perfect HD Screenshot Pro" width:408 height:492
(
    local detectedSize = [0, 0]

    group "Mode"
    (
        radiobuttons rbMode labels:#("Capture Viewport", "High-res Render") columns:2 default:1 align:#left
        label lblFuture "AI pipeline: planned, not connected" align:#left
    )

    group "Viewport"
    (
        label lblViewport "Active viewport: not detected" align:#left
        button btnDetect "Detect Viewport" width:140 height:26 align:#left
    )

    group "Resolution"
    (
        dropdownlist ddlPreset "Preset:" items:#("Viewport", "2x", "4K 3840x2160", "8K 7680x4320", "Custom") selection:1 width:180 align:#left
        spinner spnWidth "Width:" range:[1,32768,1920] type:#integer fieldwidth:96 align:#left
        spinner spnHeight "Height:" range:[1,32768,1080] type:#integer fieldwidth:96 align:#left
    )

    group "Output"
    (
        dropdownlist ddlFormat "Format:" items:PHDS.formats selection:1 width:120 align:#left
        edittext edtFolder "Folder:" text:(getDir #image) width:350 align:#left
        button btnFolder "Pick Folder" width:90 height:24 align:#left
        edittext edtPrefix "Prefix:" text:"PHDS" width:240 align:#left
        checkbox chkAlpha "Alpha" checked:false align:#left
        checkbox chkGamma "Gamma Correct" checked:true align:#left
        checkbox chkVfb "Show VFB for render" checked:false align:#left
    )

    group "Action"
    (
        button btnSave "Save Image" width:160 height:34 align:#center
        label lblStatus "Ready" width:350 align:#left
    )

    fn setDetected size =
    (
        detectedSize = size
        spnWidth.value = size.x
        spnHeight.value = size.y
        lblViewport.text = "Active viewport: " + (size.x as string) + " x " + (size.y as string)
    )

    fn detect =
    (
        local result = PHDS.detectViewportSize alpha:chkAlpha.checked gamma:chkGamma.checked
        if result.ok then
        (
            setDetected result.value
            lblStatus.text = "Viewport detected."
        )
        else
        (
            lblStatus.text = result.error
        )
    )

    fn applyPreset =
    (
        if detectedSize.x <= 0 or detectedSize.y <= 0 do detect()
        case ddlPreset.selection of
        (
            1: if detectedSize.x > 0 do (spnWidth.value = detectedSize.x; spnHeight.value = detectedSize.y)
            2: if detectedSize.x > 0 do (spnWidth.value = detectedSize.x * 2; spnHeight.value = detectedSize.y * 2)
            3: (spnWidth.value = 3840; spnHeight.value = 2160)
            4: (spnWidth.value = 7680; spnHeight.value = 4320)
            default: ok
        )
    )

    fn buildRequest =
    (
        PHDS_Request mode:(if rbMode.state == 2 then #render else #capture) width:spnWidth.value height:spnHeight.value folder:edtFolder.text prefix:edtPrefix.text format:PHDS.formats[ddlFormat.selection] alpha:chkAlpha.checked gamma:chkGamma.checked showVfb:chkVfb.checked
    )

    on btnDetect pressed do detect()

    on ddlPreset selected index do
    (
        applyPreset()
        lblStatus.text = "Preset applied."
    )

    on btnFolder pressed do
    (
        local picked = getSavePath caption:"Pick Output Folder" initialDir:edtFolder.text
        if picked != undefined do edtFolder.text = picked
    )

    on btnSave pressed do
    (
        lblStatus.text = "Saving..."
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

    on PHDS_MainRollout open do detect()
)

createDialog PHDS_MainRollout style:#(#style_titlebar, #style_sysmenu, #style_toolwindow)
