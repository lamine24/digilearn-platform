import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  className?: string;
}

export function ShareButtons({ 
  title, 
  description = "", 
  url = typeof window !== "undefined" ? window.location.href : "", 
  className = "" 
}: ShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    const link = shareLinks[platform];
    
    if (platform === "email") {
      window.location.href = link;
    } else {
      window.open(link, "_blank", "width=600,height=400");
    }
    
    toast.success(`Partage sur ${platform} en cours...`);
    setIsOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papiers !");
    setIsOpen(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleShare("facebook")}
          title="Partager sur Facebook"
          className="h-9 w-9 p-0 hover:bg-blue-100"
        >
          <Facebook className="h-4 w-4 text-blue-600" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleShare("twitter")}
          title="Partager sur Twitter"
          className="h-9 w-9 p-0 hover:bg-sky-100"
        >
          <Twitter className="h-4 w-4 text-sky-500" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleShare("linkedin")}
          title="Partager sur LinkedIn"
          className="h-9 w-9 p-0 hover:bg-blue-100"
        >
          <Linkedin className="h-4 w-4 text-blue-700" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleShare("whatsapp")}
          title="Partager sur WhatsApp"
          className="h-9 w-9 p-0 hover:bg-green-100"
        >
          <MessageCircle className="h-4 w-4 text-green-600" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleShare("email")}
          title="Partager par email"
          className="h-9 w-9 p-0 hover:bg-gray-100"
        >
          <Mail className="h-4 w-4 text-gray-600" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyLink}
          title="Copier le lien"
          className="h-9 w-9 p-0 hover:bg-gray-100"
        >
          <Share2 className="h-4 w-4 text-gray-600" />
        </Button>
      </div>
    </div>
  );
}
