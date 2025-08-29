import React, { useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Settings,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Image,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const ContentBlock = ({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
  onImageUpload,
  isDragging,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isDragActive,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragActive ? 0.5 : 1,
  };

  const updateContent = (newContent) => {
    onUpdate(block.id, { content: newContent });
  };

  const updateStyles = (newStyles) => {
    onUpdate(block.id, { styles: { ...block.styles, ...newStyles } });
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      const imageUrl = await onImageUpload(file);
      updateContent({ ...block.content, url: imageUrl });
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
    }
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case "heading":
        return (
          <div className="heading-block">
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={block.content.text || ""}
                  onChange={(e) =>
                    updateContent({ ...block.content, text: e.target.value })
                  }
                  className="heading-input"
                  placeholder="Enter heading text..."
                  autoFocus
                />
                <select
                  value={block.content.level || 2}
                  onChange={(e) =>
                    updateContent({
                      ...block.content,
                      level: parseInt(e.target.value),
                    })
                  }
                  className="heading-level-select"
                >
                  <option value={1}>H1</option>
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                  <option value={4}>H4</option>
                  <option value={5}>H5</option>
                  <option value={6}>H6</option>
                </select>
              </div>
            ) : (
              React.createElement(
                `h${block.content.level || 2}`,
                { style: block.styles },
                block.content.text || "New Heading"
              )
            )}
          </div>
        );

      case "text":
        return (
          <div className="text-block">
            {isEditing ? (
              <ReactQuill
                value={block.content.html || ""}
                onChange={(html) => updateContent({ ...block.content, html })}
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline"],
                    ["link"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["clean"],
                  ],
                }}
              />
            ) : (
              <div
                style={block.styles}
                dangerouslySetInnerHTML={{
                  __html: block.content.html || "<p>Empty text block</p>",
                }}
              />
            )}
          </div>
        );

      case "image":
        return (
          <div className="image-block">
            {block.content.url ? (
              <div className="image-container">
                <img
                  src={block.content.url}
                  alt={block.content.alt || ""}
                  style={block.styles}
                />
                {block.content.caption && (
                  <p className="image-caption">{block.content.caption}</p>
                )}
                {isEditing && (
                  <div className="image-controls">
                    <input
                      type="text"
                      placeholder="Alt text..."
                      value={block.content.alt || ""}
                      onChange={(e) =>
                        updateContent({ ...block.content, alt: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Caption..."
                      value={block.content.caption || ""}
                      onChange={(e) =>
                        updateContent({
                          ...block.content,
                          caption: e.target.value,
                        })
                      }
                    />
                    <button onClick={() => fileInputRef.current?.click()}>
                      <Upload size={16} /> Change Image
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="image-placeholder"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image size={48} />
                <p>Click to upload image</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files[0] && handleImageUpload(e.target.files[0])
              }
              style={{ display: "none" }}
            />
          </div>
        );

      case "list":
        return (
          <div className="list-block">
            {isEditing ? (
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={block.content.ordered || false}
                    onChange={(e) =>
                      updateContent({
                        ...block.content,
                        ordered: e.target.checked,
                      })
                    }
                  />
                  Numbered list
                </label>
                <textarea
                  value={(block.content.items || []).join("\n")}
                  onChange={(e) =>
                    updateContent({
                      ...block.content,
                      items: e.target.value
                        .split("\n")
                        .filter((item) => item.trim()),
                    })
                  }
                  placeholder="Enter list items (one per line)..."
                  rows={5}
                />
              </div>
            ) : (
              React.createElement(
                block.content.ordered ? "ol" : "ul",
                { style: block.styles },
                (block.content.items || []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))
              )
            )}
          </div>
        );

      case "quote":
        return (
          <div className="quote-block">
            {isEditing ? (
              <div>
                <textarea
                  value={block.content.text || ""}
                  onChange={(e) =>
                    updateContent({ ...block.content, text: e.target.value })
                  }
                  placeholder="Quote text..."
                  rows={3}
                />
                <input
                  type="text"
                  value={block.content.author || ""}
                  onChange={(e) =>
                    updateContent({ ...block.content, author: e.target.value })
                  }
                  placeholder="Author name..."
                />
              </div>
            ) : (
              <blockquote style={block.styles}>
                <p>"{block.content.text || "Empty quote"}"</p>
                {block.content.author && <cite>— {block.content.author}</cite>}
              </blockquote>
            )}
          </div>
        );

      case "video":
        return (
          <div className="video-block">
            {isEditing ? (
              <div>
                <input
                  type="url"
                  value={block.content.url || ""}
                  onChange={(e) =>
                    updateContent({ ...block.content, url: e.target.value })
                  }
                  placeholder="YouTube or Vimeo URL..."
                />
                <input
                  type="text"
                  value={block.content.title || ""}
                  onChange={(e) =>
                    updateContent({ ...block.content, title: e.target.value })
                  }
                  placeholder="Video title..."
                />
              </div>
            ) : block.content.url ? (
              <div className="video-container">
                <iframe
                  src={getEmbedUrl(block.content.url)}
                  title={block.content.title || "Video"}
                  style={block.styles}
                />
              </div>
            ) : (
              <div className="video-placeholder">No video URL provided</div>
            )}
          </div>
        );

      case "spacer":
        return (
          <div className="spacer-block">
            {isEditing ? (
              <input
                type="number"
                value={block.content.height || 32}
                onChange={(e) =>
                  updateContent({
                    ...block.content,
                    height: parseInt(e.target.value),
                  })
                }
                min={8}
                max={200}
              />
            ) : (
              <div
                style={{
                  height: `${block.content.height || 32}px`,
                  backgroundColor: "#f3f4f6",
                }}
              >
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  Spacer ({block.content.height || 32}px)
                </span>
              </div>
            )}
          </div>
        );

      case "divider":
        return (
          <div className="divider-block">
            <hr
              style={{
                border: "none",
                borderTop: `${block.content.thickness || 1}px ${block.content.style || "solid"} ${block.content.color || "#e5e7eb"}`,
                margin: "16px 0",
              }}
            />
          </div>
        );

      default:
        return <div>Unknown block type: {block.type}</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`content-block ${isDragActive ? "dragging" : ""} ${isEditing ? "editing" : ""}`}
    >
      <div className="block-toolbar">
        <div className="block-info">
          <button className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={16} />
          </button>
          <span className="block-type">{block.type}</span>
        </div>

        <div className="block-actions">
          <button onClick={() => setIsEditing(!isEditing)} title="Edit">
            {isEditing ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button onClick={() => onDuplicate(block)} title="Duplicate">
            <Copy size={16} />
          </button>
          <button onClick={() => onDelete(block.id)} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="block-settings">
          <div className="settings-row">
            <label>Text Align:</label>
            <div className="align-buttons">
              <button onClick={() => updateStyles({ textAlign: "left" })}>
                <AlignLeft size={16} />
              </button>
              <button onClick={() => updateStyles({ textAlign: "center" })}>
                <AlignCenter size={16} />
              </button>
              <button onClick={() => updateStyles({ textAlign: "right" })}>
                <AlignRight size={16} />
              </button>
            </div>
          </div>
          <div className="settings-row">
            <label>Font Size:</label>
            <input
              type="text"
              value={block.styles?.fontSize || "16px"}
              onChange={(e) => updateStyles({ fontSize: e.target.value })}
            />
          </div>
          <div className="settings-row">
            <label>Color:</label>
            <input
              type="color"
              value={block.styles?.color || "#000000"}
              onChange={(e) => updateStyles({ color: e.target.value })}
            />
          </div>
        </div>
      )}

      <div
        className="block-content"
        onClick={() => !isEditing && setIsEditing(true)}
      >
        {renderBlockContent()}
      </div>
    </div>
  );
};

// Helper function to convert video URLs to embed URLs
const getEmbedUrl = (url) => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  }
  if (url.includes("vimeo.com")) {
    const videoId = url.match(/vimeo\.com\/(\d+)/);
    return videoId ? `https://player.vimeo.com/video/${videoId[1]}` : url;
  }
  return url;
};

export default ContentBlock;
