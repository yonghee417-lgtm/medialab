; ============================================================
;  MediaLab — NSIS custom installer extension
;  Adds a "File Association" page (assisted installer) where
;  the user can pick which audio/video extensions should be
;  associated with MediaLab. Group checkboxes auto-toggle all
;  individual items, and users can fine-tune per extension.
; ============================================================

!include "nsDialogs.nsh"
!include "LogicLib.nsh"

; --- Dialog handle ---
Var FA_Dialog

; --- Group "select all" checkboxes ---
Var FA_ChkAllAudio
Var FA_ChkAllVideo

; --- Audio extension checkbox handles ---
Var FA_ChkMp3
Var FA_ChkFlac
Var FA_ChkM4a
Var FA_ChkWav
Var FA_ChkOgg
Var FA_ChkOpus
Var FA_ChkAac
Var FA_ChkWma
Var FA_ChkAiff

; --- Video extension checkbox handles ---
Var FA_ChkMp4
Var FA_ChkM4v
Var FA_ChkMkv
Var FA_ChkWebm
Var FA_ChkMov
Var FA_ChkAvi
Var FA_ChkWmv
Var FA_ChkFlv
Var FA_ChkTs
Var FA_ChkMpg
Var FA_Chk3gp

; --- Saved states (1 = checked) used in customInstall ---
Var FA_StMp3
Var FA_StFlac
Var FA_StM4a
Var FA_StWav
Var FA_StOgg
Var FA_StOpus
Var FA_StAac
Var FA_StWma
Var FA_StAiff
Var FA_StMp4
Var FA_StM4v
Var FA_StMkv
Var FA_StWebm
Var FA_StMov
Var FA_StAvi
Var FA_StWmv
Var FA_StFlv
Var FA_StTs
Var FA_StMpg
Var FA_St3gp

