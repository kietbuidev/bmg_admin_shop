"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode } from "@lexical/code";
import {
  $getRoot,
  $getSelection,
  $getNodeByKey,
  $isRangeSelection,
  $isElementNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  type EditorState,
  type LexicalNode,
  DecoratorNode,
  type NodeKey,
  type SerializedLexicalNode,
//   type LexicalEditor,
  type DOMExportOutput,
  type DOMConversionMap,
  type DOMConversionOutput,
} from "lexical";
import { $createParagraphNode, $createTextNode } from "lexical";
import { buildApiUrl } from "@/lib/env";
import { sanitizeRemoteImageSrc } from "@/utils/safe-image";

// Custom Image Node
type SerializedPostImageNode = {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  widthPercent?: number;
} & SerializedLexicalNode;

export class PostImageNode extends DecoratorNode<ReactElement> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;
  __widthPercent: number;

  static getType(): string {
    return "post-image";
  }

  static clone(node: PostImageNode): PostImageNode {
    return new PostImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__widthPercent,
      node.__key
    );
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    widthPercent: number = 100,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__widthPercent = widthPercent;
  }

  createDOM(): HTMLElement {
    const img = document.createElement("img");
    img.src = this.__src;
    img.alt = this.__altText;
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.display = "inline-block";
    img.style.margin = "8px 0";
    img.style.verticalAlign = "top";
    if (this.__widthPercent && this.__widthPercent !== 100) {
      img.style.width = `${this.__widthPercent}%`;
    } else {
      img.style.width = "100%";
    }
    if (this.__width) img.width = this.__width;
    if (this.__height) img.height = this.__height;
    return img;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    element.style.maxWidth = "100%";
    element.style.height = "auto";
    element.style.display = "inline-block";
    element.style.verticalAlign = "top";
    if (this.__widthPercent) {
      element.style.width = `${this.__widthPercent}%`;
    }
    if (this.__width) element.setAttribute("width", String(this.__width));
    if (this.__height) element.setAttribute("height", String(this.__height));
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  exportJSON(): SerializedPostImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      widthPercent: this.__widthPercent,
      type: "post-image",
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedPostImageNode): PostImageNode {
    const { src, altText, width, height, widthPercent } = serializedNode;
    return $createPostImageNode({ src, altText, width, height, widthPercent });
  }

  decorate(): ReactElement {
    const widthStyle = this.__widthPercent ? `${this.__widthPercent}%` : "100%";
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        style={{
          maxWidth: "100%",
          height: "auto",
          display: "inline-block",
          margin: "8px 0",
          verticalAlign: "top",
          width: widthStyle,
        }}
        width={this.__width}
        height={this.__height}
      />
    );
  }

  getWidthPercent(): number {
    return this.__widthPercent;
  }

  setWidthPercent(widthPercent: number): void {
    const writable = this.getWritable();
    writable.__widthPercent = widthPercent;
  }
}

function convertImageElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    const { src, alt, width, height } = domNode;
    let widthPercent: number | undefined;
    const styleWidth = domNode.style.width;
    if (styleWidth?.endsWith("%")) {
      widthPercent = Number.parseFloat(styleWidth);
    } else {
      const widthAttr = domNode.getAttribute("width");
      if (widthAttr?.endsWith("%")) {
        widthPercent = Number.parseFloat(widthAttr);
      }
    }

  const node = $createPostImageNode({ src, altText: alt, width, height, widthPercent });
    return { node };
  }
  return null;
}

export function $createPostImageNode({
  src,
  altText,
  width,
  height,
  widthPercent,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  widthPercent?: number;
}): PostImageNode {
  return new PostImageNode(src, altText, width, height, widthPercent ?? 100);
}

export function $isPostImageNode(node: LexicalNode | null | undefined): node is PostImageNode {
  return node instanceof PostImageNode;
}

type LexicalEditorProps = {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  minHeight?: number;
};

type HeadingLevel = Extract<HeadingTagType, "h1" | "h2" | "h3" | "h4">;
type BlockType = "paragraph" | HeadingLevel;

