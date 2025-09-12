import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { FilledButton } from "@excalidraw/excalidraw/components/FilledButton";
import { TextField } from "@excalidraw/excalidraw/components/TextField";
import { copyIcon, LinkIcon, usersIcon } from "@excalidraw/excalidraw/components/icons";
import { useI18n } from "@excalidraw/excalidraw/i18n";
import { KEYS } from "@excalidraw/common";
import { useState, useRef, useEffect } from "react";
import { copyTextToSystemClipboard } from "@excalidraw/excalidraw/clipboard";
import { atom } from "../app-jotai";
import { generateCollaborationLinkData } from "../data";
import { useCopyStatus } from "@excalidraw/excalidraw/hooks/useCopiedIndicator";
import { apiClient } from "../data/api-client";

import type { CollabAPI } from "../collab/Collab";

import "./StudentLinkDialog.scss";

// Przechowujemy trwałe linki dla studentów w localStorage
const STUDENT_LINKS_KEY = "matsin:studentLinks";
const TEACHER_KEY = "matsin:teacherKey";
const TEACHER_TOKEN_KEY = "matsin:teacherToken";

export const studentLinkDialogStateAtom = atom<
  { isOpen: false } | { isOpen: true }
>({ isOpen: false });

interface StudentLink {
  id: string;
  studentName: string;
  roomId: string;
  roomKey: string;
  permalink?: string;
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
  const [teacherId] = useState<string>(() => {
    try {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get("teacher");
      const fromStorage = localStorage.getItem(TEACHER_KEY);
      const value = fromUrl || fromStorage || Math.random().toString(36).slice(2, 12);
      localStorage.setItem(TEACHER_KEY, value);
      if (fromUrl) {
        url.searchParams.delete("teacher");
        window.history.replaceState({}, document.title, url.toString());
      }
      return value;
    } catch {
      const value = Math.random().toString(36).slice(2, 12);
      localStorage.setItem(TEACHER_KEY, value);
      return value;
    }
  });

  const [teacherToken] = useState<string | null>(() => {
    try {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get("t") || url.searchParams.get("token");
      const fromStorage = localStorage.getItem(TEACHER_TOKEN_KEY);
      const value = fromUrl || fromStorage || null;
      if (value) {
        localStorage.setItem(TEACHER_TOKEN_KEY, value);
      }
      if (fromUrl) {
        url.searchParams.delete("t");
        url.searchParams.delete("token");
        window.history.replaceState({}, document.title, url.toString());
      }
      return value;
    } catch {
      return localStorage.getItem(TEACHER_TOKEN_KEY);
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { onCopy, copyStatus } = useCopyStatus();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Load server-side student links for this teacher on open
  useEffect(() => {
    (async () => {
      try {
        if (!teacherId) return;
        const list = teacherToken
          ? await apiClient.listTeacherPermalinks(teacherId, teacherToken)
          : await apiClient.listPermalinks(teacherId);
        const mapped: StudentLink[] = (list.items || []).map((it) => {
          const name = it.student_name || "Uczeń";
          const url = `${window.location.origin}${window.location.pathname}?permalink=${encodeURIComponent(it.permalink)}${name ? `&student=${encodeURIComponent(name)}` : ""}`;
          return {
            id: it.permalink,
            studentName: name,
            roomId: it.room_id,
            roomKey: it.room_key,
            permalink: it.permalink,
            url,
            createdAt: new Date(it.created_at).toLocaleDateString("pl-PL"),
          };
        });
        if (mapped.length) {
          setStudentLinks(mapped);
          saveStudentLinks(mapped);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [teacherId]);

  const createStudentLink = async () => {
    if (!newStudentName.trim()) return;

    setIsCreating(true);
    try {
      const name = newStudentName.trim();
      const exists = studentLinks.some(
        (s) => s.studentName.toLowerCase() === name.toLowerCase(),
      );
      if (exists) {
        alert(
          `Link dla ucznia "${name}" już istnieje. Użyj istniejącego linku lub usuń go, aby wygenerować nowy.`,
        );
        return;
      }
      const { roomId, roomKey } = await generateCollaborationLinkData();
      // Create server-side permalink for stable sharing
      const { permalink } = await apiClient.createPermalink({
        room_id: roomId,
        room_key: roomKey,
        student_name: name,
        teacher_id: teacherId,
        teacher_token: teacherToken || undefined,
      });
      const url = `${window.location.origin}${window.location.pathname}?permalink=${encodeURIComponent(
        permalink,
      )}&student=${encodeURIComponent(name)}`;

      const newLink: StudentLink = {
        id: Date.now().toString(),
        studentName: name,
        roomId,
        roomKey,
        permalink,
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

  const deleteStudentLink = async (linkId: string) => {
    const link = studentLinks.find((l) => l.id === linkId);
    try {
      if (link?.permalink) {
        if (teacherToken) {
          await apiClient.deleteTeacherPermalink(teacherId, link.permalink, teacherToken);
        } else {
          await apiClient.deletePermalink(link.permalink, teacherId);
        }
      }
    } catch (e) {
      // ignore backend failure; proceed with local removal
    }
    const updatedLinks = studentLinks.filter((l) => l.id !== linkId);
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

        <div className="StudentLinkDialog__teacher">
          <small>
            Twój link zarządzania: {`${window.location.origin}${window.location.pathname}?teacher=${teacherId}`}
          </small>
          <FilledButton
            size="medium"
            variant="outlined"
            label="Kopiuj link nauczyciela"
            icon={copyIcon}
            status={copyStatus}
            onClick={() => copyStudentLink(`${window.location.origin}${window.location.pathname}?teacher=${teacherId}`)}
          />
        </div>

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
                      size="medium"
                      variant="outlined"
                      label="Dołącz"
                      onClick={() => joinStudent(link.roomId, link.roomKey)}
                    />
                    <FilledButton
                      size="medium"
                      variant="outlined"
                      label="Kopiuj"
                      icon={copyIcon}
                      status={copyStatus}
                      onClick={() => copyStudentLink(link.url)}
                    />
                    <FilledButton
                      size="medium"
                      variant="outlined"
                      color="danger"
                      label="Usuń"
                      onClick={() => {
                        if (
                          confirm(
                            `Czy na pewno chcesz usunąć link dla ${link.studentName}?`,
                          )
                        ) {
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
            <strong>Jak to działa:</strong>
            <br />
            1. Utwórz trwały link dla każdego ucznia
            <br />
            2. Wyślij uczniowi jego unikalny link
            <br />
            3. Uczeń zawsze używa tego samego linku
            <br />
            4. Ty jako nauczyciel możesz dołączać do dowolnej tablicy ucznia
            <br />
            5. Stan tablicy jest automatycznie zapisywany
          </p>
        </div>
      </div>
    </Dialog>
  );
};
