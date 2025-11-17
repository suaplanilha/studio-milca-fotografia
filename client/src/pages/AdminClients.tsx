import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, COMPANY_INFO } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Copy, Plus, Users, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { Link, Redirect } from "wouter";
import { toast } from "sonner";

export default function AdminClients() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: clients, isLoading, refetch } = trpc.clients.getAll.useQuery();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Cliente criado! Código de vinculação: ${data.linkingCode}`);
      setIsCreateDialogOpen(false);
      setNewClient({ name: "", email: "", phone: "" });
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar cliente: " + error.message);
    },
  });

  const regenerateCodeMutation = trpc.clients.regenerateLinkingCode.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Novo código gerado: ${data.linkingCode}`);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao gerar código: " + error.message);
    },
  });

  const handleCreateClient = () => {
    if (!newClient.name || !newClient.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    createClientMutation.mutate(newClient);
  };

  const copyLinkingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <Link href="/admin">
              <a className="flex items-center gap-3">
                <ArrowLeft className="w-5 h-5" />
                <img src={APP_LOGO} alt={COMPANY_INFO.name} className="h-10 w-10 object-contain" />
                <span className="font-semibold text-lg hidden sm:inline">Gerenciar Clientes</span>
              </a>
            </Link>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Crie um cadastro de cliente e gere um código de vinculação
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input
                      placeholder="Nome do cliente"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    />
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 Após criar o cliente, um código de vinculação será gerado. Compartilhe este código com o cliente para que ele possa vincular sua conta social.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateClient} disabled={createClientMutation.isPending}>
                    {createClientMutation.isPending ? "Criando..." : "Criar Cliente"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gerenciar Clientes</h1>
          <p className="text-muted-foreground">
            Cadastre clientes e gerencie códigos de vinculação
          </p>
        </div>

        {clients && clients.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client: any) => (
              <Card key={client.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{client.name || "Sem nome"}</CardTitle>
                      <CardDescription>{client.email}</CardDescription>
                    </div>
                    {client.isLinked ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.phone && (
                    <p className="text-sm">
                      📱 {client.phone}
                    </p>
                  )}

                  {client.isLinked ? (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✓ Conta vinculada em {new Date(client.linkedAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-lg text-center">
                          {client.linkingCode || "---"}
                        </code>
                        {client.linkingCode && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyLinkingCode(client.linkingCode)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        variant="outline"
                        onClick={() => regenerateCodeMutation.mutate({ clientId: client.id })}
                        disabled={regenerateCodeMutation.isPending}
                      >
                        Gerar Novo Código
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Cadastrado em {new Date(client.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Nenhum cliente cadastrado ainda.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Cliente
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
