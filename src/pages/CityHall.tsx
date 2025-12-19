import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Vote, Megaphone, Trophy, Users, CheckCircle, Scroll, Calendar } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { CityNavigation } from "@/components/CityNavigation";

type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

type Election = {
  id: string;
  title: string;
  description: string;
  position: string;
  start_date: string;
  end_date: string;
  status: string;
};

type Candidate = {
  id: string;
  election_id: string;
  user_id: string;
  proposal: string;
  votes_count: number;
  profile: {
    username: string;
    avatar_url: string | null;
  };
};

type Poll = {
  id: string;
  title: string;
  description: string;
  end_date: string;
  status: string;
  options: {
    id: string;
    option_text: string;
    votes_count: number;
  }[];
};

const CityHall = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [candidateProposal, setCandidateProposal] = useState("");
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);

  // Check if user is admin
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

  // Fetch announcements
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Fetch elections
  const { data: elections = [] } = useQuery({
    queryKey: ["elections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Election[];
    },
  });

  // Fetch candidates for selected election
  const { data: candidates = [] } = useQuery({
    queryKey: ["candidates", selectedElection?.id],
    queryFn: async () => {
      if (!selectedElection) return [];

      const { data: candidatesData, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("election_id", selectedElection.id)
        .order("votes_count", { ascending: false });

      if (error) throw error;

      // Fetch profiles
      const userIds = candidatesData.map(c => c.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return candidatesData.map(candidate => ({
        ...candidate,
        profile: profilesMap.get(candidate.user_id) || { username: "Usuário", avatar_url: null },
      })) as Candidate[];
    },
    enabled: !!selectedElection,
  });

  // Fetch polls
  const { data: polls = [] } = useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      const { data: pollsData, error } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch options for each poll
      const pollsWithOptions = await Promise.all(
        pollsData.map(async (poll) => {
          const { data: options } = await supabase
            .from("poll_options")
            .select("*")
            .eq("poll_id", poll.id)
            .order("created_at");

          return {
            ...poll,
            options: options || [],
          };
        })
      );

      return pollsWithOptions as Poll[];
    },
  });

  // Check if user already voted
  const { data: userVotes = [] } = useQuery({
    queryKey: ["userVotes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data } = await supabase
        .from("election_votes")
        .select("election_id")
        .eq("voter_id", user.id);

      return data?.map(v => v.election_id) || [];
    },
    enabled: !!user,
  });

  const { data: userPollVotes = [] } = useQuery({
    queryKey: ["userPollVotes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data } = await supabase
        .from("poll_votes")
        .select("poll_id")
        .eq("voter_id", user.id);

      return data?.map(v => v.poll_id) || [];
    },
    enabled: !!user,
  });

  const registerCandidateMutation = useMutation({
    mutationFn: async ({ electionId, proposal }: { electionId: string; proposal: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase.from("candidates").insert({
        election_id: electionId,
        user_id: user.id,
        proposal,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidatura registrada com sucesso!");
      setRegisterDialogOpen(false);
      setCandidateProposal("");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Você já se candidatou para esta eleição");
      } else {
        toast.error("Erro ao registrar candidatura");
      }
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ electionId, candidateId }: { electionId: string; candidateId: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase.from("election_votes").insert({
        election_id: electionId,
        candidate_id: candidateId,
        voter_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["userVotes"] });
      toast.success("Voto computado com sucesso!");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Você já votou nesta eleição");
      } else {
        toast.error("Erro ao votar");
      }
    },
  });

  const pollVoteMutation = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase.from("poll_votes").insert({
        poll_id: pollId,
        option_id: optionId,
        voter_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      queryClient.invalidateQueries({ queryKey: ["userPollVotes"] });
      toast.success("Voto registrado!");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Você já votou nesta enquete");
      } else {
        toast.error("Erro ao votar");
      }
    },
  });

  if (loading) {
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

  const isAdmin = userRole === "admin";
  const activeElections = elections.filter(e => e.status === "active");
  const activePolls = polls.filter(p => p.status === "active");

  const getStatusBadge = (status: string) => {
    if (status === "active") return <Badge className="bg-green-500/10 text-green-700 dark:text-green-300">Ativa</Badge>;
    if (status === "upcoming") return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">Em Breve</Badge>;
    return <Badge variant="outline" className="bg-gray-500/10">Encerrada</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <CityNavigation />

      <div className="container mx-auto px-4 pb-8 max-w-7xl">
        <Card className="p-8 shadow-elevated bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          🏛️ Prefeitura de Orkadia
                </h1>
                <p className="text-muted-foreground text-lg mt-1">
                  Onde o povo fala — e a voz do povo tem protocolo
                </p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <Card className="p-6 mb-8 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <Scroll className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2 text-blue-900 dark:text-blue-100">
                  🗳️ Democracia Digital
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Na Orkadia, cada voz conta. Aqui você pode acompanhar comunicados oficiais, 
                  participar de eleições para cargos representativos e votar em decisões importantes 
                  da comunidade. Transparência e participação são os pilares da nossa cidade digital.
                </p>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="announcements" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="announcements" className="gap-2 py-3">
                <Megaphone className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Avisos</div>
                  <div className="text-xs text-muted-foreground">Comunicados oficiais</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="elections" className="gap-2 py-3">
                <Trophy className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Eleições ({activeElections.length})</div>
                  <div className="text-xs text-muted-foreground">Eleja representantes</div>
                </div>
              </TabsTrigger>
              <TabsTrigger value="polls" className="gap-2 py-3">
                <Vote className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Votações ({activePolls.length})</div>
                  <div className="text-xs text-muted-foreground">Decisões rápidas</div>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="announcements" className="mt-8 space-y-6">
              {announcements.length === 0 ? (
                <Card className="p-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">📢 Mural Tranquilo</h3>
                  <p className="text-muted-foreground">
                    Nenhum comunicado oficial no momento. Quando houver novidades importantes, 
                    elas aparecerão aqui no mural da Prefeitura.
                  </p>
                </Card>
              ) : (
                announcements.map((announcement) => (
                  <Card key={announcement.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Megaphone className="w-7 h-7 text-white" />
                      </div>
                       <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
                            Comunicado Oficial
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(announcement.created_at), "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                        <h3 className="font-bold text-xl mb-3 text-blue-900 dark:text-blue-100">
                          {announcement.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="elections" className="mt-6 space-y-4">
              {elections.length === 0 ? (
                <Card className="p-8 text-center">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma eleição no momento</p>
                </Card>
              ) : (
                elections.map((election) => {
                  const hasVoted = userVotes.includes(election.id);
                  const isActive = election.status === "active";

                  return (
                    <Card key={election.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold">{election.title}</h3>
                            {getStatusBadge(election.status)}
                          </div>
                          <Badge variant="outline" className="mb-2">
                            {election.position === "prefeito" ? "Prefeito" : "Vereador"}
                          </Badge>
                          <p className="text-muted-foreground mb-2">{election.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Período: {format(new Date(election.start_date), "dd/MM/yyyy")} até{" "}
                            {format(new Date(election.end_date), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedElection(election);
                                setRegisterDialogOpen(true);
                              }}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Candidatar-se
                            </Button>
                            <Button
                              onClick={() => setSelectedElection(election)}
                            >
                              Ver Candidatos e Votar
                            </Button>
                          </div>

                          {hasVoted && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Você já votou nesta eleição</span>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedElection?.id === election.id && (
                        <div className="mt-6 space-y-4">
                          <h4 className="text-lg font-bold">Candidatos</h4>
                          {candidates.length === 0 ? (
                            <p className="text-muted-foreground">Nenhum candidato registrado ainda</p>
                          ) : (
                            <div className="space-y-3">
                              {candidates.map((candidate) => {
                                const totalVotes = candidates.reduce((sum, c) => sum + c.votes_count, 0);
                                const percentage = totalVotes > 0 ? (candidate.votes_count / totalVotes) * 100 : 0;

                                return (
                                  <Card key={candidate.id} className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h5 className="font-bold">{candidate.profile.username}</h5>
                                        <p className="text-sm text-muted-foreground mt-1">{candidate.proposal}</p>
                                      </div>
                                      {isActive && !hasVoted && (
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            voteMutation.mutate({
                                              electionId: election.id,
                                              candidateId: candidate.id,
                                            })
                                          }
                                        >
                                          Votar
                                        </Button>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Votos</span>
                                        <span className="font-medium">
                                          {candidate.votes_count} ({percentage.toFixed(1)}%)
                                        </span>
                                      </div>
                                      <Progress value={percentage} className="h-2" />
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="polls" className="mt-6 space-y-4">
              {polls.length === 0 ? (
                <Card className="p-8 text-center">
                  <Vote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma votação no momento</p>
                </Card>
              ) : (
                polls.map((poll) => {
                  const hasVoted = userPollVotes.includes(poll.id);
                  const isActive = poll.status === "active";
                  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes_count, 0);

                  return (
                    <Card key={poll.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{poll.title}</h3>
                          <p className="text-muted-foreground mb-2">{poll.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Encerra em: {format(new Date(poll.end_date), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                        {getStatusBadge(poll.status)}
                      </div>

                      {hasVoted && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Você já votou nesta enquete</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        {poll.options.map((option) => {
                          const percentage = totalVotes > 0 ? (option.votes_count / totalVotes) * 100 : 0;

                          return (
                            <Card key={option.id} className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{option.option_text}</span>
                                {isActive && !hasVoted && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      pollVoteMutation.mutate({
                                        pollId: poll.id,
                                        optionId: option.id,
                                      })
                                    }
                                  >
                                    Votar
                                  </Button>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Votos</span>
                                  <span className="font-medium">
                                    {option.votes_count} ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Candidatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
              Apresente suas propostas para a comunidade Orkadia
              </p>
              <Textarea
                placeholder="Descreva suas propostas e por que você seria um bom representante..."
                value={candidateProposal}
                onChange={(e) => setCandidateProposal(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (selectedElection) {
                  registerCandidateMutation.mutate({
                    electionId: selectedElection.id,
                    proposal: candidateProposal,
                  });
                }
              }}
              disabled={!candidateProposal.trim()}
            >
              Confirmar Candidatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CityHall;
