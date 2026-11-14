'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Play, BookOpen, Layers, ArrowRight, ExternalLink } from 'lucide-react';
import { CourseWithStats } from '@/lib/types';
import { CourseCard } from '@/components/course/CourseCard';
import { Button } from '@/components/ui/Button';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCourses([]);
      setLessons([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        setLessons(data.lessons || []);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      <div className="pb-2 border-b border-border">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Search className="w-5 h-5 text-accent" />
          Global Knowledge Search
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Query across all courses, curriculum chapters, nested folders, and video lessons.
        </p>
      </div>

      {/* Big Search Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords: 'Next.js', 'PostgreSQL', 'Consensus', 'Architecture'..."
            className="w-full h-10 bg-background-card border border-border rounded-input pl-10 pr-4 text-xs text-foreground placeholder:text-foreground-muted focus:border-accent outline-none"
          />
        </div>
        <Button type="submit" variant="primary" size="md">
          Search
        </Button>
      </form>

      {loading ? (
        <div className="py-20 text-center text-xs text-foreground-muted">
          Searching knowledge database...
        </div>
      ) : hasSearched && courses.length === 0 && lessons.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-background-card border border-dashed border-border rounded-card">
          <p className="text-sm font-medium text-foreground">No matching content found</p>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            We couldn't find any courses or lessons matching "{query}". Try checking for spelling or searching for another topic.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {courses.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-wider text-foreground-muted">
                  Matched Courses ({courses.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((course: any) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}

          {lessons.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-foreground-muted">
                Matched Video Lessons ({lessons.length})
              </h2>
              <div className="bg-background-card border border-border rounded-card divide-y divide-border/60">
                {lessons.map((lesson: any) => (
                  <div
                    key={lesson.id}
                    className="p-3.5 flex items-center justify-between gap-4 hover:bg-background-hover/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-zinc-900 border border-border flex items-center justify-center shrink-0 text-foreground-muted group-hover:text-accent group-hover:border-accent transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/watch/${lesson.course.id}/${lesson.id}`}
                          className="font-medium text-xs text-foreground group-hover:text-accent transition-colors truncate block"
                        >
                          {lesson.title}
                        </Link>
                        <p className="text-[11px] text-foreground-muted truncate">
                          Course: {lesson.course.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {lesson.duration && (
                        <span className="text-[11px] font-mono text-foreground-muted">
                          {lesson.duration}
                        </span>
                      )}
                      <Link href={`/watch/${lesson.course.id}/${lesson.id}`}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs">
                          Watch Lesson
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-foreground-muted">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
