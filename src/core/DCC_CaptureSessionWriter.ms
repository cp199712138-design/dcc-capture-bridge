global DCC_CaptureSessionWriter

struct DCC_CaptureSessionWriterStruct
(
    version = "0.1.0",

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

    fn createSessionRoot folder prefix =
    (
        local safePrefix = if prefix == undefined or prefix == "" then "DCC" else prefix
        local sessionPath = pathConfig.appendPath folder (safePrefix + "_session_" + timestamp())
        try
        (
            makeDir sessionPath all:true
            makeDir (pathConfig.appendPath sessionPath "capture") all:true
            makeDir (pathConfig.appendPath sessionPath "control") all:true
            makeDir (pathConfig.appendPath sessionPath "ai") all:true
            success sessionPath
        )
        catch
        (
            failure ("Could not create capture session: " + sessionPath)
        )
    ),

    fn writeTextMetadata sessionPath imagePath dcc adapterName width height =
    (
        local metaPath = pathConfig.appendPath sessionPath "metadata.txt"
        local f = undefined
        try
        (
            f = createFile metaPath
            format "schema_version=%\n" version to:f
            format "packet_version=instant_canvas.dcc_evidence.v1\n" to:f
            format "tool=DCC Capture Bridge\n" to:f
            format "dcc=%\n" dcc to:f
            format "adapter=%\n" adapterName to:f
            format "asset_type=viewport\n" to:f
            format "capture_family=viewport_pixel_capture\n" to:f
            format "image_path=%\n" imagePath to:f
            format "image_width=%\n" width to:f
            format "image_height=%\n" height to:f
            format "viewport_width=%\n" width to:f
            format "viewport_height=%\n" height to:f
            format "requested_width=\n" to:f
            format "requested_height=\n" to:f
            format "size_policy=actual_viewport_pixels\n" to:f
            format "camera_or_viewport=active_viewport\n" to:f
            format "selected_object_intent=unknown\n" to:f
            format "material_notes=not_captured_in_mvp\n" to:f
            format "quality_claim=viewport_pixels_only\n" to:f
            format "drag_drop_mvp_compatible=true\n" to:f
            format "created_at=%\n" (timestamp()) to:f
            close f
            success metaPath
        )
        catch
        (
            try (if f != undefined do close f) catch()
            failure ("Could not write metadata: " + metaPath)
        )
    )
)

DCC_CaptureSessionWriter = DCC_CaptureSessionWriterStruct()
