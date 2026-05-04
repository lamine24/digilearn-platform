// Shared platform configuration for free resources and external courses
export const platformConfig: Record<string, { label: string; color: string; icon: string }> = {
  // Free Resources Platforms
  khan_academy: { label: "Khan Academy", color: "bg-blue-100 text-blue-800", icon: "📚" },
  mit_ocw: { label: "MIT OCW", color: "bg-red-100 text-red-800", icon: "🎓" },
  statlearning: { label: "StatLearning", color: "bg-purple-100 text-purple-800", icon: "📊" },
  open_learning_campus: { label: "Open Learning Campus", color: "bg-green-100 text-green-800", icon: "🌍" },
  canal_u: { label: "Canal-U", color: "bg-indigo-100 text-indigo-800", icon: "🎬" },
  openlearn: { label: "OpenLearn", color: "bg-teal-100 text-teal-800", icon: "🎓" },
  saylor_academy: { label: "Saylor Academy", color: "bg-orange-100 text-orange-800", icon: "🏫" },
  auf: { label: "AUF", color: "bg-pink-100 text-pink-800", icon: "🌐" },
  unesco_oer: { label: "UNESCO OER", color: "bg-yellow-100 text-yellow-800", icon: "📚" },
  bookdown: { label: "Bookdown", color: "bg-cyan-100 text-cyan-800", icon: "📖" },
  fun_mooc: { label: "FUN-MOOC", color: "bg-violet-100 text-violet-800", icon: "🎯" },
  
  // External Courses Platforms
  udemy: { label: "Udemy", color: "bg-purple-100 text-purple-800", icon: "🎓" },
  coursera: { label: "Coursera", color: "bg-blue-100 text-blue-800", icon: "🎓" },
  youtube: { label: "YouTube", color: "bg-red-100 text-red-800", icon: "📺" },
  
  // Fallback
  other: { label: "Autre", color: "bg-gray-100 text-gray-800", icon: "📖" },
};

export function getPlatformConfig(platform: string | null | undefined) {
  if (!platform) return platformConfig.other;
  return platformConfig[platform] ?? platformConfig.other;
}

export const levelConfig: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export function getLevelLabel(level: string | null | undefined) {
  if (!level) return "Débutant";
  return levelConfig[level] ?? "Débutant";
}
