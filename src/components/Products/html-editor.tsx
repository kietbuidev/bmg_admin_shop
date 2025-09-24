"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";

type EditorCommand = {
  id: string;
  label: string;
  value?: string;
  type?: "block";
  prompt?: string;
};

const COMMANDS: ReadonlyArray<EditorCommand> = [
  { id: "formatBlock", label: "Normal", value: "P", type: "block" },
  { id: "formatBlock", label: "H1", value: "H1", type: "block" },
  { id: "formatBlock", label: "H2", value: "H2", type: "block" },
  { id: "formatBlock", label: "H3", value: "H3", type: "block" },
  { id: "bold", label: "B" },
  { id: "italic", label: "I" },
  { id: "underline", label: "U" },
  { id: "strikeThrough", label: "S" },
  { id: "createLink", label: "Link", prompt: "Nhập URL" },
  { id: "blockquote", label: "Quote", type: "block", value: "BLOCKQUOTE" },
  { id: "insertImage", label: "Image" },
  { id: "insertOrderedList", label: "1." },
  { id: "insertUnorderedList", label: "•" },
];

type HtmlEditorProps = {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
};

export function HtmlEditor({
  name,
  label,
  defaultValue = "",
  placeholder,
  required,
}: HtmlEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const [isPreview, setIsPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const id = useId();

  useEffect(() => {
    setValue(defaultValue);
    if (editorRef.current) {
      editorRef.current.innerHTML = defaultValue || "";
    }
  }, [defaultValue]);

  function saveSelection() {
    const sel = window.getSelection?.();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0);
    }
  }

  function restoreSelection() {
    const sel = window.getSelection?.();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }

  const handleCommand = useCallback(
    async (command: string, prompt?: string, blockValue?: string) => {
      if (!editorRef.current) return;
      editorRef.current.focus();

      let commandValue: string | undefined = undefined;
      if (prompt) {
        const userInput = window.prompt(prompt);
        if (!userInput) return;
        commandValue = userInput;
      }

      // Special case: image button opens file picker
      if (command === "insertImage") {
        saveSelection();
        fileInputRef.current?.click();
        return;
      } else if (command === "formatBlock" && blockValue) {
        document.execCommand(command, false, blockValue);
      } else if (command === "blockquote" && blockValue) {
        document.execCommand("formatBlock", false, blockValue);
      } else {
        document.execCommand(command, false, commandValue);
      }

      setValue(editorRef.current.innerHTML);
    },
    [],
  );

  async function handlePickedImage(file: File) {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("UPLOAD_FAILED");
      const data = await res.json();
      const url = data.url || data.downloadLink || data.webContentLink;

      restoreSelection();
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand("insertImage", false, url);
        setValue(editorRef.current.innerHTML);
      }
    } catch (e) {
      console.error(e);
      alert("Tải ảnh thất bại. Vui lòng thử lại.");
    }
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items || [];
    for (const it of items as any) {
      if (it.kind === "file") {
        const file = it.getAsFile?.();
        if (file && file.type.startsWith("image/")) {
          e.preventDefault();
          saveSelection();
          await handlePickedImage(file);
          return;
        }
      }
    }
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type?.startsWith("image/")) {
      e.preventDefault();
      saveSelection();
      await handlePickedImage(file);
    }
  }

  const previewHTML = useMemo(() => {
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [
        "p",
        "span",
        "a",
        "img",
        "h1",
        "h2",
        "h3",
        "ul",
        "ol",
        "li",
        "blockquote",
        "pre",
        "code",
        "strong",
        "em",
        "u",
        "s",
        "br",
        "hr",
        "table",
        "thead",
        "tbody",
        "tr",
        "td",
        "th",
        "figure",
        "figcaption",
      ],
      ALLOWED_ATTR: [
        "href",
        "target",
        "rel",
        "src",
        "alt",
        "title",
        "class",
        "style",
        "width",
        "height",
        "align",
        "loading",
      ],
    });
  }, [value]);

  const toolbarButtons = useMemo(
    () =>
      COMMANDS.map((item) => (
        <button
          key={item.id + (item.value ?? "")}
          type="button"
          onClick={() => handleCommand(item.id, item.prompt, item.value)}
          className="rounded px-2 py-1 text-xs font-semibold uppercase text-primary hover:bg-primary/10"
        >
          {item.label}
        </button>
      )),
    [handleCommand],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-body-sm font-medium text-dark dark:text-white">
          {label}
          {required && <span className="ml-1 text-red">*</span>}
        </label>

        <div className="flex items-center gap-2 text-xs font-semibold text-dark-6 dark:text-dark-6">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={cn(
              "rounded-md px-2 py-1 transition",
              !isPreview
                ? "bg-primary text-white"
                : "hover:bg-gray-1 dark:hover:bg-dark-3",
            )}
          >
            Soạn thảo
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={cn(
              "rounded-md px-2 py-1 transition",
              isPreview
                ? "bg-primary text-white"
                : "hover:bg-gray-1 dark:hover:bg-dark-3",
            )}
          >
            Preview
          </button>
        </div>
      </div>

      {!isPreview ? (
        <div className="rounded-lg border border-stroke dark:border-dark-3">
          <div className="flex flex-wrap gap-1 border-b border-stroke p-2 dark:border-dark-3">
            {toolbarButtons}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePickedImage(f);
              // reset value to allow picking same file twice
              (e.target as HTMLInputElement).value = "";
            }}
          />
          <div
            id={id}
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder={placeholder}
            onInput={(event) =>
              setValue((event.target as HTMLDivElement).innerHTML)
            }
            onPaste={handlePaste}
            onDrop={handleDrop}
            onBlur={saveSelection}
            className="[data-placeholder]:text-dark-6 min-h-[200px] space-y-3 px-5.5 py-3 text-sm text-dark outline-none dark:text-white"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-stroke bg-gray-1/40 p-4 text-sm leading-6 text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
          {value ? (
            <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
            ) : (
            <span className="text-dark-6">Chưa có nội dung.</span>
          )}
        </div>
      )}

      <input type="hidden" name={name} value={value} required={required} />
    </div>
  );
}
