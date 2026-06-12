global PHDS_PathService

struct PHDS_PathServiceStruct
(
    fn twoDigits value =
    (
        local s = value as string
        if s.count < 2 then ("0" + s) else s
    ),

    fn buildStamp =
    (
        local d = getLocalTime()
        ((d[1] as string) + twoDigits d[2] + twoDigits d[4] + "_" + twoDigits d[5] + twoDigits d[6] + twoDigits d[7])
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
            PHDS_Result.failure "Output folder is empty."
        )
        else
        (
            try
            (
                if not (doesFileExist folderPath) do makeDir folderPath all:true
                if doesFileExist folderPath then
                    PHDS_Result.success folderPath
                else
                    PHDS_Result.failure ("Output folder is not available: " + folderPath)
            )
            catch
            (
                PHDS_Result.failure ("Could not create output folder: " + folderPath)
            )
        )
    ),

    fn buildOutputFile folderPath prefix width height formatName =
    (
        local ext = extensionFor formatName
        local safePrefix = if prefix == undefined or prefix == "" then PHDS_Config.defaultPrefix else prefix
        local fileName = safePrefix + "_" + (width as string) + "x" + (height as string) + "_" + buildStamp() + ext
        PHDS_Result.success (pathConfig.appendPath folderPath fileName)
    )
)

PHDS_PathService = PHDS_PathServiceStruct()
