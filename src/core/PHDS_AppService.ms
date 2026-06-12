global PHDS_AppService

struct PHDS_AppServiceStruct
(
    fn detectViewport captureAlpha:false gammaCorrect:true =
    (
        PHDS_ViewportService.detectSize captureAlpha:captureAlpha gammaCorrect:gammaCorrect
    ),

    fn validateRequest request =
    (
        if request.width < 1 or request.height < 1 then
            PHDS_Result.failure "Resolution must be greater than zero."
        else if request.width > PHDS_Config.maxWidth or request.height > PHDS_Config.maxHeight then
            PHDS_Result.failure "Resolution exceeds configured maximum."
        else
            PHDS_Result.success request
    ),

    fn save request =
    (
        local validation = validateRequest request
        if not validation.ok then return validation

        local folderResult = PHDS_PathService.ensureFolder request.folder
        if not folderResult.ok then return folderResult

        local fileResult = PHDS_PathService.buildOutputFile request.folder request.prefix request.width request.height request.format
        if not fileResult.ok then return fileResult

        if request.mode == #viewport then
        (
            local sizeResult = PHDS_ViewportService.detectSize captureAlpha:request.captureAlpha gammaCorrect:request.gammaCorrect
            if not sizeResult.ok then return sizeResult

            local actualSize = sizeResult.value
            local viewportFile = fileResult.value
            if actualSize.x != request.width or actualSize.y != request.height do
            (
                viewportFile = (PHDS_PathService.buildOutputFile request.folder request.prefix actualSize.x actualSize.y request.format).value
            )

            PHDS_ViewportService.captureToFile viewportFile captureAlpha:request.captureAlpha gammaCorrect:request.gammaCorrect
        )
        else
        (
            PHDS_RenderService.renderToFile fileResult.value request.width request.height showVfb:request.showVfb
        )
    )
)

PHDS_AppService = PHDS_AppServiceStruct()
