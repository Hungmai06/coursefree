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

interface RawLineItem {
  raw: string;
  indent: number;
  text: string;
  url?: string;
  duration?: string;
  explicitType?: 'chapter' | 'folder' | 'lesson';
}

export function parseCourseStructureText(rawText: string): ParsedCourseJson {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Input text is empty.');
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return validateAndNormalizeCourseJson(parsed);
    } catch (e: any) {
      // Continue to textual parser
    }
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);

  let courseTitle = 'Untitled Course';
  let startIndex = 0;

  const firstLine = lines[0].trim();
  if (
    firstLine.startsWith('# ') ||
    firstLine.toLowerCase().startsWith('course:') ||
    firstLine.toLowerCase().startsWith('tên khóa học:') ||
    (!firstLine.match(/^(chapter|ch\.|chương|module|section|\d+[\.\)])/i) &&
      lines.length > 1 &&
      lines[1].match(/^(chapter|ch\.|chương|module|section|\d+[\.\)]|\s{2,})/i))
  ) {
    courseTitle = firstLine.replace(/^#\s*|^(course|tên khóa học):\s*/i, '').trim();
    startIndex = 1;
  }

  const parsedLines: RawLineItem[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const originalLine = lines[i];
    const leadingWhitespaceMatch = originalLine.match(/^(\s*)/);
    const leadingSpaces = leadingWhitespaceMatch ? leadingWhitespaceMatch[1] : '';
    const indentScore = leadingSpaces.replace(/\t/g, '    ').length;

    let content = originalLine.trim();

    let extractedUrl: string | undefined;
    const urlMatch = content.match(/(https?:\/\/[^\s\)\>]+)/i);
    if (urlMatch) {
      extractedUrl = urlMatch[1];
      content = content.replace(extractedUrl, '').trim();
      content = content.replace(/[\(\[\<]\s*[\)\]\>]/g, '').trim();
    }

    let extractedDuration: string | undefined;
    const durationMatch = content.match(/[\(\[]\s*(\d{1,2}:\d{2}(?::\d{2})?|\d+\s*(?:m|min|mins|minutos))\s*[\)\]]/i);
    if (durationMatch) {
      extractedDuration = durationMatch[1];
      content = content.replace(durationMatch[0], '').trim();
    }

    let explicitType: 'chapter' | 'folder' | 'lesson' | undefined;
    if (content.startsWith('## ') || content.match(/^(chapter|chương|module|section)\b/i)) {
      explicitType = 'chapter';
      content = content.replace(/^##\s*/, '').trim();
    } else if (content.startsWith('### ') || content.match(/^(folder|thư mục|resources?|source files?)\b/i)) {
      explicitType = 'folder';
      content = content.replace(/^###\s*/, '').trim();
    } else if (content.startsWith('- ') || content.startsWith('* ') || content.match(/^\d+[\.\)]/)) {
      content = content.replace(/^[-*]\s*/, '').trim();
    }

    parsedLines.push({
      raw: originalLine,
      indent: indentScore,
      text: content,
      url: extractedUrl,
      duration: extractedDuration,
      explicitType,
    });
  }

  if (parsedLines.length === 0) {
    throw new Error('No valid chapters or lessons found in the input text.');
  }

  const rootChildren: ParsedJsonNode[] = [];

  interface StackEntry {
    indent: number;
    node: ParsedJsonNode;
  }

  const stack: StackEntry[] = [];

  for (let i = 0; i < parsedLines.length; i++) {
    const item = parsedLines[i];
    const nextItem = i + 1 < parsedLines.length ? parsedLines[i + 1] : null;
    const hasIndentedChildren = nextItem && nextItem.indent > item.indent;

    let nodeType: 'chapter' | 'folder' | 'lesson' = 'lesson';
    if (item.explicitType) {
      nodeType = item.explicitType;
    } else if (hasIndentedChildren) {
      nodeType = stack.length === 0 ? 'chapter' : 'folder';
    } else if (item.text.toLowerCase().includes('chapter') || item.text.toLowerCase().includes('chương')) {
      nodeType = 'chapter';
    }

    const newNode: ParsedJsonNode = {
      type: nodeType,
      title: item.text || 'Untitled Node',
      ...(item.url ? { url: item.url } : {}),
      ...(item.duration ? { duration: item.duration } : {}),
      ...(nodeType !== 'lesson' ? { children: [] } : {}),
    };

    while (stack.length > 0 && stack[stack.length - 1].indent >= item.indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      rootChildren.push(newNode);
    } else {
      const parent = stack[stack.length - 1].node;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(newNode);
    }

    if (nodeType !== 'lesson' || hasIndentedChildren) {
      stack.push({
        indent: item.indent,
        node: newNode,
      });
    }
  }

  return {
    title: courseTitle,
    children: rootChildren,
  };
}

export function validateAndNormalizeCourseJson(data: any): ParsedCourseJson {
  if (!data || typeof data !== 'object') {
    throw new Error('Root must be an object.');
  }

  if (!data.title || typeof data.title !== 'string') {
    throw new Error('Course "title" is required and must be a string.');
  }

  if (!Array.isArray(data.children)) {
    throw new Error('"children" must be an array of nodes.');
  }

  function validateNode(node: any, path: string): ParsedJsonNode {
    if (!node || typeof node !== 'object') {
      throw new Error(`Node at ${path} is invalid.`);
    }

    const validTypes = ['chapter', 'folder', 'lesson'];
    if (!node.type || !validTypes.includes(node.type)) {
      throw new Error(`Node at ${path} must have type: chapter, folder, or lesson.`);
    }

    if (!node.title || typeof node.title !== 'string') {
      throw new Error(`Node at ${path} must have a valid title.`);
    }

    const cleanNode: ParsedJsonNode = {
      type: node.type,
      title: node.title.trim(),
    };

    if (node.url && typeof node.url === 'string') {
      cleanNode.url = node.url.trim();
    }

    if (node.duration && typeof node.duration === 'string') {
      cleanNode.duration = node.duration.trim();
    }

    if (node.children) {
      if (!Array.isArray(node.children)) {
        throw new Error(`"children" at ${path} must be an array.`);
      }
      cleanNode.children = node.children.map((child: any, idx: number) =>
        validateNode(child, `${path}.children[${idx}]`)
      );
    }

    return cleanNode;
  }

  const children = data.children.map((child: any, idx: number) =>
    validateNode(child, `children[${idx}]`)
  );

  return {
    title: data.title.trim(),
    description: data.description || '',
    category: data.category || 'Engineering',
    instructor: data.instructor || 'Staff Instructor',
    thumbnail: data.thumbnail || '',
    children,
  };
}

