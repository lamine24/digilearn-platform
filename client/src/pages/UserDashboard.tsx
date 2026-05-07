import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Trophy, Award, Zap, BookOpen, Download, Share2, Loader2 } from "lucide-react";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch data
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery();
  const { data: points, isLoading: pointsLoading } = trpc.gamification.getUserPoints.useQuery();
  const { data: badges, isLoading: badgesLoading } = trpc.gamification.getUserBadges.useQuery();
  const { data: badgeDefinitions } = trpc.gamification.getBadgeDefinitions.useQuery();
  const { data: topUsers } = trpc.gamification.getTopUsers.useQuery({ limit: 10 });

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Veuillez vous connecter</h2>
          <Button>Se connecter</Button>
        </div>
      </div>
    );
  }

  const isLoading = statsLoading || pointsLoading || badgesLoading;

  // Prepare data for charts
  const progressData = [
    { name: "Cours", value: stats?.totalCoursesCompleted || 0, fill: "#3b82f6" },
    { name: "Certificats", value: stats?.totalCertificatesEarned || 0, fill: "#10b981" },
    { name: "Badges", value: stats?.totalBadgesUnlocked || 0, fill: "#f59e0b" },
  ];

  const levelColors: Record<string, string> = {
    bronze: "#CD7F32",
    silver: "#C0C0C0",
    gold: "#FFD700",
    platinum: "#E5E4E2",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Tableau de Bord</h1>
              <p className="text-gray-600">Bienvenue, {user?.name || "Apprenant"}!</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">{points?.totalPoints || 0}</div>
              <p className="text-sm text-gray-600">Points totaux</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Cours Complétés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.totalCoursesCompleted || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Certificats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.totalCertificatesEarned || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats?.totalBadgesUnlocked || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Niveau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize" style={{ color: levelColors[points?.currentLevel || "bronze"] }}>
                {points?.currentLevel || "Bronze"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="leaderboard">Classement</TabsTrigger>
            <TabsTrigger value="progress">Progression</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Points Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Points ce mois
                  </CardTitle>
                  <CardDescription>Votre progression mensuelle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{points?.pointsThisMonth || 0} points</span>
                        <span className="text-sm text-gray-500">Objectif: 500</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(((points?.pointsThisMonth || 0) / 500) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {500 - (points?.pointsThisMonth || 0)} points restants pour atteindre l'objectif
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    Activité Récente
                  </CardTitle>
                  <CardDescription>Dernière activité</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Dernière activité: {stats?.lastActivityAt ? new Date(stats.lastActivityAt).toLocaleDateString("fr-FR") : "Aucune"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Série actuelle: {stats?.currentStreak || 0} jours
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Vue d'ensemble de la progression</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={progressData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {progressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Mes Badges ({badges?.length || 0}/{badgeDefinitions?.length || 0})
                </CardTitle>
                <CardDescription>Badges débloqués et à débloquer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {badgeDefinitions?.map((badge: any) => {
                    const isUnlocked = badges?.some((b: any) => b.badge_id === badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`p-4 rounded-lg border-2 text-center transition-all ${
                          isUnlocked ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-gray-50 opacity-50"
                        }`}
                      >
                        <div className="text-3xl mb-2">{badge.icon_url ? "🏆" : "⭐"}</div>
                        <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                        <Badge variant={isUnlocked ? "default" : "outline"} className="text-xs capitalize">
                          {badge.rarity}
                        </Badge>
                        {isUnlocked && (
                          <p className="text-xs text-green-600 mt-2 font-semibold">✓ Débloqué</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top 10 Apprenants
                </CardTitle>
                <CardDescription>Classement par points totaux</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topUsers?.map((user: any, index: number) => (
                    <div key={user.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{user.name || "Utilisateur"}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-blue-600">{user.total_points}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progression Mensuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: "Cours", value: stats?.totalCoursesCompleted || 0 },
                    { name: "Certificats", value: stats?.totalCertificatesEarned || 0 },
                    { name: "Badges", value: stats?.totalBadgesUnlocked || 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
