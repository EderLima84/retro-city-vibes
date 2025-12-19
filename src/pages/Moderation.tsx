import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Plus, FileWarning } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { CityNavigation } from "@/components/CityNavigation";

type Report = {
  id: string;
  reporter_id: string;
  reported_item_id: string;
  report_type: "post" | "comment" | "user" | "video";
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  moderator_notes: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter: {
    username: string;
  };
};

const Moderation = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    reportType: "post" as "post" | "comment" | "user" | "video",
    itemId: "",
    reason: "",
  });

  // Check if user is moderator or admin
  const { data: userRole } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      return data?.role;
    },
    enabled: !!user,
  });

  // Fetch reports based on user role
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["reports", user?.id, userRole],
    queryFn: async () => {
      if (!user) return [];

      const isModerator = userRole === "admin" || userRole === "moderator";
      
      // Moderators see all reports, regular users see only their own
      const query = supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isModerator) {
        query.eq("reporter_id", user.id);
      }

      const { data: reportsData, error } = await query;

      if (error) throw error;

      // Fetch reporter profiles separately
      const reporterIds = [...new Set(reportsData?.map(r => r.reporter_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", reporterIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return reportsData?.map(report => ({
        ...report,
        reporter: {
          username: profilesMap.get(report.reporter_id)?.username || "Usuário Desconhecido",
        },
      })) as Report[];
    },
    enabled: !!user,
  });

  const createReportMutation = useMutation({
    mutationFn: async (reportData: { reportType: string; itemId: string; reason: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_item_id: reportData.itemId,
        report_type: reportData.reportType as "post" | "comment" | "user" | "video",
        reason: reportData.reason,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Denúncia enviada com sucesso");
      setCreateDialogOpen(false);
      setNewReport({ reportType: "post", itemId: "", reason: "" });
    },
    onError: () => {
      toast.error("Erro ao enviar denúncia");
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: string; status: "resolved" | "dismissed"; notes: string }) => {
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          moderator_notes: notes,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report atualizado com sucesso");
      setSelectedReport(null);
      setModeratorNotes("");
    },
    onError: () => {
      toast.error("Erro ao atualizar report");
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async ({ itemId, type }: { itemId: string; type: string }) => {
      let error;
      
      if (type === "post") {
        const result = await supabase.from("posts").delete().eq("id", itemId);
        error = result.error;
      } else if (type === "comment") {
        const result = await supabase.from("comments").delete().eq("id", itemId);
        error = result.error;
      } else if (type === "video") {
        const result = await supabase.from("videos").delete().eq("id", itemId);
        error = result.error;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conteúdo removido com sucesso");
    },
    onError: () => {
      toast.error("Erro ao remover conteúdo");
    },
  });

  if (loading || reportsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isModerator = userRole === "admin" || userRole === "moderator";

  const pendingReports = reports.filter(r => r.status === "pending");
  const resolvedReports = reports.filter(r => r.status === "resolved");
  const dismissedReports = reports.filter(r => r.status === "dismissed");

  const getReportTypeLabel = (type: string) => {
    const labels = {
      post: "Post",
      comment: "Comentário",
      user: "Usuário",
      video: "Vídeo",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    if (status === "pending") return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">Pendente</Badge>;
    if (status === "resolved") return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300">Resolvido</Badge>;
    return <Badge variant="outline" className="bg-gray-500/10">Descartado</Badge>;
  };

  const handleResolve = (status: "resolved" | "dismissed") => {
    if (!selectedReport) return;
    updateReportMutation.mutate({
      reportId: selectedReport.id,
      status,
      notes: moderatorNotes,
    });
  };

  const handleDeleteContent = (itemId: string, type: string) => {
    if (confirm("Tem certeza que deseja remover este conteúdo?")) {
      deleteContentMutation.mutate({ itemId, type });
    }
  };

  const ReportTable = ({ reportsList }: { reportsList: Report[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Motivo</TableHead>
          {isModerator && <TableHead>Reportado por</TableHead>}
          <TableHead>Data</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reportsList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Nenhum report encontrado
            </TableCell>
          </TableRow>
        ) : (
          reportsList.map((report) => (
            <TableRow key={report.id}>
              <TableCell>{getReportTypeLabel(report.report_type)}</TableCell>
              <TableCell className="max-w-md truncate">{report.reason}</TableCell>
              {isModerator && <TableCell>{report.reporter.username}</TableCell>}
              <TableCell>{format(new Date(report.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
              <TableCell>{getStatusBadge(report.status)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report);
                          setModeratorNotes(report.moderator_notes || "");
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Report</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Tipo:</p>
                          <p className="text-sm text-muted-foreground">{getReportTypeLabel(report.report_type)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Motivo:</p>
                          <p className="text-sm text-muted-foreground">{report.reason}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">ID do Item Reportado:</p>
                          <p className="text-sm text-muted-foreground font-mono">{report.reported_item_id}</p>
                        </div>
                        {isModerator && (
                          <>
                            <div>
                              <p className="text-sm font-medium mb-2">Notas do Moderador:</p>
                              <Textarea
                                value={moderatorNotes}
                                onChange={(e) => setModeratorNotes(e.target.value)}
                                placeholder="Adicione notas sobre sua decisão..."
                                className="min-h-[100px]"
                              />
                            </div>
                            {report.status === "pending" && (
                              <div className="flex gap-2 pt-4">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteContent(report.reported_item_id, report.report_type)}
                                >
                                  Remover Conteúdo
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleResolve("resolved")}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Resolver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResolve("dismissed")}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Descartar
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                        {report.moderator_notes && (
                          <div>
                            <p className="text-sm font-medium">Resposta do Moderador:</p>
                            <p className="text-sm text-muted-foreground">{report.moderator_notes}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen">
      <CityNavigation />
      
      <div className="container mx-auto px-4 pb-8 max-w-7xl">
        <Card className="p-8 shadow-elevated bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
        🚔 Delegacia de Orkadia
                </h1>
                <p className="text-muted-foreground text-lg mt-1">
                  {isModerator ? "Mantendo a paz e a ordem na cidade digital" : "Suas denúncias e acompanhamentos"}
                </p>
              </div>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Denúncia
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Denúncia</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="report-type">Tipo</Label>
                    <Select
                      value={newReport.reportType}
                      onValueChange={(value: any) =>
                        setNewReport({ ...newReport, reportType: value })
                      }
                    >
                      <SelectTrigger id="report-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post">Post</SelectItem>
                        <SelectItem value="comment">Comentário</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="item-id">ID do Item</Label>
                    <Input
                      id="item-id"
                      placeholder="Cole o ID do item que deseja denunciar"
                      value={newReport.itemId}
                      onChange={(e) =>
                        setNewReport({ ...newReport, itemId: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Motivo da Denúncia</Label>
                    <Textarea
                      id="reason"
                      placeholder="Descreva o motivo da denúncia..."
                      value={newReport.reason}
                      onChange={(e) =>
                        setNewReport({ ...newReport, reason: e.target.value })
                      }
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createReportMutation.mutate(newReport)}
                    disabled={!newReport.itemId || !newReport.reason}
                  >
                    Enviar Denúncia
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Info Card */}
          <Card className="p-6 mb-8 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-4">
              <FileWarning className="w-8 h-8 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2 text-orange-900 dark:text-orange-100">
                  🤝 Conselho da Cidade
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isModerator 
        ? "Como guardião da paz em Orkadia, você tem a responsabilidade de analisar denúncias, proteger a comunidade e manter o respeito entre todos os cidadãos. Cada decisão deve ser justa e transparente."
        : "A Delegacia de Orkadia está aqui para garantir que nossa cidade digital seja um lugar seguro e respeitoso para todos. Se você presenciar conteúdo inadequado, faça uma denúncia e nossa equipe analisará com atenção."
                  }
                </p>
              </div>
            </div>
          </Card>

          {isModerator && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-300 dark:border-yellow-700">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-700 dark:text-yellow-300" />
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                </div>
                <p className="text-4xl font-bold text-yellow-700 dark:text-yellow-300">{pendingReports.length}</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-300 dark:border-green-700">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-700 dark:text-green-300" />
                  <p className="text-sm font-medium text-muted-foreground">Resolvidos</p>
                </div>
                <p className="text-4xl font-bold text-green-700 dark:text-green-300">{resolvedReports.length}</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-gray-500/20 to-gray-600/20 border-gray-300 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-6 h-6 text-gray-700 dark:text-gray-400" />
                  <p className="text-sm font-medium text-muted-foreground">Descartados</p>
                </div>
                <p className="text-4xl font-bold text-gray-700 dark:text-gray-400">{dismissedReports.length}</p>
              </Card>
            </div>
          )}

          <Tabs defaultValue="pending" className="w-full">
            {isModerator ? (
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pendentes ({pendingReports.length})</TabsTrigger>
                <TabsTrigger value="resolved">Resolvidos ({resolvedReports.length})</TabsTrigger>
                <TabsTrigger value="dismissed">Descartados ({dismissedReports.length})</TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Minhas Denúncias Pendentes ({pendingReports.length})</TabsTrigger>
                <TabsTrigger value="resolved">Resolvidas ({resolvedReports.length})</TabsTrigger>
                <TabsTrigger value="dismissed">Descartadas ({dismissedReports.length})</TabsTrigger>
              </TabsList>
            )}
            <TabsContent value="pending" className="mt-6">
              <ReportTable reportsList={pendingReports} />
            </TabsContent>
            <TabsContent value="resolved" className="mt-6">
              <ReportTable reportsList={resolvedReports} />
            </TabsContent>
            <TabsContent value="dismissed" className="mt-6">
              <ReportTable reportsList={dismissedReports} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Moderation;
