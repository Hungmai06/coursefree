export type NodeType = 'chapter' | 'folder' | 'lesson';

export interface HierarchyNode {
  id: string;
  courseId: string;
  parentId: string | null;
  type: NodeType;
  title: string;
  url?: string | null;
  duration?: string | null;
  position: number;
  children?: HierarchyNode[];
  progress?: {
    completed: boolean;
    lastPosition: number;
  } | null;
}

export interface CourseWithStats {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  instructor?: string | null;
  level?: string | null;
  duration?: string | null;
  totalChapters: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  firstLessonId?: string | null;
  createdAt: string | Date;
}

export interface ParsedJsonNode {
  type: 'chapter' | 'folder' | 'lesson';
  title: string;
  url?: string;
  duration?: string;
  children?: ParsedJsonNode[];
}

export interface ParsedCourseJson {
  title: string;
  description?: string;
  category?: string;
  instructor?: string;
  thumbnail?: string;
  children: ParsedJsonNode[];
}
