import { Button } from "@/components/ui/button";
import { Share2, Facebook, Linkedin, Twitter, Mail } from "lucide-react";
import { useState } from "react";

interface SocialShareButtonProps {
  title: string;
  description?: string;
  url?: string;
  className?: string;
}

export function SocialShareButton({
  title,
  description,
  url = typeof window !== "undefined" ? window.location.href : "",
  className = "",
}: SocialShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description || title)}%0A%0A${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 ${className}`}
      >
        <Share2 className="h-4 w-4" />
        Partager
      </Button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleShare("facebook")}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Facebook</span>
            </button>
            <button
              onClick={() => handleShare("linkedin")}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
            >
              <Linkedin className="h-4 w-4 text-blue-700" />
              <span className="text-sm">LinkedIn</span>
            </button>
            <button
              onClick={() => handleShare("twitter")}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
            >
              <Twitter className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Twitter/X</span>
            </button>
            <button
              onClick={() => handleShare("whatsapp")}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
            >
              <Share2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">WhatsApp</span>
            </button>
            <button
              onClick={() => handleShare("email")}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
            >
              <Mail className="h-4 w-4 text-gray-600" />
              <span className="text-sm">Email</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
