import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Clock, Eye, AlertCircle } from "lucide-react";

interface Capsule {
  id: number;
  title: string;
  description: string;
  videoUrl: string | null;
  videoStatus: string;
  duration: number | null;
  generatedBy: string;
  createdAt: string;
}

export function CapsuleGallery() {
  const [, setLocation] = useLocation();

  // Fetch all capsules using tRPC hook
  const { data: capsulesData, isLoading, error: queryError } = trpc.studio.getAllCapsules.useQuery();
  const capsules = capsulesData || [];
  const loading = isLoading;
  const error = queryError?.message || null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "processing":
        return "En cours";
      case "completed":
        return "Complétée";
      case "failed":
        return "Erreur";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement des capsules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Galerie de Capsules Vidéo</h1>
          <p className="text-slate-600 mt-2">Découvrez toutes les capsules vidéo créées</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {capsules.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">Aucune capsule disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capsules.map((capsule) => (
              <Card
                key={capsule.id}
                className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer group"
                onClick={() => setLocation(`/studio/capsule/${capsule.id}`)}
              >
                {/* Thumbnail */}
                <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                  {capsule.videoUrl && capsule.videoStatus === "completed" ? (
                    <>
                      <video
                        src={capsule.videoUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-white text-center">
                      <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{getStatusLabel(capsule.videoStatus)}</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{capsule.title}</CardTitle>
                      {capsule.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {capsule.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <Badge className={`text-xs ${getStatusColor(capsule.videoStatus)}`}>
                        {getStatusLabel(capsule.videoStatus)}
                      </Badge>
                      {capsule.generatedBy && (
                        <span className="text-xs text-slate-600">Par: {capsule.generatedBy}</span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      {capsule.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{capsule.duration}s</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>0 vues</span>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                      {new Date(capsule.createdAt).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>

                    {/* Action Button */}
                    {capsule.videoStatus === "completed" && capsule.videoUrl && (
                      <Button 
                        className="w-full mt-2" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/studio/capsule/${capsule.id}`);
                        }}
                      >
                        Regarder
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
