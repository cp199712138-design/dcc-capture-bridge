global PHDS_MainRollout
global PHDS_ShowMainRollout

try (destroyDialog PHDS_MainRollout) catch()

rollout PHDS_MainRollout "Perfect HD Screenshot Pro" width:392 height:486
(
    local detectedSize = [0, 0]

    group "Resolution"
    (
        label lblDetected "Active viewport: not detected" align:#left
        button btnDetect "Detect Viewport" width:150 height:26 align:#left
        spinner spnWidth "Width:" range:[1,PHDS_Config.maxWidth,1920] type:#integer fieldwidth:96 align:#left
        spinner spnHeight "Height:" range:[1,PHDS_Config.maxHeight,1080] type:#integer fieldwidth:96 align:#left
        dropdownlist ddlPreset "Preset:" items:#("Viewport", "2x", "4x", "8K", "Custom") selection:1 width:150 align:#left
    )

    group "Output"
    (
        radiobuttons rbMode labels:#("Viewport Snapshot", "High Resolution Render") columns:1 default:1 align:#left
        dropdownlist ddlFormat "Format:" items:PHDS_Config.formats selection:1 width:110 align:#left
        checkbox chkAlpha "Capture Alpha" checked:false align:#left
        checkbox chkGamma "Gamma Correct" checked:true align:#left
        checkbox chkVfb "Show VFB for render" checked:false align:#left
    )

    group "Save"
    (
        edittext edtFolder "Folder:" text:(PHDS_Config.defaultOutputFolder()) width:338 align:#left
        button btnPickFolder "Pick Folder" width:90 height:24 align:#left
        edittext edtPrefix "Prefix:" text:PHDS_Config.defaultPrefix width:240 align:#left
        button btnSave "Save Image" width:160 height:34 align:#center
        label lblStatus "Ready" width:350 align:#left
    )

    fn updateDetected size =
    (
        detectedSize = size
        spnWidth.value = size.x
        spnHeight.value = size.y
        lblDetected.text = "Active viewport: " + (size.x as string) + " x " + (size.y as string)
    )

    fn detectNow =
    (
        local result = PHDS_AppService.detectViewport captureAlpha:chkAlpha.checked gammaCorrect:chkGamma.checked
        if result.ok then
        (
            updateDetected result.value
            lblStatus.text = "Viewport detected."
        )
        else
        (
            lblStatus.text = result.error
        )
    )

    fn applyPreset =
    (
        if detectedSize.x <= 0 or detectedSize.y <= 0 do detectNow()
        case ddlPreset.selection of
        (
            1: if detectedSize.x > 0 do (spnWidth.value = detectedSize.x; spnHeight.value = detectedSize.y)
            2: if detectedSize.x > 0 do (spnWidth.value = detectedSize.x * 2; spnHeight.value = detectedSize.y * 2)
            3: if detectedSize.x > 0 do (spnWidth.value = detectedSize.x * 4; spnHeight.value = detectedSize.y * 4)
            4: (spnWidth.value = 7680; spnHeight.value = 4320)
            default: ok
        )
    )

    fn buildRequest =
    (
        PHDS_Request mode:(if rbMode.state == 1 then #viewport else #render) width:spnWidth.value height:spnHeight.value folder:edtFolder.text prefix:edtPrefix.text format:PHDS_Config.formats[ddlFormat.selection] captureAlpha:chkAlpha.checked gammaCorrect:chkGamma.checked showVfb:chkVfb.checked
    )

    on btnDetect pressed do detectNow()

    on ddlPreset selected index do
    (
        applyPreset()
        lblStatus.text = "Preset applied."
    )

    on btnPickFolder pressed do
    (
        local picked = getSavePath caption:"Pick Screenshot Folder" initialDir:edtFolder.text
        if picked != undefined do edtFolder.text = picked
    )

    on btnSave pressed do
    (
        lblStatus.text = "Saving..."
        local result = PHDS_AppService.save (buildRequest())
        if result.ok then
        (
            lblStatus.text = "Saved: " + filenameFromPath result.value
            messageBox ("Saved:\n" + result.value) title:PHDS_Config.appName
        )
        else
        (
            lblStatus.text = result.error
            messageBox result.error title:PHDS_Config.appName
        )
    )

    on PHDS_MainRollout open do detectNow()
)

fn PHDS_ShowMainRollout =
(
    try (destroyDialog PHDS_MainRollout) catch()
    createDialog PHDS_MainRollout style:#(#style_titlebar, #style_sysmenu, #style_toolwindow)
)
