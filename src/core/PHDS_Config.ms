global PHDS_Config

struct PHDS_ConfigStruct
(
    appName = "Perfect HD Screenshot Pro",
    version = "0.2.0",
    defaultPrefix = "HD_Screenshot",
    defaultFormat = "PNG",
    maxWidth = 32768,
    maxHeight = 32768,
    formats = #("PNG", "TIF", "JPG", "BMP"),

    fn defaultOutputFolder =
    (
        getDir #image
    )
)

PHDS_Config = PHDS_ConfigStruct()
