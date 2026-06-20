import { useActiveProfile } from "@/lib/active-profile";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, UserCircle, Plus, Settings2 } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

export function ProfileSelector() {
  const router = useRouter();
  const qc = useQueryClient();
  const { profile, profiles, setProfileId, loading } = useActiveProfile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 h-8 px-2.5 rounded-md bg-card border border-border text-xs hover:bg-muted max-w-[200px]">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <UserCircle className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="truncate font-medium text-foreground">
          {loading ? "Carregando..." : profile?.display_name ?? "Selecionar perfil"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Perfil ativo
        </DropdownMenuLabel>
        {profiles.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => {
              setProfileId(p.id);
              // Hard refresh so all queries refetch under the new scope
              setTimeout(() => window.location.reload(), 50);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            {p.avatar_url ? (
              <img src={p.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{p.display_name}</div>
              {p.username && <div className="text-[10px] text-muted-foreground truncate">@{p.username}</div>}
            </div>
            {profile?.id === p.id && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.navigate({ to: "/perfis" })} className="text-xs cursor-pointer">
          <Plus className="h-3.5 w-3.5 mr-2" />Novo perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.navigate({ to: "/perfis" })} className="text-xs cursor-pointer">
          <Settings2 className="h-3.5 w-3.5 mr-2" />Gerenciar perfis
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
