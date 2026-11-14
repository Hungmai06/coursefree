import React from 'react';
import { notFound } from 'next/navigation';
import { WatchLessonClient } from './WatchLessonClient';
import { fetchFromBackend } from '@/lib/api';

export const dynamic = 'force-dynamic';

function isNodeFolder(node: any): boolean {
  if (node.children && Array.isArray(node.children) && node.children.length > 0) {
    return true;
  }
  const title = (node.title || '').trim().toLowerCase();
  const isVideoFile = /\.(mp4|mkv|webm|avi|mov|flv|wmv|m4v)$/i.test(title);
  const isDocFile = /\.(zip|rar|7z|tar|gz|pdf|docx|xlsx|doc|txt)$/i.test(title);
  if (isVideoFile || isDocFile) {
    return false;
  }
  if (node.type === 'lesson') {
    return false;
  }
  if (node.url && node.url.trim().length > 0) {
    return false;
  }
  return node.type === 'chapter' || node.type === 'folder';
}

function extractLessonsFromTree(nodes: any[]): any[] {
  const result: any[] = [];
  function traverse(list: any[]) {
    if (!list || !Array.isArray(list)) return;
    for (const item of list) {
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        traverse(item.children);
      } else if (!isNodeFolder(item)) {
        result.push(item);
      }
    }
  }
  traverse(nodes);
  return result;
}

function isLessonNodeCompleted(node: any): boolean {
  if (!node) return false;
  if (node.completed === true) return true;
  if (node.progress) {
    if (Array.isArray(node.progress)) {
      return node.progress.some((p: any) => Boolean(p.completed));
    }
    if (typeof node.progress === 'object') {
      return Boolean(node.progress.completed);
    }
  }
  return false;
}

export default async function WatchPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const { courseId, lessonId } = params;

  let course;
  try {
    course = await fetchFromBackend(`/courses/${courseId}`);
  } catch (err) {
    notFound();
  }

  if (!course) {
    notFound();
  }

  const currentLessonNode = course.nodes?.find((n: any) => String(n.id) === String(lessonId));
  if (!currentLessonNode) {
    notFound();
  }

  let parentTitle: string | undefined;
  if (currentLessonNode.parentId) {
    const parentNode = course.nodes.find((n: any) => String(n.id) === String(currentLessonNode.parentId));
    parentTitle = parentNode?.title;
  }

  const fromTree = extractLessonsFromTree(course.tree || []);
  const orderedLessons = fromTree.length > 0
    ? fromTree
    : (course.nodes || [])
        .filter((n: any) => !isNodeFolder(n))
        .sort((a: any, b: any) => a.position - b.position);

  const allLessonsFlat = orderedLessons.map((l: any) => ({
    id: String(l.id),
    title: l.title,
    courseId: l.courseId,
    duration: l.duration,
    url: l.url,
    completed: isLessonNodeCompleted(l),
  }));

  const userProgress = currentLessonNode.progress && currentLessonNode.progress.length > 0
    ? currentLessonNode.progress[0]
    : null;

  return (
    <WatchLessonClient
      courseId={course.id}
      courseTitle={course.title}
      tree={course.tree || []}
      currentLesson={{
        id: currentLessonNode.id,
        courseId: currentLessonNode.courseId,
        parentId: currentLessonNode.parentId,
        type: currentLessonNode.type,
        title: currentLessonNode.title,
        url: currentLessonNode.url,
        duration: currentLessonNode.duration,
        position: currentLessonNode.position,
        progress: userProgress
          ? {
              completed: userProgress.completed,
              lastPosition: userProgress.lastPosition,
            }
          : null,
      }}
      chapterTitle={parentTitle}
      initialCompleted={Boolean(userProgress?.completed)}
      initialLastPosition={Number(userProgress?.lastPosition || 0)}
      allLessonsFlat={allLessonsFlat}
    />
  );
}
