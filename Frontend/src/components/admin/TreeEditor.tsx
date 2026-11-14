'use client';

import React, { useState } from 'react';
import {
  Layers,
  Folder,
  PlayCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Edit2,
  Check,
  X,
  Link as LinkIcon,
  Clock,
  Copy,
  Download,
  Upload,
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface EditorNode {
  id: string;
  type: 'chapter' | 'folder' | 'lesson';
  title: string;
  url?: string;
  duration?: string;
  children?: EditorNode[];
}

interface TreeEditorProps {
  initialTree: EditorNode[];
  onSave: (tree: EditorNode[]) => Promise<void>;
  courseTitle: string;
}

export function TreeEditor({ initialTree, onSave, courseTitle }: TreeEditorProps) {
  const [tree, setTree] = useState<EditorNode[]>(initialTree);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; url: string; duration: string }>({
    title: '',
    url: '',
    duration: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const startEdit = (node: EditorNode) => {
    setEditingId(node.id);
    setEditForm({
      title: node.title,
      url: node.url || '',
      duration: node.duration || '',
    });
  };

  const saveEdit = (targetId: string) => {
    const updateRecursive = (list: EditorNode[]): EditorNode[] => {
      return list.map((item) => {
        if (item.id === targetId) {
          return {
            ...item,
            title: editForm.title.trim() || 'Untitled',
            url: editForm.url.trim() || undefined,
            duration: editForm.duration.trim() || undefined,
          };
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };

    setTree(updateRecursive(tree));
    setEditingId(null);
  };

  const deleteNode = (targetId: string) => {
    if (!confirm('Are you sure you want to delete this node and any nested contents?')) {
      return;
    }
    const deleteRecursive = (list: EditorNode[]): EditorNode[] => {
      return list
        .filter((item) => item.id !== targetId)
        .map((item) => {
          if (item.children) {
            return { ...item, children: deleteRecursive(item.children) };
          }
          return item;
        });
    };
    setTree(deleteRecursive(tree));
  };

  const moveNode = (targetId: string, direction: 'up' | 'down') => {
    const moveInList = (list: EditorNode[]): EditorNode[] => {
      const idx = list.findIndex((x) => x.id === targetId);
      if (idx !== -1) {
        const copy = [...list];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx >= 0 && swapIdx < copy.length) {
          const temp = copy[idx];
          copy[idx] = copy[swapIdx];
          copy[swapIdx] = temp;
          return copy;
        }
        return list;
      }
      return list.map((item) => {
        if (item.children) {
          return { ...item, children: moveInList(item.children) };
        }
        return item;
      });
    };
    setTree(moveInList(tree));
  };

  const addNode = (parentId: string | null, type: 'chapter' | 'folder' | 'lesson') => {
    const newNode: EditorNode = {
      id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      title: type === 'chapter' ? 'New Chapter' : type === 'folder' ? 'New Folder' : 'New Video Lesson',
      url: type === 'lesson' ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : undefined,
      duration: type === 'lesson' ? '10:00' : undefined,
      children: type !== 'lesson' ? [] : undefined,
    };

    if (!parentId) {
      setTree([...tree, newNode]);
      return;
    }

    const addRecursive = (list: EditorNode[]): EditorNode[] => {
      return list.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...(item.children || []), newNode],
          };
        }
        if (item.children) {
          return { ...item, children: addRecursive(item.children) };
        }
        return item;
      });
    };

    setTree(addRecursive(tree));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await onSave(tree);
      setFeedback({ type: 'success', message: 'Curriculum hierarchy saved successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const copyJson = () => {
    const payload = {
      title: courseTitle,
      children: tree,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    alert('Course JSON copied to clipboard!');
  };

  const renderNode = (node: EditorNode, parentId: string | null = null, depth = 0) => {
    const isEditing = editingId === node.id;

    return (
      <div
        key={node.id}
        className="border border-border/80 bg-background-card rounded-md mb-2 overflow-hidden"
        style={{ marginLeft: `${Math.min(depth * 16, 64)}px` }}
      >
        <div className="p-2.5 flex items-center justify-between gap-3 bg-[#131316] hover:bg-background-hover/70 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {node.type === 'chapter' && <Layers className="w-4 h-4 text-accent shrink-0" />}
            {node.type === 'folder' && <Folder className="w-4 h-4 text-status-warning shrink-0" />}
            {node.type === 'lesson' && <PlayCircle className="w-4 h-4 text-foreground-secondary shrink-0" />}

            {isEditing ? (
              <div className="flex-1 flex flex-col sm:flex-row gap-2 py-1">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Title"
                  className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground flex-1 outline-none focus:border-accent"
                />
                {node.type === 'lesson' && (
                  <>
                    <input
                      type="text"
                      value={editForm.url}
                      onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      placeholder="Video URL (mp4, YouTube, Vimeo)"
                      className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground flex-1 font-mono outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      value={editForm.duration}
                      onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                      placeholder="Duration (12:30)"
                      className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground w-24 font-mono outline-none focus:border-accent"
                    />
                  </>
                )}
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="primary" onClick={() => saveEdit(node.id)}>
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {node.title}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800/80 text-foreground-muted border border-border">
                    {node.type}
                  </span>
                </div>
                {node.type === 'lesson' && (
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-foreground-muted font-mono truncate">
                    {node.url && (
                      <span className="truncate max-w-xs flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-foreground-muted" />
                        {node.url}
                      </span>
                    )}
                    {node.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {node.duration}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isEditing && (
            <div className="flex items-center gap-1 shrink-0">
              {node.type !== 'lesson' && (
                <>
                  <button
                    onClick={() => addNode(node.id, 'folder')}
                    title="Add Nested Folder"
                    className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-zinc-800"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => addNode(node.id, 'lesson')}
                    title="Add Lesson"
                    className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-zinc-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <button
                onClick={() => moveNode(node.id, 'up')}
                title="Move Up"
                className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-zinc-800"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveNode(node.id, 'down')}
                title="Move Down"
                className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-zinc-800"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => startEdit(node)}
                title="Edit Node"
                className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-zinc-800"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteNode(node.id)}
                title="Delete Node"
                className="p-1 rounded text-status-error/80 hover:text-status-error hover:bg-status-error/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Children nodes */}
        {node.children && node.children.length > 0 && (
          <div className="p-2 border-t border-border/50 bg-background/50">
            {node.children.map((child) => renderNode(child, node.id, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-background-secondary p-3 rounded-card border border-border">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => addNode(null, 'chapter')}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Chapter
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addNode(null, 'lesson')}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Root Lesson
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={copyJson} title="Copy JSON">
            <Copy className="w-3.5 h-3.5" />
            Copy JSON
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Curriculum Tree'}
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs border ${
            feedback.type === 'success'
              ? 'bg-status-success/10 border-status-success/30 text-status-success'
              : 'bg-status-error/10 border-status-error/30 text-status-error'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Editor Tree List */}
      <div className="space-y-1">
        {tree.length === 0 ? (
          <div className="py-12 text-center text-xs text-foreground-muted border border-dashed border-border rounded-card">
            No items in curriculum yet. Click "Add Chapter" above to start building.
          </div>
        ) : (
          tree.map((node) => renderNode(node, null, 0))
        )}
      </div>
    </div>
  );
}

