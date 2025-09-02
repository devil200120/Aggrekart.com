import React, { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  Plus,
  Type,
  Image,
  List,
  Quote,
  Video,
  Minus,
  RotateCcw,
} from "lucide-react";
import ContentBlock from "./ContentBlock";
import "./ContentBuilder.css";

const ContentBuilder = ({ blocks = [], onChange, onImageUpload }) => {
  const [draggedBlock, setDraggedBlock] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const blockTypes = [
    { type: "heading", icon: Type, label: "Heading", color: "#3b82f6" },
    { type: "text", icon: Type, label: "Text", color: "#6b7280" },
    { type: "image", icon: Image, label: "Image", color: "#10b981" },
    { type: "list", icon: List, label: "List", color: "#f59e0b" },
    { type: "quote", icon: Quote, label: "Quote", color: "#8b5cf6" },
    { type: "video", icon: Video, label: "Video", color: "#ef4444" },
    { type: "spacer", icon: Minus, label: "Spacer", color: "#64748b" },
    { type: "divider", icon: RotateCcw, label: "Divider", color: "#6b7280" },
  ];

  const addBlock = useCallback(
    (type) => {
      const newBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        content: getDefaultContent(type),
        position: blocks.length,
        styles: {
          textAlign: "left",
          fontSize: type === "heading" ? "24px" : "16px",
          fontWeight: type === "heading" ? "bold" : "normal",
          color: "#000000",
          backgroundColor: "transparent",
          margin: "16px 0",
          padding: "0",
        },
        settings: {},
        createdAt: new Date(),
      };

      const updatedBlocks = [...blocks, newBlock];
      onChange(updatedBlocks);
    },
    [blocks, onChange]
  );

  const updateBlock = useCallback(
    (blockId, updates) => {
      const updatedBlocks = blocks.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block
      );
      onChange(updatedBlocks);
    },
    [blocks, onChange]
  );

  const deleteBlock = useCallback(
    (blockId) => {
      const updatedBlocks = blocks
        .filter((block) => block.id !== blockId)
        .map((block, index) => ({ ...block, position: index }));
      onChange(updatedBlocks);
    },
    [blocks, onChange]
  );

  const duplicateBlock = useCallback(
    (block) => {
      const newBlock = {
        ...block,
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: block.position + 1,
        createdAt: new Date(),
      };

      const updatedBlocks = [
        ...blocks.slice(0, block.position + 1),
        newBlock,
        ...blocks
          .slice(block.position + 1)
          .map((b) => ({ ...b, position: b.position + 1 })),
      ];
      onChange(updatedBlocks);
    },
    [blocks, onChange]
  );

  const handleDragStart = useCallback(
    (event) => {
      const { active } = event;
      setDraggedBlock(blocks.find((block) => block.id === active.id));
    },
    [blocks]
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setDraggedBlock(null);

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      const reorderedBlocks = arrayMove(blocks, oldIndex, newIndex).map(
        (block, index) => ({ ...block, position: index })
      );

      onChange(reorderedBlocks);
    },
    [blocks, onChange]
  );

  return (
    <div className="content-builder">
      <div className="content-builder-header">
        <h3>Content Builder</h3>
        <p>
          Drag and drop blocks to create your content. Click on blocks to edit
          them.
        </p>
      </div>

      {/* Block Palette */}
      <div className="block-palette">
        <h4>Add Blocks</h4>
        <div className="block-types-grid">
          {blockTypes.map(({ type, icon: Icon, label, color }) => (
            <button
              key={type}
              className="block-type-button"
              onClick={() => addBlock(type)}
              style={{ "--block-color": color }}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Canvas */}
      <div className="content-canvas">
        <h4>Content Preview</h4>
        {blocks.length === 0 ? (
          <div className="empty-canvas">
            <p>No content blocks yet. Add some blocks above to get started!</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={blocks.map((block) => block.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="blocks-container">
                {blocks.map((block) => (
                  <ContentBlock
                    key={block.id}
                    block={block}
                    onUpdate={updateBlock}
                    onDelete={deleteBlock}
                    onDuplicate={duplicateBlock}
                    onImageUpload={onImageUpload}
                    isDragging={draggedBlock?.id === block.id}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

// Helper function to get default content for each block type
const getDefaultContent = (type) => {
  const defaults = {
    heading: { text: "New Heading", level: 2 },
    text: { html: "<p>Your text content goes here...</p>" },
    image: { url: "", alt: "", caption: "" },
    list: { items: ["Item 1", "Item 2"], ordered: false },
    quote: { text: "Your quote here...", author: "", cite: "" },
    video: { url: "", title: "", autoplay: false },
    spacer: { height: 32 },
    divider: { style: "solid", thickness: 1, color: "#e5e7eb" },
  };
  return defaults[type] || {};
};

export default ContentBuilder;