const DEFAULT_UPLOAD_ENDPOINT = buildApiUrl("api/system/upload-image");

function resolveUploadEndpoint() {
  return (
    process.env.NEXT_PUBLIC_POSTS_UPLOAD_ENDPOINT ??
    process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT ??
    DEFAULT_UPLOAD_ENDPOINT
  );
}

type UploadApiResponse = {
  location?: string;
  url?: string;
  secure_url?: string;
  data?: {
    secureUrl?: string;
    secure_url?: string;
    url?: string;
    location?: string;
    webViewLink?: string;
    downloadLink?: string;
    previewUrl?: string;
    storedUrl?: string;
    width?: number;
    height?: number;
    metadata?: {
      width?: number;
      height?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type UploadedImage = {
  url: string;
  width?: number;
  height?: number;
};

async function uploadImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("type", "posts");

  const endpoint = resolveUploadEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (status ${response.status})`);
  }

  const payload = (await response.json()) as UploadApiResponse;
  const imageUrl = payload?.data?.url;
  if (!imageUrl) {
    console.error("Upload response:", payload);
    throw new Error("Image URL not found in upload response.");
  }

  const imageWidth =
    (typeof payload?.data?.width === "number" ? payload.data?.width : undefined) ??
    (typeof payload?.data?.metadata?.width === "number"
      ? (payload.data?.metadata?.width as number)
      : undefined);

  const imageHeight =
    (typeof payload?.data?.height === "number" ? payload.data?.height : undefined) ??
    (typeof payload?.data?.metadata?.height === "number"
      ? (payload.data?.metadata?.height as number)
      : undefined);

  return {
    url: imageUrl,
    width: imageWidth,
    height: imageHeight,
  };
}

function sanitizeContent(raw: string): string {
  if (!raw) return "";
  const withoutEmptyParagraphs = raw.replace(/<p>(?:&nbsp;|\s|<br\s*\/?\>)*<\/p>/gi, "");
  const trimmed = withoutEmptyParagraphs.trim();
  return trimmed.length > 0 ? trimmed : "";
}

// Plugin để load HTML vào editor
function InitialContentPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!html || hasLoaded.current) return;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);

      const root = $getRoot();
      root.clear();

      // Chỉ thêm element nodes vào root (không thêm text nodes trực tiếp)
      nodes.forEach((node) => {
        // Kiểm tra xem node có phải là element node không
        if ($isElementNode(node)) {
          root.append(node);
        } else if (node.getType() === 'text') {
          // Nếu là text node, wrap nó trong paragraph
          const paragraph = $createParagraphNode();
          paragraph.append(node);
          root.append(paragraph);
        }
      });
      
      // Nếu root rỗng, thêm một paragraph trống
      if (root.getChildrenSize() === 0) {
        root.append($createParagraphNode());
      }
    });

    hasLoaded.current = true;
  }, [editor, html]);

  return null;
}

// Toolbar component
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const { resolvedTheme } = useTheme();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>("paragraph");
  const [selectedImageKey, setSelectedImageKey] = useState<NodeKey | null>(null);
  const [selectedImageWidth, setSelectedImageWidth] = useState<number>(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBlockTypeChange = useCallback(
    (type: BlockType) => {
      if (selectedImageKey) return;

      editor.focus(() => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            if (type === "paragraph") {
              $setBlocksType(selection, () => $createParagraphNode());
            } else {
              $setBlocksType(selection, () => $createHeadingNode(type));
            }
            setBlockType(type);
          }
        });
      });
    },
    [editor, selectedImageKey]
  );

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
  let nextImageNode: PostImageNode | null = null;

        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat("bold"));
          setIsItalic(selection.hasFormat("italic"));
          setIsUnderline(selection.hasFormat("underline"));

          const anchorNode = selection.anchor.getNode();
          const element = anchorNode.getKey() === "root"
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();

          if ($isElementNode(element)) {
            const elementType = element.getType();

            if (elementType === "heading") {
              const tag = (element as HeadingNode).getTag();
              if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4") {
                setBlockType(tag);
              } else {
                setBlockType("paragraph");
              }
            } else if (elementType === "paragraph") {
              setBlockType("paragraph");
            } else {
              setBlockType("paragraph");
            }
          } else {
            setBlockType("paragraph");
          }

          nextImageNode = null;
        } else if (selection && (selection as { type?: string }).type === "node") {
          const nodeSelection = selection as unknown as { getNodes: () => LexicalNode[] };
          const nodes = nodeSelection.getNodes();
          if (nodes.length === 1) {
            const node = nodes[0];
            if ($isPostImageNode(node)) {
              nextImageNode = node;
            }
          }

          setIsBold(false);
          setIsItalic(false);
          setIsUnderline(false);
          setBlockType("paragraph");
        } else {
          setIsBold(false);
          setIsItalic(false);
          setIsUnderline(false);
          setBlockType("paragraph");
        }

        if (nextImageNode) {
          setSelectedImageKey(nextImageNode.getKey());
          setSelectedImageWidth(nextImageNode.getWidthPercent());
        } else {
          setSelectedImageKey(null);
          setSelectedImageWidth(100);
        }
      });
    });
  }, [editor]);

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const uploadedImage = await uploadImage(file);
        console.log("Image uploaded successfully:", uploadedImage.url);
        
        editor.update(() => {
          const selection = $getSelection();
          const imageNode = $createPostImageNode({
            src: uploadedImage.url,
            altText: file.name,
            width: uploadedImage.width,
            height: uploadedImage.height,
          });

          if ($isRangeSelection(selection)) {
            selection.insertNodes([imageNode]);
          } else {
            const root = $getRoot();
            root.append(imageNode);
          }
        });
        
        console.log("Image node inserted into editor");
      } catch (error) {
        console.error("Image upload failed:", error);
        alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [editor]
  );

  const buttonClass = (isActive: boolean) =>
    `px-3 py-1.5 rounded border transition-colors ${
      isActive
        ? "bg-primary text-white border-primary"
        : resolvedTheme === "dark"
        ? "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }`;

  const isImageSelected = selectedImageKey !== null;
  const blockControlsDisabled = isImageSelected;

  const handleImageWidthChange = useCallback(
    (widthPercent: number) => {
      if (!selectedImageKey) return;
      editor.update(() => {
        const node = $getNodeByKey(selectedImageKey);
        if (node && $isPostImageNode(node)) {
          node.setWidthPercent(widthPercent);
        }
      });
      setSelectedImageWidth(widthPercent);
    },
    [editor, selectedImageKey]
  );

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-gray-300 dark:border-gray-700">
      <button
        type="button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className={buttonClass(false)}
        title="Undo"
      >
        ↶
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className={buttonClass(false)}
        title="Redo"
      >
        ↷
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-700" />

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className={`${buttonClass(isBold)} ${isImageSelected ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={isImageSelected}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={`${buttonClass(isItalic)} ${isImageSelected ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={isImageSelected}
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        className={`${buttonClass(isUnderline)} ${isImageSelected ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={isImageSelected}
        title="Underline"
      >
        <u>U</u>
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-700" />

      <button
        type="button"
        onClick={() => handleBlockTypeChange("paragraph")}
        className={`${buttonClass(blockType === "paragraph")} ${blockControlsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={blockControlsDisabled}
        title="Paragraph"
      >
        P
      </button>
      {(["h1", "h2", "h3", "h4"] as HeadingLevel[]).map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => handleBlockTypeChange(level)}
          className={`${buttonClass(blockType === level)} ${blockControlsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={blockControlsDisabled}
          title={level.toUpperCase()}
        >
          {level.toUpperCase()}
        </button>
      ))}

      <div className="w-px bg-gray-300 dark:bg-gray-700" />

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        className={buttonClass(false)}
        title="Align Left"
      >
        ⬅
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
        className={buttonClass(false)}
        title="Align Center"
      >
        ↔
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
        className={buttonClass(false)}
        title="Align Right"
      >
        ➡
      </button>

      <div className="w-px bg-gray-300 dark:bg-gray-700" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={buttonClass(false)}
        title="Insert Image"
      >
        🖼️
      </button>

      {isImageSelected && (
        <>
          <div className="w-px bg-gray-300 dark:bg-gray-700" />
          <span className="px-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300">
            Image Width
          </span>
          {[100, 75, 66, 50, 33].map((percent) => (
            <button
              key={percent}
              type="button"
              onClick={() => handleImageWidthChange(percent)}
              className={`${buttonClass(selectedImageWidth === percent)} ${
                selectedImageWidth === percent ? "" : ""}
              }`}
            >
              {percent}%
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// Plugin để convert HTML khi có thay đổi
function HtmlExportPlugin({ onChange }: { onChange: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const htmlString = $generateHtmlFromNodes(editor);
        const sanitized = sanitizeContent(htmlString);
        onChange(sanitized);
      });
    });
  }, [editor, onChange]);

  return null;
}

function LexicalEditorInternal({
  name,
  label,
  defaultValue = "",
  placeholder = "Enter content...",
  required,
  onChange,
  minHeight = 380,
}: LexicalEditorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState(() => sanitizeContent(defaultValue));
  const sanitizedDefault = useMemo(() => sanitizeContent(defaultValue), [defaultValue]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = useCallback(
    (html: string) => {
      setValue(html);
      onChange?.(html);
    },
    [onChange]
  );

  const initialConfig = useMemo(
    () => ({
      namespace: "PostEditor",
      theme: {
        paragraph: "mb-2",
        heading: {
          h1: "text-3xl font-bold mb-4",
          h2: "text-2xl font-semibold mb-3",
          h3: "text-xl font-semibold mb-2",
          h4: "text-lg font-semibold mb-2",
        },
        text: {
          bold: "font-bold",
          italic: "italic",
          underline: "underline",
        },
      },
      onError: (error: Error) => {
        console.error("Lexical error:", error);
      },
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        AutoLinkNode,
        CodeNode,
  PostImageNode,
      ],
    }),
    []
  );

  const contentEditableClass = useMemo(
    () =>
      `p-4 outline-none ${
        resolvedTheme === "dark"
          ? "bg-gray-800 text-gray-200"
          : "bg-white text-gray-900"
      } [&_img]:max-w-full [&_img]:h-auto [&_img]:inline-block [&_img]:my-2`,
    [resolvedTheme]
  );

  const contentEditableStyle = useMemo(
    () => ({ minHeight: `${minHeight}px` }),
    [minHeight]
  );

  const containerClass = useMemo(
    () =>
      `border rounded ${
        resolvedTheme === "dark" ? "border-gray-700" : "border-gray-300"
      }`,
    [resolvedTheme]
  );

  if (!mounted) {
    return (
      <div className="space-y-3">
        <label className="text-body-sm font-medium text-dark dark:text-white">
          {label}
          {required && <span className="ml-1 text-red">*</span>}
        </label>
        <div
          className="border rounded border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800 animate-pulse"
          style={{ minHeight: `${minHeight + 60}px` }}
        >
          <div className="text-gray-400">Loading editor...</div>
        </div>
        <input type="hidden" name={name} value={value} required={required} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-body-sm font-medium text-dark dark:text-white">
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </label>

      <LexicalComposer initialConfig={initialConfig}>
        <div className={containerClass}>
          <ToolbarPlugin />
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={contentEditableClass}
                style={contentEditableStyle}
              />
            }
            placeholder={
              <div className="absolute top-16 left-4 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          {sanitizedDefault && <InitialContentPlugin html={sanitizedDefault} />}
          <HtmlExportPlugin onChange={handleChange} />
        </div>
      </LexicalComposer>

      <input type="hidden" name={name} value={value} required={required} />
    </div>
  );
}

// Export với dynamic import để tránh hydration error
export const LexicalEditor = LexicalEditorInternal;
