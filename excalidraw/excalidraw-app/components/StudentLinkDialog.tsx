import { Dialog } from "@excalidraw/excalidraw/components/Dialog";
import { FilledButton } from "@excalidraw/excalidraw/components/FilledButton";
import { TextField } from "@excalidraw/excalidraw/components/TextField";
import { copyIcon, LinkIcon, usersIcon } from "@excalidraw/excalidraw/components/icons";
import { KEYS } from "@excalidraw/common";
import { useState, useRef, useEffect } from "react";
import { copyTextToSystemClipboard } from "@excalidraw/excalidraw/clipboard";
import { atom } from "../app-jotai";
import { generateCollaborationLinkData } from "../data";
import { apiClient } from "../data/api-client";

import type { CollabAPI } from "../collab/Collab";

import "./StudentLinkDialog.scss";

const STUDENT_LINKS_KEY = "matsin:studentLinks";
const TEACHER_KEY = "matsin:teacherKey";
const TEACHER_TOKEN_KEY = "matsin:teacherToken";
const TEACHER_NAME_KEY = "matsin:teacherName";

export const studentLinkDialogStateAtom = atom<
  { isOpen: false } | { isOpen: true }
>({ isOpen: false });

interface StudentLink {
  id: string;
  studentName: string;
  roomId: string;
  roomKey: string;
  permalink: string;
  url: string;
  createdAt: string;
}

