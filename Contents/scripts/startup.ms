/*
    Reserved bundle startup entry.
    The drag-drop entry remains PerfectHDScreenshot_Open.ms.
*/

global PHDS_RootDir
PHDS_RootDir = getFilenamePath (getSourceFileName()) + "..\\..\\"

fileIn (PHDS_RootDir + "src\\PHDS_Loader.ms")
