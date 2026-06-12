/*
    Module loader. Keep load order explicit.
*/

global PHDS_RootDir

if PHDS_RootDir == undefined do PHDS_RootDir = getFilenamePath (getSourceFileName())

fileIn (PHDS_RootDir + "src\\core\\PHDS_Result.ms")
fileIn (PHDS_RootDir + "src\\core\\PHDS_Config.ms")
fileIn (PHDS_RootDir + "src\\core\\PHDS_Request.ms")
fileIn (PHDS_RootDir + "src\\core\\PHDS_PathService.ms")
fileIn (PHDS_RootDir + "src\\core\\PHDS_ViewportService.ms")
fileIn (PHDS_RootDir + "src\\core\\PHDS_RenderService.ms")
fileIn (PHDS_RootDir + "src\\core\\PHDS_AppService.ms")
fileIn (PHDS_RootDir + "src\\ui\\PHDS_MainRollout.ms")
