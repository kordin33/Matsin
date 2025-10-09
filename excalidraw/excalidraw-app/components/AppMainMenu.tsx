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
      {/* Tymczasowa współpraca na żywo (bez permalinka) */}
      <MainMenu.Item
        icon={usersIcon}
        onClick={props.onCollabDialogOpen}
      >
        Współpraca (tymczasowa)
      </MainMenu.Item>

      {/* Stałe linki dla uczniów */}
      <MainMenu.Item
        icon={usersIcon}
        onClick={() => setStudentDialog({ isOpen: true })}
      >
        Uczniowie (stałe linki)
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
