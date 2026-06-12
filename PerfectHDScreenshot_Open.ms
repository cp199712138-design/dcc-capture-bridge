/*
    Perfect HD Screenshot Pro
    Drag this file into a 3ds Max viewport to open the tool.
*/

global PHDS_RootDir

PHDS_RootDir = getFilenamePath (getSourceFileName())
fileIn (PHDS_RootDir + "src\\PHDS_Loader.ms")
PHDS_ShowMainRollout()
