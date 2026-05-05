"use client";

import { useState } from "react";
import { NdaSnapshot } from "@/utils/api";
import { useDocuments } from "@/hooks/useDocuments";

interface DocumentCardProps {
  document: NdaSnapshot;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const { renameDocument, updateTags, deleteDocument } = useDocuments();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(document.title);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRename = async () => {
    if (!newTitle.trim() || newTitle === document.title) {
      setIsRenaming(false);
      return;
    }

    setIsLoading(true);
    try {
      await renameDocument(document.id, newTitle);
      setIsRenaming(false);
    } catch (error) {
      console.error("Failed to rename:", error);
      setNewTitle(document.title);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || document.tags.includes(newTag)) {
      setIsAddingTag(false);
      return;
    }

    setIsLoading(true);
    try {
      await updateTags(document.id, [...document.tags, newTag]);
      setNewTag("");
      setIsAddingTag(false);
    } catch (error) {
      console.error("Failed to add tag:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    setIsLoading(true);
    try {
      await updateTags(
        document.id,
        document.tags.filter((t) => t !== tag)
      );
    } catch (error) {
      console.error("Failed to remove tag:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setIsLoading(true);
    try {
      await deleteDocument(document.id);
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createdDate = new Date(document.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Title */}
      {isRenaming ? (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setNewTitle(document.title);
                setIsRenaming(false);
              }
            }}
            autoFocus
          />
          <button
            onClick={handleRename}
            disabled={isLoading}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Save
          </button>
          <button
            onClick={() => {
              setNewTitle(document.title);
              setIsRenaming(false);
            }}
            disabled={isLoading}
            className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {document.title}
          </h3>
          <button
            onClick={() => setIsRenaming(true)}
            disabled={isLoading}
            className="ml-2 text-xs text-gray-500 hover:text-gray-700 disabled:text-gray-300"
            title="Rename"
          >
            ✎
          </button>
        </div>
      )}

      {/* Tags */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1 mb-2">
          {document.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                disabled={isLoading}
                className="hover:text-blue-900 disabled:text-blue-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {isAddingTag ? (
          <div className="flex gap-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTag();
                if (e.key === "Escape") {
                  setNewTag("");
                  setIsAddingTag(false);
                }
              }}
              autoFocus
            />
            <button
              onClick={handleAddTag}
              disabled={isLoading || !newTag.trim()}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTag(true)}
            disabled={isLoading}
            className="text-xs text-gray-500 hover:text-gray-700 disabled:text-gray-300"
          >
            + Add tag
          </button>
        )}
      </div>

      {/* Date and Delete */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">{createdDate}</p>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="text-xs text-red-600 hover:text-red-700 disabled:text-gray-400"
          title="Delete"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
