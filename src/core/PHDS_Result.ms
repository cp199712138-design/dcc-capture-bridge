global PHDS_Result

struct PHDS_ResultStruct
(
    ok = false,
    value = undefined,
    error = "",

    fn success resultValue =
    (
        PHDS_ResultStruct ok:true value:resultValue error:""
    ),

    fn failure message =
    (
        PHDS_ResultStruct ok:false value:undefined error:message
    )
)

PHDS_Result = PHDS_ResultStruct()
