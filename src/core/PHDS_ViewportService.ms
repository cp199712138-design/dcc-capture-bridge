global PHDS_ViewportService

struct PHDS_ViewportServiceStruct
(
    fn grab captureAlpha:false gammaCorrect:true =
    (
        local bmp = undefined
        try
        (
            bmp = viewport.getViewportDib captureAlpha:captureAlpha gammaCorrect:gammaCorrect
        )
        catch
        (
            try
            (
                bmp = gw.getViewportDib captureAlpha:captureAlpha gammaCorrect:gammaCorrect
            )
            catch
            (
                bmp = undefined
            )
        )
        bmp
    ),

    fn detectSize captureAlpha:false gammaCorrect:true =
    (
        local bmp = grab captureAlpha:captureAlpha gammaCorrect:gammaCorrect
        if bmp == undefined then
        (
            PHDS_Result.failure "Could not read the active viewport."
        )
        else
        (
            local size = [bmp.width, bmp.height]
            close bmp
            PHDS_Result.success size
        )
    ),

    fn captureToFile filePath captureAlpha:false gammaCorrect:true =
    (
        local bmp = grab captureAlpha:captureAlpha gammaCorrect:gammaCorrect
        if bmp == undefined then
        (
            PHDS_Result.failure "Could not capture the active viewport."
        )
        else
        (
            try
            (
                bmp.filename = filePath
                save bmp
                close bmp
                PHDS_Result.success filePath
            )
            catch
            (
                try (close bmp) catch()
                PHDS_Result.failure ("Could not save viewport bitmap: " + filePath)
            )
        )
    )
)

PHDS_ViewportService = PHDS_ViewportServiceStruct()
