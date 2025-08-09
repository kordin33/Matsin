import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { FilledButton } from "@excalidraw/excalidraw/components/FilledButton";
import { TextField } from "@excalidraw/excalidraw/components/TextField";
import { copyIcon, LinkIcon, usersIcon } from "@excalidraw/excalidraw/components/icons";
import { useI18n } from "@excalidraw/excalidraw/i18n";
import { KEYS } from "@excalidraw/common";
import { useState, useRef, useEffect } from "react";
import { copyTextToSystemClipboard } from "@excalidraw/excalidraw/clipboard";
import { atom, useAtom } from "../app-jotai";
import { generateCollaborationLinkData, getCollaborationLink } from "../data";
import { useCopyStatus } from "@excalidraw/excalidraw/hooks/useCopiedIndicator";

import type { CollabAPI } from "../collab/Collab";

import "./StudentLinkDialog.scss";

// Przechowujemy trwałe linki dla studentów w localStorage
const STUDENT_LINKS_KEY = "matsin:studentLinks";

export const studentLinkDialogStateAtom = atom<
  { isOpen: false } | { isOpen: true }
>({ isOpen: false });

interface StudentLink {
  id: string;
  studentName: string;
  roomId: string;
  roomKey: string;
  url: string;
  createdAt: string;
}

const loadStudentLinks = (): StudentLink[] => {
  try {
    const stored = localStorage.getItem(STUDENT_LINKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveStudentLinks = (links: StudentLink[]) => {
  localStorage.setItem(STUDENT_LINKS_KEY, JSON.stringify(links));
};

export const StudentLinkDialog = ({
  collabAPI,
  handleClose,
}: {
  collabAPI: CollabAPI | null;
  handleClose: () => void;
}) => {
  const { t } = useI18n();
  const [studentLinks, setStudentLinks] = useState<StudentLink[]>(loadStudentLinks);
  const [newStudentName, setNewStudentName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { onCopy, copyStatus } = useCopyStatus();

  useEffect(() => {
    // Fokusuj input po otwarciu dialogu
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const createStudentLink = async () => {
    if (!newStudentName.trim()) return;
    
    setIsCreating(true);
    try {
      const { roomId, roomKey } = await generateCollaborationLinkData();
      const baseUrl = getCollaborationLink({ roomId, roomKey });
      // Add student name as URL parameter
      const url = `${baseUrl}&student=${encodeURIComponent(newStudentName.trim())}`;
      
      const newLink: StudentLink = {
        id: Date.now().toString(),
        studentName: newStudentName.trim(),
        roomId,
        roomKey,
        url,
        createdAt: new Date().toLocaleDateString("pl-PL"),
      };

      const updatedLinks = [...studentLinks, newLink];
      setStudentLinks(updatedLinks);
      saveStudentLinks(updatedLinks);
      setNewStudentName("");
    } catch (error) {
      console.error("Błąd podczas tworzenia linku studenta:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const copyStudentLink = async (link: string) => {
    try {
      await copyTextToSystemClipboard(link);
      onCopy();
    } catch (error) {
      console.error("Nie udało się skopiować linku:", error);
    }
  };

  const joinStudent = async (roomId: string, roomKey: string) => {
    if (!collabAPI) return;
    
    try {
      await collabAPI.startCollaboration({ roomId, roomKey });
      handleClose();
    } catch (error) {
      console.error("Błąd podczas dołączania do pokoju studenta:", error);
    }
  };

  const deleteStudentLink = (linkId: string) => {
    const updatedLinks = studentLinks.filter(link => link.id !== linkId);
    setStudentLinks(updatedLinks);
    saveStudentLinks(updatedLinks);
  };

  return (
    <Dialog size="small" onCloseRequest={handleClose} title={false}>
      <div className="StudentLinkDialog">
        <h2 className="StudentLinkDialog__title">
          {usersIcon}
          Zarządzanie uczniami
        </h2>
        
        <div className="StudentLinkDialog__create">
          <h3>Utwórz trwały link dla ucznia</h3>
          <div className="StudentLinkDialog__create__form">
            <TextField
              ref={inputRef}
              placeholder="Imię i nazwisko ucznia"
              value={newStudentName}
              onChange={setNewStudentName}
              onKeyDown={(event) => {
                if (event.key === KEYS.ENTER && !isCreating) {
                  createStudentLink();
                }
              }}
            />
            <FilledButton
              size="large"
              label={isCreating ? "Tworzenie..." : "Utwórz link"}
              icon={LinkIcon}
              onClick={createStudentLink}
            />
          </div>
        </div>

        <div className="StudentLinkDialog__list">
          <h3>Istniejące linki uczniów ({studentLinks.length})</h3>
          {studentLinks.length === 0 ? (
            <p className="StudentLinkDialog__empty">
              Nie masz jeszcze żadnych linków dla uczniów. Utwórz pierwszy!
            </p>
          ) : (
            <div className="StudentLinkDialog__students">
              {studentLinks.map((link) => (
                <div key={link.id} className="StudentLinkDialog__student">
                  <div className="StudentLinkDialog__student__info">
                    <strong>{link.studentName}</strong>
                    <small>Utworzono: {link.createdAt}</small>
                  </div>
                  <div className="StudentLinkDialog__student__actions">
                    <FilledButton
                      size="small"
                      variant="outlined"
                      label="Dołącz"
                      onClick={() => joinStudent(link.roomId, link.roomKey)}
                    />
                    <FilledButton
                      size="small"
                      variant="outlined"
                      label="Kopiuj"
                      icon={copyIcon}
                      status={copyStatus}
                      onClick={() => copyStudentLink(link.url)}
                    />
                    <FilledButton
                      size="small"
                      variant="outlined"
                      color="danger"
                      label="Usuń"
                      onClick={() => {
                        if (confirm(`Czy na pewno chcesz usunąć link dla ${link.studentName}?`)) {
                          deleteStudentLink(link.id);
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="StudentLinkDialog__footer">
          <p className="StudentLinkDialog__info">
            💡 <strong>Jak to działa:</strong><br />
            1. Utwórz trwały link dla każdego ucznia<br />
            2. Wyślij uczniowi jego unikalny link<br />
            3. Uczeń zawsze używa tego samego linku<br />
            4. Ty jako nauczyciel możesz dołączyć do dowolnej tablicy ucznia<br />
            5. Stan tablicy jest automatycznie zapisywany
          </p>
        </div>
      </div>
    </Dialog>
  );
};