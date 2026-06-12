global PHDS_RenderService

struct PHDS_RenderServiceStruct
(
    fn renderToFile filePath width height showVfb:false =
    (
        local bmp = undefined
        try
        (
            bmp = render outputwidth:width outputheight:height outputfile:filePath vfb:showVfb
            if bmp != undefined do close bmp
            PHDS_Result.success filePath
        )
        catch
        (
            if bmp != undefined do try (close bmp) catch()
            PHDS_Result.failure ("Render failed: " + filePath)
        )
    )
)

PHDS_RenderService = PHDS_RenderServiceStruct()
