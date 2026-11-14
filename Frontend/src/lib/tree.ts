import { HierarchyNode } from './types';

export function buildHierarchyTree(rawNodes: any[]): HierarchyNode[] {
  const nodeMap = new Map<string, HierarchyNode>();

  // Initialize node representations
  for (const n of rawNodes) {
    const userProgress = n.progress && n.progress.length > 0 ? n.progress[0] : null;
    nodeMap.set(n.id, {
      id: n.id,
      courseId: n.courseId,
      parentId: n.parentId,
      type: n.type,
      title: n.title,
      url: n.url,
      duration: n.duration,
      position: n.position,
      children: [],
      progress: userProgress
        ? {
            completed: Boolean(userProgress.completed),
            lastPosition: Number(userProgress.lastPosition || 0),
          }
        : null,
    });
  }

  const rootNodes: HierarchyNode[] = [];

  for (const node of Array.from(nodeMap.values())) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  // Recursive sort by position
  const sortRecursive = (nodes: HierarchyNode[]) => {
    nodes.sort((a, b) => a.position - b.position);
    for (const child of nodes) {
      if (child.children && child.children.length > 0) {
        sortRecursive(child.children);
      }
    }
  };

  sortRecursive(rootNodes);
  return rootNodes;
}

export function flattenHierarchy(
  nodes: any[],
  courseId: string,
  parentId: string | null = null,
  startPos = 0
): any[] {
  const flat: any[] = [];
  let pos = startPos;

  for (const item of nodes) {
    pos += 1;
    const currentId = item.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    flat.push({
      id: currentId,
      courseId,
      parentId,
      type: item.type || 'lesson',
      title: item.title,
      url: item.url || null,
      duration: item.duration || null,
      position: pos,
    });

    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
      const childFlat = flattenHierarchy(item.children, courseId, currentId, 0);
      flat.push(...childFlat);
    }
  }

  return flat;
}