const loadStudentLinks = (): StudentLink[] => {
  try {
    const stored = localStorage.getItem(STUDENT_LINKS_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as any[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => {
      const permalink =
        typeof item?.permalink === "string" && item.permalink.length
          ? item.permalink
          : item?.id;
      return {
        ...item,
        permalink,
        id: item?.id || permalink,
      } as StudentLink;
    });
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
  const [studentLinks, setStudentLinks] = useState<StudentLink[]>(loadStudentLinks);
  const [newStudentName, setNewStudentName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [teacherName, setTeacherName] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TEACHER_NAME_KEY);
    } catch {
      return null;
    }
  });
  const [teacherId] = useState<string>(() => {
    try {
      const url = new URL(window.location.href);
      const fromUrl = url.searchParams.get("teacher");
      const fromStorage = localStorage.getItem(TEACHER_KEY);
      const value = fromUrl || fromStorage || Math.random().toString(36).slice(2, 12);
      localStorage.setItem(TEACHER_KEY, value);
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
      return value;
    } catch {
      return localStorage.getItem(TEACHER_TOKEN_KEY);
    }
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!teacherId) {
          return;
        }
        if (!teacherToken) {
          setErrorMessage(
            "Brakuje tokenu nauczyciela. Otwórz tablicę korzystając z linku wygenerowanego w panelu administratora.",
          );
          return;
        }
        setErrorMessage(null);
        const list = await apiClient.listTeacherPermalinks(teacherId, teacherToken);
        const mapped: StudentLink[] = (list.items || []).map((item) => {
          const name = item.student_name || "Uczeń";
          const url = `${window.location.origin}${window.location.pathname}?permalink=${encodeURIComponent(
            item.permalink,
          )}${name ? `&student=${encodeURIComponent(name)}` : ""}`;
          return {
            id: item.permalink,
            studentName: name,
            roomId: item.room_id,
            roomKey: item.room_key,
            permalink: item.permalink,
            url,
            createdAt: new Date(item.created_at).toLocaleDateString("pl-PL"),
          };
        });

        const remoteTeacherName =
          list.items?.find(
            (item) =>
              typeof item.teacher_name === "string" &&
              item.teacher_name.trim().length > 0,
          )?.teacher_name?.trim() || null;
        if (remoteTeacherName && remoteTeacherName !== teacherName) {
          setTeacherName(remoteTeacherName);
          try {
            localStorage.setItem(TEACHER_NAME_KEY, remoteTeacherName);
          } catch {}
        }

        setStudentLinks(mapped);
        saveStudentLinks(mapped);
      } catch (error) {
        console.error("Failed to fetch student links", error);
        setErrorMessage(
          "Nie udało się pobrać zapisanych linków. Spróbuj ponownie później.",
        );
      }
    })();
  }, [teacherId, teacherToken]);

  useEffect(() => {
    if (!teacherToken || teacherName) {
      return;
    }
    setTeacherName("Nauczyciel");
    try {
      localStorage.setItem(TEACHER_NAME_KEY, "Nauczyciel");
    } catch {}
  }, [teacherToken, teacherName]);

  useEffect(() => {
    if (!collabAPI || !teacherToken) {
      return;
    }
    const displayName =
      (teacherName && teacherName.trim().length > 0 ? teacherName.trim() : "Nauczyciel") || "Nauczyciel";
    collabAPI.setUsername(displayName);
  }, [collabAPI, teacherToken, teacherName]);

  const createStudentLink = async () => {
    if (!newStudentName.trim()) {
      return;
    }

    if (!teacherToken) {
      setErrorMessage(
        "Brakuje tokenu nauczyciela. Upewnij się, że korzystasz z linku udostępnionego przez administratora.",
      );
      return;
    }

    setIsCreating(true);
    try {
      const name = newStudentName.trim();
      const exists = studentLinks.some(
        (student) => student.studentName.toLowerCase() === name.toLowerCase(),
      );

      if (exists) {
        alert(
          `Link dla ucznia "${name}" już istnieje. Użyj istniejącego linku lub usuń go, aby stworzyć nowy.`,
        );
        return;
      }

      const { roomId, roomKey } = await generateCollaborationLinkData();
      const { permalink } = await apiClient.createPermalink({
        room_id: roomId,
        room_key: roomKey,
        student_name: name,
        teacher_id: teacherId,
        teacher_token: teacherToken,
      });

      const url = `${window.location.origin}${window.location.pathname}?permalink=${encodeURIComponent(
        permalink,
      )}&student=${encodeURIComponent(name)}`;

      const newLink: StudentLink = {
        id: permalink,
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
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to create student link", error);
      setErrorMessage("Nie udało się utworzyć linku. Spróbuj ponownie.");
    } finally {
      setIsCreating(false);
    }
  };

  const markCopied = (target: string) => {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    setCopiedTarget(target);
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopiedTarget(null);
    }, 2000);
  };

  const copyStudentLink = async (link: string, target: string) => {
    try {
      await copyTextToSystemClipboard(link);
      markCopied(target);
    } catch (error) {
      console.error("Unable to copy link", error);
    }
  };

  const joinStudent = async (roomId: string, roomKey: string) => {
    if (!collabAPI) {
      return;
    }

    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.hash = `#room=${roomId},${roomKey}`;
      window.history.pushState({}, document.title, currentUrl.toString());
      setErrorMessage(null);
      await collabAPI.startCollaboration({ roomId, roomKey });
      handleClose();
    } catch (error) {
      console.error("Unable to join student room", error);
      setErrorMessage(
        "Nie udało się dołączyć do tablicy ucznia. Sprawdź połączenie i spróbuj ponownie.",
      );
    }
  };

  const deleteStudentLink = async (permalink: string) => {
    if (!teacherToken) {
      setErrorMessage(
        "Brakuje tokenu nauczyciela. Nie można usunąć linku bez poprawnej autoryzacji.",
      );
      return;
    }
    const link = studentLinks.find((item) => item.permalink === permalink);
    try {
      if (link?.permalink) {
        await apiClient.deleteTeacherPermalink(teacherId, link.permalink, teacherToken);
      }
      const updatedLinks = studentLinks.filter((item) => item.permalink !== permalink);
      setStudentLinks(updatedLinks);
      saveStudentLinks(updatedLinks);
      setErrorMessage(null);
    } catch (error) {
      console.error("Unable to delete student link", error);
      setErrorMessage("Nie udało się usunąć linku. Spróbuj ponownie.");
    }
  };

  const manageLink = teacherToken
    ? `${window.location.origin}${window.location.pathname}?teacher=${teacherId}&t=${teacherToken}`
    : `${window.location.origin}${window.location.pathname}?teacher=${teacherId}`;
  const hasStudents = studentLinks.length > 0;
  const studentCountLabel = studentLinks.length.toString().padStart(2, "0");

  return (
    <Dialog size="regular" onCloseRequest={handleClose} title={false}>
      <div className="StudentLinkDialog">
        <header className="StudentLinkDialog__header">
          <span className="StudentLinkDialog__headerIcon">{usersIcon}</span>
          <div className="StudentLinkDialog__headerCopy">
            <h2>Panel uczniów</h2>
            <p>Zarządzaj stałymi zaproszeniami i dołączaj do tablic uczniów w kilka sekund.</p>
          </div>
        </header>

        {errorMessage && (
          <div className="StudentLinkDialog__alert StudentLinkDialog__alert--error">
            {errorMessage}
          </div>
        )}

        <section className="StudentLinkDialog__card StudentLinkDialog__teacher">
          <div className="StudentLinkDialog__cardBody">
            <span className="StudentLinkDialog__label">Link nauczyciela</span>
            <span className="StudentLinkDialog__teacherName">{teacherName || "Nauczyciel"}</span>
            <strong className="StudentLinkDialog__link">{manageLink}</strong>
          </div>
          <FilledButton
            size="medium"
            variant="outlined"
            label="Kopiuj link"
            icon={copyIcon}
            status={copiedTarget === "teacher" ? "success" : null}
            onClick={() => copyStudentLink(manageLink, "teacher")}
          />
        </section>

        <section className="StudentLinkDialog__card StudentLinkDialog__create">
          <div className="StudentLinkDialog__cardHeader">
            <h3>Dodaj ucznia</h3>
            <p>Podaj imię i nazwisko, aby wygenerować stały link.</p>
          </div>
          <div className="StudentLinkDialog__form">
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
        </section>

        <section className="StudentLinkDialog__card StudentLinkDialog__list">
          <div className="StudentLinkDialog__cardHeader StudentLinkDialog__listHeader">
            <h3>Zapisane linki</h3>
            <span className="StudentLinkDialog__counter">{studentCountLabel}</span>
          </div>
          {hasStudents ? (
            <ul className="StudentLinkDialog__students">
              {studentLinks.map((link) => (
                <li key={link.permalink} className="StudentLinkDialog__student">
                  <div className="StudentLinkDialog__studentMeta">
                    <span className="StudentLinkDialog__studentName">{link.studentName}</span>
                    <span className="StudentLinkDialog__studentDate">Utworzono {link.createdAt}</span>
                  </div>
                  <div className="StudentLinkDialog__studentActions">
                    <FilledButton
                      size="medium"
                      variant="outlined"
                      label="Dołącz"
                      onClick={() => joinStudent(link.roomId, link.roomKey)}
                    />
                    <FilledButton
                      size="medium"
                      variant="outlined"
                      label="Kopiuj link"
                      icon={copyIcon}
                      status={copiedTarget === link.permalink ? "success" : null}
                      onClick={() => copyStudentLink(link.url, link.permalink)}
                    />
                    <FilledButton
                      size="medium"
                      variant="outlined"
                      color="danger"
                      label="Usuń"
                      onClick={() => {
                        if (confirm(`Czy usunąć link dla ${link.studentName}?`)) {
                          deleteStudentLink(link.permalink);
                        }
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="StudentLinkDialog__empty">
              <p>Nie masz jeszcze linków uczniów. Dodaj pierwszego, aby zobaczyć go na liście.</p>
            </div>
          )}
        </section>

        <footer className="StudentLinkDialog__footer">
          <h4>Jak to działa</h4>
          <ol>
            <li>Twórz stały link dla każdego ucznia.</li>
            <li>Przekaż link uczniowi, aby zawsze wracał do swojej tablicy.</li>
            <li>Dołączaj do pokoju ucznia zawsze, gdy chcesz śledzić jego pracę.</li>
          </ol>
        </footer>
      </div>
    </Dialog>
  );
};

