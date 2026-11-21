'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  SkipForward,
  SkipBack,
  Settings,
  PictureInPicture,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { formatSeconds } from '@/lib/utils';

interface VideoPlayerProps {
  url?: string | null;
  lessonTitle: string;
  initialPosition?: number;
  onPositionUpdate?: (seconds: number) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export function VideoPlayer({
  url,
  lessonTitle,
  initialPosition = 0,
  onPositionUpdate,
  onEnded,
  autoPlay = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Determine video type: youtube, vimeo, google drive file, or direct html5 video
  const cleanUrl = url?.trim() || '';

  const getYouTubeId = (inputUrl: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = inputUrl.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getVimeoId = (inputUrl: string): string | null => {
    const match = inputUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
    return match ? match[1] : null;
  };

  const getGoogleDriveId = (inputUrl: string): string | null => {
    if (!inputUrl || (!inputUrl.includes('drive.google.com') && !inputUrl.includes('docs.google.com'))) {
      return null;
    }
    // Google Drive folder không phải là file video
    if (inputUrl.includes('/drive/folders/')) return null;

    const fileDMatch = inputUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch) return fileDMatch[1];
    const idParamMatch = inputUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch) return idParamMatch[1];
    return null;
  };

  const isDirectVideoFile = (inputUrl: string): boolean => {
    if (!inputUrl) return false;
    const lower = inputUrl.toLowerCase();
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.m3u8'];
    return videoExts.some((ext) => lower.includes(ext));
  };

  const youtubeId = getYouTubeId(cleanUrl);
  const vimeoId = !youtubeId ? getVimeoId(cleanUrl) : null;
  const googleDriveId = !youtubeId && !vimeoId ? getGoogleDriveId(cleanUrl) : null;
  const isDirectVideo = !youtubeId && !vimeoId && !googleDriveId && isDirectVideoFile(cleanUrl);

  // Link tài nguyên ngoài / không phải file video (Google Drive Folder, GitHub, PDF, Zip, Website, Docs...)
  const isExternalResource = !!cleanUrl && !youtubeId && !vimeoId && !googleDriveId && !isDirectVideo;

  // Sync initial playback position when video loads
  useEffect(() => {
    if (isDirectVideo && videoRef.current && initialPosition > 0 && !hasResumed) {
      videoRef.current.currentTime = initialPosition;
      setHasResumed(true);
    }
  }, [initialPosition, isDirectVideo, hasResumed, cleanUrl]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  // Handle controls auto-hide on inactivity
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 2800);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    if (onPositionUpdate && Math.floor(curr) % 3 === 0) {
      onPositionUpdate(curr);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    if (initialPosition > 0 && !hasResumed) {
      videoRef.current.currentTime = initialPosition;
      setHasResumed(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      // ignore
    }
  };

  // Render YouTube Embed
  if (youtubeId) {
    return (
      <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-border shadow-2xl">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoPlay ? 1 : 0}&enablejsapi=1&rel=0&modestbranding=1`}
          title={lessonTitle}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // Render Vimeo Embed
  if (vimeoId) {
    return (
      <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-border shadow-2xl">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${autoPlay ? 1 : 0}&title=0&byline=0&portrait=0`}
          title={lessonTitle}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Render Google Drive Video / Document
  // Trên Laptop/Desktop: nhúng trực tiếp iframe preview trên web
  // Trên Mobile: hiển thị nút mở trực tiếp sang Google Drive (tránh lỗi iframe trên điện thoại)
  if (googleDriveId) {
    const driveOpenUrl =
      cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
        ? cleanUrl
        : `https://drive.google.com/file/d/${googleDriveId}/view`;

    if (isMobile) {
      return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 p-5 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
            <FileText className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block font-semibold">
              Video / Tài liệu Google Drive
            </span>
            <h2 className="text-sm font-bold text-slate-900 leading-snug">
              {lessonTitle}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trên điện thoại, bấm nút bên dưới để mở trực tiếp video/tài liệu trên Google Drive cho mượt và đầy đủ màn hình.
            </p>
          </div>

          <a
            href={driveOpenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <span>Mở trên Google Drive</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>
        </div>
      );
    }

    return (
      <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-[#29292D] shadow-2xl">
        <iframe
          src={`https://drive.google.com/file/d/${googleDriveId}/preview`}
          title={lessonTitle}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  // Khác file video: hiển thị giao diện chuyên dụng có nút click chuyển hướng (Redirect) ngay
  if (isExternalResource) {
    const formattedUrl = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
      ? cleanUrl
      : `https://${cleanUrl}`;

    return (
      <div className="relative min-h-[220px] sm:aspect-video w-full bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-5 sm:p-8 text-center space-y-4 shadow-sm animate-in fade-in duration-150">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
          <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>

        <div className="space-y-2 max-w-lg w-full">
          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block font-semibold">
            Tài liệu / Liên kết ngoài
          </span>
          <h2 className="text-sm sm:text-lg font-bold text-slate-900">
            {lessonTitle}
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto truncate font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 select-all">
            {formattedUrl}
          </p>
        </div>

        <div className="pt-1 w-full sm:w-auto">
          <a
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs cursor-pointer"
          >
            <span>Mở liên kết trên Drive / Trình duyệt</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>
        </div>
      </div>
    );
  }

  // Direct HTML5 Video Player with Custom Minimal Dark Controls
  if (isDirectVideo) {
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-border shadow-2xl group select-none flex items-center justify-center"
      >
        <video
          ref={videoRef}
          src={cleanUrl}
          playsInline
          autoPlay={autoPlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            if (onEnded) onEnded();
          }}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Big Center Play Icon overlay when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute z-20 w-16 h-16 rounded-full bg-black/60 hover:bg-accent hover:text-black text-white border border-white/20 flex items-center justify-center transition-all duration-btn shadow-2xl group/play hover:scale-105"
          >
            <Play className="w-7 h-7 fill-current ml-1 transition-transform group-hover/play:scale-110" />
          </button>
        )}

        {/* Custom Minimal Dark Overlay Controls */}
        <div
          className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pt-10 pb-3 transition-opacity duration-200 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Seek progress bar */}
          <div className="relative mb-2.5 flex items-center group/seek">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent hover:h-2 transition-all focus:outline-none"
              style={{
                background: `linear-gradient(to right, #A78BFA ${progressPercent}%, #27272A ${progressPercent}%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-foreground">
            {/* Left controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(0, currentTime - 10);
                  }
                }}
                className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-foreground-secondary hover:text-foreground transition-colors"
                title="Rewind 10s"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-status-error" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>

              {/* Time display */}
              <span className="text-xs font-mono text-foreground-secondary tracking-wider ml-1">
                {formatSeconds(currentTime)}{' '}
                <span className="text-foreground-muted">/</span>{' '}
                {formatSeconds(duration)}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Playback speed selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-2 py-1 rounded text-xs font-mono hover:bg-white/10 text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {playbackRate}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute right-0 bottom-full mb-2 bg-background-card border border-border rounded-modal p-1 shadow-card flex flex-col min-w-[70px] z-50">
                    {[0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`px-3 py-1 text-xs font-mono text-left rounded hover:bg-background-hover transition-colors ${
                          playbackRate === rate ? 'text-accent font-semibold' : 'text-foreground-secondary'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              {typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && (
                <button
                  onClick={togglePiP}
                  className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-foreground-secondary hover:text-foreground transition-colors"
                  title="Picture in Picture"
                >
                  <PictureInPicture className="w-4 h-4" />
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-foreground-secondary hover:text-foreground transition-colors"
                title="Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback when no URL or invalid URL provided
  return (
    <div className="relative aspect-video w-full bg-[#0D0D0F] rounded-lg border border-border flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-border flex items-center justify-center text-foreground-muted mb-3">
        <AlertCircle className="w-6 h-6 text-status-warning" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Video Stream Unavailable
      </h3>
      <p className="text-xs text-foreground-muted max-w-md">
        No valid video stream URL was specified for lesson "{lessonTitle}". You can update the URL in the Course Studio.
      </p>
    </div>
  );
}
