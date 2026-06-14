global DCC_3dsMaxAdapter

struct DCC_3dsMaxAdapterStruct
(
    name = "3dsmax",

    fn success value =
    (
        PHDS_Result ok:true value:value error:""
    ),

    fn failure message =
    (
        PHDS_Result ok:false value:undefined error:message
    ),

    fn getDccInfo =
    (
        success #("3ds Max", maxVersion())
    ),

    fn grabViewport alpha:false gamma:true =
    (
        -- Viewport pixel evidence only; this is not true high-resolution render output.
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

    fn getViewportInfo alpha:false gamma:true =
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

    fn captureViewportAsset filePath alpha:false gamma:true =
    (
        local bmp = grabViewport alpha:alpha gamma:gamma
        if bmp == undefined then return failure "Could not capture active viewport."

        try
        (
            bmp.filename = filePath
            save bmp
            local size = [bmp.width, bmp.height]
            close bmp
            success size
        )
        catch
        (
            try (close bmp) catch()
            failure ("Could not save viewport asset: " + filePath)
        )
    ),

    fn renderBeautyAsset filePath width height showVfb:false =
    (
        -- Renderer output path; quality depends on the active 3ds Max Render Setup.
        local bmp = undefined
        try
        (
            bmp = render outputwidth:width outputheight:height outputfile:filePath vfb:showVfb
            if bmp != undefined do close bmp
            success [width, height]
        )
        catch
        (
            if bmp != undefined do try (close bmp) catch()
            failure ("Render failed: " + filePath)
        )
    )
)

DCC_3dsMaxAdapter = DCC_3dsMaxAdapterStruct()
