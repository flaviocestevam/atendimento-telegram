import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProfile } from "@/lib/active-profile";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, UserCircle, Check, Archive, ArchiveRestore, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/perfis")({
  component: PerfisPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">Erro: {String(error)}</div>,
  notFoundComponent: () => <div className="p-6">Não encontrado</div>,
});

type Row = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  short_bio: string | null;
  status: string;
  is_active: boolean;
  currency: string;
  timezone: string;
  created_at: string;
};

function PerfisPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { profileId, setProfileId } = useActiveProfile();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    username: "",
    avatar_url: "",
    short_bio: "",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
  });

  const list = useQuery({
    queryKey: ["seller_profiles_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_profiles")
        .select("id, display_name, username, avatar_url, short_bio, status, is_active, currency, timezone, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.display_name.trim()) throw new Error("Nome obrigatório");
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("seller_profiles")
        .insert({
          display_name: form.display_name.trim(),
          username: form.username.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
          short_bio: form.short_bio.trim() || null,
          currency: form.currency || "BRL",
          timezone: form.timezone || "America/Sao_Paulo",
          owner_user_id: user.user?.id ?? null,
          status: "active",
          is_active: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Perfil criado");
      setOpen(false);
      setForm({ display_name: "", username: "", avatar_url: "", short_bio: "", currency: "BRL", timezone: "America/Sao_Paulo" });
      qc.invalidateQueries({ queryKey: ["seller_profiles_admin"] });
      qc.invalidateQueries({ queryKey: ["seller_profiles_list"] });
      setProfileId(id);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar"),
  });

  const toggleArchive = useMutation({
    mutationFn: async (row: Row) => {
      const next = row.status === "archived" ? "active" : "archived";
      const { error } = await supabase
        .from("seller_profiles")
        .update({ status: next, is_active: next === "active" })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atualizado");
      qc.invalidateQueries({ queryKey: ["seller_profiles_admin"] });
      qc.invalidateQueries({ queryKey: ["seller_profiles_list"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  return (
    <div className="p-6 max-w-6xl">
      <PageHeader
        title="Perfis / Influenciadoras"
        subtitle="Cada perfil tem seu próprio bot, Cakto, IA, planos, leads e configurações."
        actions={
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/perfis/novo"><Plus className="h-4 w-4 mr-2" />Nova influenciadora (wizard)</Link>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Criar rápido</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar novo perfil</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Nome de exibição *</Label>
                    <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Ex: Lara" />
                  </div>
                  <div>
                    <Label>Username</Label>
                    <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="lara_oficial" />
                  </div>
                  <div>
                    <Label>Avatar URL</Label>
                    <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <Label>Bio curta</Label>
                    <Textarea rows={2} value={form.short_bio} onChange={(e) => setForm({ ...form, short_bio: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Moeda</Label>
                      <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                    </div>
                    <div>
                      <Label>Timezone</Label>
                      <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O bot do Telegram, Cakto, voz e IA são configurados depois em <strong>Configurações</strong> com este perfil ativo.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={() => create.mutate()} disabled={create.isPending}>
                    {create.isPending ? "Criando..." : "Criar perfil"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {list.isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}

      <div className="grid gap-3 md:grid-cols-2">
        {(list.data ?? []).map((p) => {
          const active = p.id === profileId;
          const archived = p.status === "archived";
          return (
            <Card key={p.id} className={active ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="truncate">{p.display_name}</span>
                      {active && <Badge variant="secondary" className="text-[10px]"><Check className="h-3 w-3 mr-1" />Ativo</Badge>}
                      {archived && <Badge variant="outline" className="text-[10px]">Arquivado</Badge>}
                    </CardTitle>
                    {p.username && <div className="text-xs text-muted-foreground">@{p.username}</div>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {p.short_bio && <p className="text-xs text-muted-foreground line-clamp-2">{p.short_bio}</p>}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{p.currency}</span>
                  <span>·</span>
                  <span>{p.timezone}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {!archived && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (p.id !== profileId) {
                          setProfileId(p.id);
                          qc.invalidateQueries();
                        }
                        router.navigate({ to: "/perfil-vendedor" });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => toggleArchive.mutate(p)}>
                    {archived ? <><ArchiveRestore className="h-3.5 w-3.5 mr-1" />Reativar</> : <><Archive className="h-3.5 w-3.5 mr-1" />Arquivar</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
