import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, COMPANY_INFO } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function LinkAccount() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [linkingCode, setLinkingCode] = useState("");

  const linkAccountMutation = trpc.auth.linkAccount.useMutation({
    onSuccess: () => {
      toast.success("Conta vinculada com sucesso!");
      setTimeout(() => {
        setLocation("/cliente");
      }, 2000);
    },
    onError: (error) => {
      toast.error("Erro ao vincular conta: " + error.message);
    },
  });

  const handleLinkAccount = () => {
    if (!linkingCode.trim()) {
      toast.error("Por favor, digite o código de vinculação");
      return;
    }

    linkAccountMutation.mutate({ linkingCode: linkingCode.toUpperCase() });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={APP_LOGO} alt={COMPANY_INFO.name} className="h-16 w-16 mx-auto mb-4" />
            <CardTitle>Faça Login</CardTitle>
            <CardDescription>
              Você precisa estar logado para vincular sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = "/"}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verifica se o usuário já está vinculado
  if (user?.isLinked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle>Conta Já Vinculada</CardTitle>
            <CardDescription>
              Sua conta já está vinculada ao Studio Milca Fotografia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setLocation("/cliente")}>
              Ir para Área do Cliente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={APP_LOGO} alt={COMPANY_INFO.name} className="h-16 w-16 mx-auto mb-4" />
          <CardTitle>Vincular Conta</CardTitle>
          <CardDescription>
            Digite o código de vinculação fornecido pelo fotógrafo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Código de Vinculação</Label>
            <Input
              placeholder="ABC123"
              value={linkingCode}
              onChange={(e) => setLinkingCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="text-center text-lg font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Digite o código de 6 caracteres que você recebeu
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <LinkIcon className="w-4 h-4 inline mr-2" />
              Ao vincular sua conta, você terá acesso aos seus ensaios fotográficos e poderá fazer pedidos de fotos.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Conta logada:</strong> {user?.name || user?.email}
            </p>
            {user?.email && (
              <p className="text-xs text-muted-foreground">
                ✓ O email da sua conta será verificado para garantir segurança
              </p>
            )}
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleLinkAccount}
            disabled={linkAccountMutation.isPending || !linkingCode.trim()}
          >
            {linkAccountMutation.isPending ? "Vinculando..." : "Vincular Conta"}
          </Button>

          <div className="text-center">
            <Button variant="link" onClick={() => setLocation("/")}>
              Voltar para a Página Inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
