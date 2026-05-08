import { useState } from "react";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  url?: string | null;
  title?: string;
  className?: string;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  
  return null;
}

export function VideoPlayer({ url, title = "Aperçu vidéo", className = "" }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  if (!url) return null;
  
  const youtubeId = extractYouTubeId(url);
  
  if (!youtubeId) {
    // Fallback for non-YouTube URLs (MP4, WebM, etc.)
    return (
      <div className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}>
        <video
          controls
          className="w-full h-auto"
          onLoadedMetadata={() => setIsLoading(false)}
        >
          <source src={url} type="video/mp4" />
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      </div>
    );
  }
  
  // YouTube embed
  return (
    <div className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`} style={{ paddingBottom: "56.25%" }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="flex flex-col items-center gap-2">
            <Play className="h-12 w-12 text-white animate-pulse" />
            <span className="text-sm text-white">Chargement...</span>
          </div>
        </div>
      )}
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
