import {
  loginIcon,
  ExcalLogo,
  eyeIcon,
  usersIcon,
} from "@excalidraw/excalidraw/components/icons";
import { MainMenu } from "@excalidraw/excalidraw/index";
import React from "react";

import { isDevEnv } from "@excalidraw/common";

import type { Theme } from "@excalidraw/element/types";

import { LanguageList } from "../app-language/LanguageList";
import { isMatsinPlusSignedUser } from "../app_constants";

import { saveDebugState } from "./DebugCanvas";
import { studentLinkDialogStateAtom } from "./StudentLinkDialog";
import { useAtom } from "../app-jotai";

export const AppMainMenu: React.FC<{
  onCollabDialogOpen: () => any;
  isCollaborating: boolean;
  isCollabEnabled: boolean;
  theme: Theme | "system";
  setTheme: (theme: Theme | "system") => void;
  refresh: () => void;
}> = React.memo((props) => {
  const [, setStudentDialog] = useAtom(studentLinkDialogStateAtom);
  return (
    <MainMenu>
      <MainMenu.DefaultItems.SaveAsImage />
      {/* Tymczasowa wsp\u00f3\u0142praca na \u017cywo (bez permalinka) */}
      <MainMenu.Item icon={usersIcon} onClick={props.onCollabDialogOpen}>
        Wsp\u00f3\u0142praca (tymczasowa)
      </MainMenu.Item>

      {/* Sta\u0142e linki dla uczni\u00f3w */}
      <MainMenu.Item
        icon={usersIcon}
        onClick={() => setStudentDialog({ isOpen: true })}
      >
        Uczniowie (sta\u0142e linki)
      </MainMenu.Item>

      <MainMenu.DefaultItems.ClearCanvas />
      <MainMenu.Separator />

      {isDevEnv() && (
        <MainMenu.Item
          icon={eyeIcon}
          onClick={() => {
            if (window.visualDebug) {
              delete window.visualDebug;
              saveDebugState({ enabled: false });
            } else {
              window.visualDebug = { data: [] } as any;
              saveDebugState({ enabled: true });
            }
            props?.refresh();
          }}
        >
          Visual Debug
        </MainMenu.Item>
      )}
      <MainMenu.Separator />
      <MainMenu.DefaultItems.ToggleTheme
        allowSystemTheme
        theme={props.theme}
        onSelect={props.setTheme}
      />

      <MainMenu.DefaultItems.ChangeCanvasBackground />
    </MainMenu>
  );
});