; ============================================================
;  Custom Page — inserted after Choose Install Location
;  (only in installer build; uninstaller doesn't use this page)
; ============================================================
!ifndef BUILD_UNINSTALLER

!macro customPageAfterChangeDir
  Page custom FA_PageCreate FA_PageLeave
!macroend

Function FA_PageCreate
  nsDialogs::Create 1018
  Pop $FA_Dialog
  ${If} $FA_Dialog == error
    Abort
  ${EndIf}

  ; Title label (replaces MUI_HEADER_TEXT — that macro is unavailable at custom-include time)
  ${NSD_CreateLabel} 0u 0u 100% 12u "파일 형식 연결"
  Pop $0
  CreateFont $1 "$(^Font)" 11 700
  SendMessage $0 ${WM_SETFONT} $1 1

  ${NSD_CreateLabel} 0u 14u 100% 22u "체크된 형식의 파일은 더블클릭 시 자동으로 미디어랩에서 열립니다.$\r$\n그룹 체크박스로 일괄 선택, 개별 체크박스로 세부 조정도 가능합니다."
  Pop $0

  ; ---------- 음악 파일 그룹 ----------
  ${NSD_CreateGroupBox} 0u 40u 49% 130u "음악 파일"
  Pop $0

  ${NSD_CreateCheckbox} 4% 54u 41% 11u "음악 파일 모두 선택"
  Pop $FA_ChkAllAudio
  ${NSD_SetState} $FA_ChkAllAudio ${BST_CHECKED}
  ${NSD_OnClick} $FA_ChkAllAudio FA_OnAllAudio

  ${NSD_CreateCheckbox} 8% 70u 18% 10u ".mp3"
  Pop $FA_ChkMp3
  ${NSD_SetState} $FA_ChkMp3 ${BST_CHECKED}

  ${NSD_CreateCheckbox} 27% 70u 18% 10u ".flac"
  Pop $FA_ChkFlac
  ${NSD_SetState} $FA_ChkFlac ${BST_CHECKED}

  ${NSD_CreateCheckbox} 8% 82u 18% 10u ".m4a"
  Pop $FA_ChkM4a
  ${NSD_SetState} $FA_ChkM4a ${BST_CHECKED}

  ${NSD_CreateCheckbox} 27% 82u 18% 10u ".wav"
  Pop $FA_ChkWav
  ${NSD_SetState} $FA_ChkWav ${BST_CHECKED}

  ${NSD_CreateCheckbox} 8% 94u 18% 10u ".ogg"
  Pop $FA_ChkOgg
  ${NSD_SetState} $FA_ChkOgg ${BST_CHECKED}

  ${NSD_CreateCheckbox} 27% 94u 18% 10u ".opus"
  Pop $FA_ChkOpus
  ${NSD_SetState} $FA_ChkOpus ${BST_CHECKED}

  ${NSD_CreateCheckbox} 8% 106u 18% 10u ".aac"
  Pop $FA_ChkAac
  ${NSD_SetState} $FA_ChkAac ${BST_CHECKED}

  ${NSD_CreateCheckbox} 27% 106u 18% 10u ".wma"
  Pop $FA_ChkWma
  ${NSD_SetState} $FA_ChkWma ${BST_CHECKED}

  ${NSD_CreateCheckbox} 8% 118u 18% 10u ".aiff"
  Pop $FA_ChkAiff
  ${NSD_SetState} $FA_ChkAiff ${BST_CHECKED}

  ; ---------- 영상 파일 그룹 ----------
  ${NSD_CreateGroupBox} 51% 40u 49% 130u "영상 파일"
  Pop $0

  ${NSD_CreateCheckbox} 55% 54u 41% 11u "영상 파일 모두 선택"
  Pop $FA_ChkAllVideo
  ${NSD_SetState} $FA_ChkAllVideo ${BST_CHECKED}
  ${NSD_OnClick} $FA_ChkAllVideo FA_OnAllVideo

  ${NSD_CreateCheckbox} 59% 70u 18% 10u ".mp4"
  Pop $FA_ChkMp4
  ${NSD_SetState} $FA_ChkMp4 ${BST_CHECKED}

  ${NSD_CreateCheckbox} 78% 70u 18% 10u ".mkv"
  Pop $FA_ChkMkv
  ${NSD_SetState} $FA_ChkMkv ${BST_CHECKED}

  ${NSD_CreateCheckbox} 59% 82u 18% 10u ".webm"
  Pop $FA_ChkWebm
  ${NSD_SetState} $FA_ChkWebm ${BST_CHECKED}

  ${NSD_CreateCheckbox} 78% 82u 18% 10u ".mov"
  Pop $FA_ChkMov
  ${NSD_SetState} $FA_ChkMov ${BST_CHECKED}

  ${NSD_CreateCheckbox} 59% 94u 18% 10u ".avi"
  Pop $FA_ChkAvi
  ${NSD_SetState} $FA_ChkAvi ${BST_CHECKED}

  ${NSD_CreateCheckbox} 78% 94u 18% 10u ".wmv"
  Pop $FA_ChkWmv
  ${NSD_SetState} $FA_ChkWmv ${BST_CHECKED}

  ${NSD_CreateCheckbox} 59% 106u 18% 10u ".flv"
  Pop $FA_ChkFlv
  ${NSD_SetState} $FA_ChkFlv ${BST_CHECKED}

  ${NSD_CreateCheckbox} 78% 106u 18% 10u ".m4v"
  Pop $FA_ChkM4v
  ${NSD_SetState} $FA_ChkM4v ${BST_CHECKED}

  ${NSD_CreateCheckbox} 59% 118u 18% 10u ".ts"
  Pop $FA_ChkTs
  ${NSD_SetState} $FA_ChkTs ${BST_CHECKED}

  ${NSD_CreateCheckbox} 78% 118u 18% 10u ".mpg"
  Pop $FA_ChkMpg
  ${NSD_SetState} $FA_ChkMpg ${BST_CHECKED}

  ${NSD_CreateCheckbox} 59% 130u 18% 10u ".3gp"
  Pop $FA_Chk3gp
  ${NSD_SetState} $FA_Chk3gp ${BST_CHECKED}

  ${NSD_CreateLabel} 0u 174u 100% 16u "설치 후 Windows [설정 > 앱 > 기본 앱]에서 변경 가능합니다."
  Pop $0

  nsDialogs::Show
FunctionEnd

; --- Group "select all" handlers: cascade to individual ---
Function FA_OnAllAudio
  Pop $R0
  ${NSD_GetState} $R0 $R1
  ${NSD_SetState} $FA_ChkMp3  $R1
  ${NSD_SetState} $FA_ChkFlac $R1
  ${NSD_SetState} $FA_ChkM4a  $R1
  ${NSD_SetState} $FA_ChkWav  $R1
  ${NSD_SetState} $FA_ChkOgg  $R1
  ${NSD_SetState} $FA_ChkOpus $R1
  ${NSD_SetState} $FA_ChkAac  $R1
  ${NSD_SetState} $FA_ChkWma  $R1
  ${NSD_SetState} $FA_ChkAiff $R1
FunctionEnd

Function FA_OnAllVideo
  Pop $R0
  ${NSD_GetState} $R0 $R1
  ${NSD_SetState} $FA_ChkMp4  $R1
  ${NSD_SetState} $FA_ChkM4v  $R1
  ${NSD_SetState} $FA_ChkMkv  $R1
  ${NSD_SetState} $FA_ChkWebm $R1
  ${NSD_SetState} $FA_ChkMov  $R1
  ${NSD_SetState} $FA_ChkAvi  $R1
  ${NSD_SetState} $FA_ChkWmv  $R1
  ${NSD_SetState} $FA_ChkFlv  $R1
  ${NSD_SetState} $FA_ChkTs   $R1
  ${NSD_SetState} $FA_ChkMpg  $R1
  ${NSD_SetState} $FA_Chk3gp  $R1
FunctionEnd

; --- Capture states when user moves to next page ---
Function FA_PageLeave
  ${NSD_GetState} $FA_ChkMp3  $FA_StMp3
  ${NSD_GetState} $FA_ChkFlac $FA_StFlac
  ${NSD_GetState} $FA_ChkM4a  $FA_StM4a
  ${NSD_GetState} $FA_ChkWav  $FA_StWav
  ${NSD_GetState} $FA_ChkOgg  $FA_StOgg
  ${NSD_GetState} $FA_ChkOpus $FA_StOpus
  ${NSD_GetState} $FA_ChkAac  $FA_StAac
  ${NSD_GetState} $FA_ChkWma  $FA_StWma
  ${NSD_GetState} $FA_ChkAiff $FA_StAiff
  ${NSD_GetState} $FA_ChkMp4  $FA_StMp4
  ${NSD_GetState} $FA_ChkM4v  $FA_StM4v
  ${NSD_GetState} $FA_ChkMkv  $FA_StMkv
  ${NSD_GetState} $FA_ChkWebm $FA_StWebm
  ${NSD_GetState} $FA_ChkMov  $FA_StMov
  ${NSD_GetState} $FA_ChkAvi  $FA_StAvi
  ${NSD_GetState} $FA_ChkWmv  $FA_StWmv
  ${NSD_GetState} $FA_ChkFlv  $FA_StFlv
  ${NSD_GetState} $FA_ChkTs   $FA_StTs
  ${NSD_GetState} $FA_ChkMpg  $FA_StMpg
  ${NSD_GetState} $FA_Chk3gp  $FA_St3gp
FunctionEnd

!endif ; !BUILD_UNINSTALLER

; ============================================================
;  Registry helpers
; ============================================================
!macro FA_WriteAudioProgId
  WriteRegStr HKCR "MediaLab.AudioFile" "" "MediaLab Audio File"
  WriteRegStr HKCR "MediaLab.AudioFile\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr HKCR "MediaLab.AudioFile\shell\open" "FriendlyAppName" "MediaLab"
  WriteRegStr HKCR "MediaLab.AudioFile\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
!macroend

!macro FA_WriteVideoProgId
  WriteRegStr HKCR "MediaLab.VideoFile" "" "MediaLab Video File"
  WriteRegStr HKCR "MediaLab.VideoFile\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME},0"
  WriteRegStr HKCR "MediaLab.VideoFile\shell\open" "FriendlyAppName" "MediaLab"
  WriteRegStr HKCR "MediaLab.VideoFile\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
!macroend

!macro FA_RegisterExt EXT PROGID
  ; Add to "Open with" candidate list
  WriteRegStr HKCR "${EXT}\OpenWithProgids" "${PROGID}" ""
  ; Make our ProgID the default handler
  WriteRegStr HKCR "${EXT}" "" "${PROGID}"
!macroend

!macro FA_UnregisterExt EXT PROGID
  ; Remove from OpenWithProgids list
  DeleteRegValue HKCR "${EXT}\OpenWithProgids" "${PROGID}"
  ; Reset default value if it's still pointing to us
  ReadRegStr $R9 HKCR "${EXT}" ""
  ${If} $R9 == "${PROGID}"
    DeleteRegValue HKCR "${EXT}" ""
  ${EndIf}
!macroend

; ============================================================
;  Hook into install — register only what user picked
; ============================================================
!macro customInstall
  !insertmacro FA_WriteAudioProgId
  !insertmacro FA_WriteVideoProgId

  ${If} $FA_StMp3  == 1
    !insertmacro FA_RegisterExt ".mp3"  "MediaLab.AudioFile"
  ${EndIf}
  ${If} $FA_StFlac == 1
    !insertmacro FA_RegisterExt ".flac" "MediaLab.AudioFile"
  ${EndIf}
  ${If} $FA_StM4a  == 1
    !insertmacro FA_RegisterExt ".m4a"  "MediaLab.AudioFile"
  ${EndIf}
  ${If} $FA_StWav  == 1
    !insertmacro FA_RegisterExt ".wav"  "MediaLab.AudioFile"
  ${EndIf}
  ${If} $FA_StOgg  == 1
    !insertmacro FA_RegisterExt ".ogg"  "MediaLab.AudioFile"
  ${EndIf}
  ${If} $FA_StOpus == 1
    !insertmacro FA_RegisterExt ".opus" "MediaLab.AudioFile"
  ${EndIf}
  ${If} $FA_StAac  == 1
    !insertmacro FA_RegisterExt ".aac"  "MediaLab.AudioFile"
  ${EndIf}
  ${If} $FA_StWma  == 1
    !insertmacro FA_RegisterExt ".wma"  "MediaLab.AudioFile"
  ${EndIf}
  ${If} $FA_StAiff == 1
    !insertmacro FA_RegisterExt ".aiff" "MediaLab.AudioFile"
  ${EndIf}

  ${If} $FA_StMp4  == 1
    !insertmacro FA_RegisterExt ".mp4"  "MediaLab.VideoFile"
  ${EndIf}
  ${If} $FA_StM4v  == 1
    !insertmacro FA_RegisterExt ".m4v"  "MediaLab.VideoFile"
  ${EndIf}
  ${If} $FA_StMkv  == 1
    !insertmacro FA_RegisterExt ".mkv"  "MediaLab.VideoFile"
  ${EndIf}
  ${If} $FA_StWebm == 1
    !insertmacro FA_RegisterExt ".webm" "MediaLab.VideoFile"
  ${EndIf}
  ${If} $FA_StMov  == 1
    !insertmacro FA_RegisterExt ".mov"  "MediaLab.VideoFile"
  ${EndIf}
  ${If} $FA_StAvi  == 1
    !insertmacro FA_RegisterExt ".avi"  "MediaLab.VideoFile"
  ${EndIf}
  ${If} $FA_StWmv  == 1
    !insertmacro FA_RegisterExt ".wmv"  "MediaLab.VideoFile"
  ${EndIf}
  ${If} $FA_StFlv  == 1
    !insertmacro FA_RegisterExt ".flv"  "MediaLab.VideoFile"
  ${EndIf}
  ${If} $FA_StTs   == 1
    !insertmacro FA_RegisterExt ".ts"   "MediaLab.VideoFile"
  ${EndIf}
  ${If} $FA_StMpg  == 1
    !insertmacro FA_RegisterExt ".mpg"  "MediaLab.VideoFile"
  ${EndIf}
  ${If} $FA_St3gp  == 1
    !insertmacro FA_RegisterExt ".3gp"  "MediaLab.VideoFile"
  ${EndIf}

  ; Notify the shell about the new associations
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

; ============================================================
;  Hook into uninstall — clean up everything we registered
; ============================================================
!macro customUnInstall
  !insertmacro FA_UnregisterExt ".mp3"  "MediaLab.AudioFile"
  !insertmacro FA_UnregisterExt ".flac" "MediaLab.AudioFile"
  !insertmacro FA_UnregisterExt ".m4a"  "MediaLab.AudioFile"
  !insertmacro FA_UnregisterExt ".wav"  "MediaLab.AudioFile"
  !insertmacro FA_UnregisterExt ".ogg"  "MediaLab.AudioFile"
  !insertmacro FA_UnregisterExt ".opus" "MediaLab.AudioFile"
  !insertmacro FA_UnregisterExt ".aac"  "MediaLab.AudioFile"
  !insertmacro FA_UnregisterExt ".wma"  "MediaLab.AudioFile"
  !insertmacro FA_UnregisterExt ".aiff" "MediaLab.AudioFile"

  !insertmacro FA_UnregisterExt ".mp4"  "MediaLab.VideoFile"
  !insertmacro FA_UnregisterExt ".m4v"  "MediaLab.VideoFile"
  !insertmacro FA_UnregisterExt ".mkv"  "MediaLab.VideoFile"
  !insertmacro FA_UnregisterExt ".webm" "MediaLab.VideoFile"
  !insertmacro FA_UnregisterExt ".mov"  "MediaLab.VideoFile"
  !insertmacro FA_UnregisterExt ".avi"  "MediaLab.VideoFile"
  !insertmacro FA_UnregisterExt ".wmv"  "MediaLab.VideoFile"
  !insertmacro FA_UnregisterExt ".flv"  "MediaLab.VideoFile"
  !insertmacro FA_UnregisterExt ".ts"   "MediaLab.VideoFile"
  !insertmacro FA_UnregisterExt ".mpg"  "MediaLab.VideoFile"
  !insertmacro FA_UnregisterExt ".3gp"  "MediaLab.VideoFile"

  DeleteRegKey HKCR "MediaLab.AudioFile"
  DeleteRegKey HKCR "MediaLab.VideoFile"

  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
