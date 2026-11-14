'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Folder,
  FolderOpen,
  PlayCircle,
  CheckCircle2,
  Lock,
  Clock,
  Play,
} from 'lucide-react';
import { HierarchyNode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CurriculumTreeProps {
  nodes: HierarchyNode[];
  courseId: string;
  activeLessonId?: string;
  onSelectLesson?: (lessonId: string) => void;
  compact?: boolean;
}

export function CurriculumTree({
  nodes,
  courseId,
  activeLessonId,
  onSelectLesson,
  compact = false,
}: CurriculumTreeProps) {
  // Store expanded state for chapters and folders
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(() => {
    // Default open all top level chapters
    const init: Record<string, boolean> = {};
    const expandAll = (list: HierarchyNode[]) => {
      for (const item of list) {
        if (item.type !== 'lesson') {
          init[item.id] = true;
          if (item.children) expandAll(item.children);
        }
      }
    };
    expandAll(nodes);
    return init;
  });

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const countLessons = (node: HierarchyNode): number => {
    let count = 0;
    if (node.type === 'lesson') count++;
    if (node.children) {
      for (const c of node.children) count += countLessons(c);
    }
    return count;
  };

  const renderNode = (node: HierarchyNode, depth = 0) => {
    const isExpanded = !!expandedMap[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isCurrent = node.id === activeLessonId;
    const isCompleted = Boolean(node.progress?.completed);

    if (node.type === 'chapter') {
      const lessonCount = countLessons(node);

      return (
        <div key={node.id} className="border border-border/80 rounded-card overflow-hidden bg-background-secondary mb-2.5">
          <button
            onClick={(e) => toggleNode(node.id, e)}
            className="w-full px-4 py-3 bg-[#131316] hover:bg-background-hover flex items-center justify-between transition-colors text-left select-none"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-foreground-muted">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-foreground-secondary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-foreground-secondary" />
                )}
              </span>
              <Layers className="w-4 h-4 text-accent shrink-0" />
              <span className="font-semibold text-xs tracking-wide uppercase text-foreground truncate">
                {node.title}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-foreground-muted font-mono shrink-0 ml-2">
              <span>{lessonCount} lessons</span>
              {node.duration && (
                <>
                  <span>•</span>
                  <span>{node.duration}</span>
                </>
              )}
            </div>
          </button>

          {isExpanded && hasChildren && (
            <div className="divide-y divide-border/40 bg-background-card/50">
              {node.children!.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (node.type === 'folder') {
      const childCount = node.children?.length || 0;

      return (
        <div key={node.id} className="border-l border-border/60 pl-2 my-1">
          <button
            onClick={(e) => toggleNode(node.id, e)}
            className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-background-hover rounded transition-colors group select-none"
            style={{ paddingLeft: `${Math.max(12, depth * 12)}px` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-foreground-muted">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-accent/80 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
              )}
              <span className="text-xs font-medium text-foreground-secondary group-hover:text-foreground tracking-wide uppercase truncate font-mono">
                {node.title}
              </span>
            </div>
            <span className="text-[10px] text-foreground-muted font-mono ml-2">
              {childCount} items
            </span>
          </button>

          {isExpanded && hasChildren && (
            <div className="space-y-0.5 mt-0.5">
              {node.children!.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // Node is a LESSON
    const lessonContent = (
      <div
        className={cn(
          'flex items-center justify-between px-3.5 py-2.5 transition-colors cursor-pointer group',
          isCurrent
            ? 'bg-accent/15 border-l-2 border-accent text-foreground'
            : isCompleted
            ? 'hover:bg-background-hover text-foreground-secondary'
            : 'hover:bg-background-hover text-foreground-secondary hover:text-foreground',
          compact && 'py-2 px-2.5 text-xs'
        )}
        style={{ paddingLeft: `${Math.max(14, depth * 14)}px` }}
        onClick={() => onSelectLesson && onSelectLesson(node.id)}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Status Indicator */}
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
          ) : isCurrent ? (
            <div className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Play className="w-2.5 h-2.5 text-accent fill-accent ml-0.5" />
            </div>
          ) : (
            <PlayCircle className="w-4 h-4 text-foreground-muted group-hover:text-foreground-secondary shrink-0" />
          )}

          <span
            className={cn(
              'text-xs truncate transition-colors',
              isCurrent ? 'font-medium text-accent' : 'text-foreground group-hover:text-foreground'
            )}
          >
            {node.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {node.duration && (
            <span className="text-[11px] font-mono text-foreground-muted">
              {node.duration}
            </span>
          )}
          {isCurrent && (
            <span className="text-[9px] font-mono uppercase bg-accent text-zinc-950 font-semibold px-1.5 py-0.2 rounded">
              Playing
            </span>
          )}
        </div>
      </div>
    );

    if (onSelectLesson) {
      return <div key={node.id}>{lessonContent}</div>;
    }

    return (
      <Link key={node.id} href={`/watch/${courseId}/${node.id}`}>
        {lessonContent}
      </Link>
    );
  };

  return (
    <div className="space-y-2">
      {nodes.length === 0 ? (
        <div className="py-8 text-center text-xs text-foreground-muted border border-dashed border-border rounded-card">
          No chapters or lessons uploaded yet.
        </div>
      ) : (
        nodes.map((node) => renderNode(node, 0))
      )}
    </div>
  );
}

