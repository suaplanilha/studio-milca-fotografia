import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, COMPANY_INFO } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Camera, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, Redirect } from "wouter";
import { toast } from "sonner";

export default function AdminPhotoshoots() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: photoshoots, isLoading, refetch } = trpc.photoshoots.getAll.useQuery();
  const { data: clients } = trpc.clients.getAll.useQuery();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPhotoshoot, setNewPhotoshoot] = useState({
    clientId: 0,
    title: "",
    description: "",
    googleDriveUrl: "",
    shootDate: "",
  });

  const createMutation = trpc.photoshoots.create.useMutation({
    onSuccess: () => {
      toast.success("Ensaio criado com sucesso!");
      setIsCreateDialogOpen(false);
      setNewPhotoshoot({
        clientId: 0,
        title: "",
        description: "",
        googleDriveUrl: "",
        shootDate: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar ensaio: " + error.message);
    },
  });

  const syncPhotosMutation = trpc.photoshoots.syncPhotos.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} fotos sincronizadas com sucesso!`);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar fotos: " + error.message);
    },
  });

  const handleCreatePhotoshoot = () => {
    if (!newPhotoshoot.clientId || !newPhotoshoot.title) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    createMutation.mutate({
      clientId: newPhotoshoot.clientId,
      title: newPhotoshoot.title,
      description: newPhotoshoot.description || undefined,
      googleDriveUrl: newPhotoshoot.googleDriveUrl || undefined,
      shootDate: newPhotoshoot.shootDate ? new Date(newPhotoshoot.shootDate) : undefined,
    });
  };

  const handleSyncPhotos = (photoshootId: number, googleDriveUrl: string) => {
    if (!googleDriveUrl) {
      toast.error("URL do Google Drive não configurada para este ensaio");
      return;
    }

    syncPhotosMutation.mutate({
      photoshootId,
      googleDriveUrl,
    });
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
                <span className="font-semibold text-lg hidden sm:inline">Gerenciar Ensaios</span>
              </a>
            </Link>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Ensaio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Ensaio</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo ensaio fotográfico e adicione a URL do Google Drive
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Cliente *</Label>
                    <Select
                      value={newPhotoshoot.clientId.toString()}
                      onValueChange={(value) =>
                        setNewPhotoshoot({ ...newPhotoshoot, clientId: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name || client.email || `Cliente #${client.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Título do Ensaio *</Label>
                    <Input
                      placeholder="Ex: Ensaio Família Silva"
                      value={newPhotoshoot.title}
                      onChange={(e) => setNewPhotoshoot({ ...newPhotoshoot, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descrição do ensaio..."
                      value={newPhotoshoot.description}
                      onChange={(e) =>
                        setNewPhotoshoot({ ...newPhotoshoot, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Data do Ensaio</Label>
                    <Input
                      type="date"
                      value={newPhotoshoot.shootDate}
                      onChange={(e) =>
                        setNewPhotoshoot({ ...newPhotoshoot, shootDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>URL do Google Drive</Label>
                    <Input
                      placeholder="https://drive.google.com/drive/folders/..."
                      value={newPhotoshoot.googleDriveUrl}
                      onChange={(e) =>
                        setNewPhotoshoot({ ...newPhotoshoot, googleDriveUrl: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Cole a URL da pasta pública do Google Drive com as fotos do ensaio
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreatePhotoshoot} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Criando..." : "Criar Ensaio"}
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
          <h1 className="text-3xl font-bold mb-2">Gerenciar Ensaios Fotográficos</h1>
          <p className="text-muted-foreground">
            Crie e gerencie ensaios, sincronize fotos do Google Drive
          </p>
        </div>

        {photoshoots && photoshoots.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photoshoots.map((shoot: any) => (
              <Card key={shoot.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{shoot.title}</CardTitle>
                      <CardDescription>Cliente ID: #{shoot.clientId}</CardDescription>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        shoot.status === "available"
                          ? "bg-green-100 text-green-700"
                          : shoot.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {shoot.status === "available"
                        ? "Disponível"
                        : shoot.status === "pending"
                        ? "Pendente"
                        : "Arquivado"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {shoot.description && (
                    <p className="text-sm text-muted-foreground">{shoot.description}</p>
                  )}

                  {shoot.shootDate && (
                    <p className="text-sm">
                      📅 {new Date(shoot.shootDate).toLocaleDateString("pt-BR")}
                    </p>
                  )}

                  {shoot.googleDriveUrl ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        ✓ Google Drive configurado
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleSyncPhotos(shoot.id, shoot.googleDriveUrl)}
                        disabled={syncPhotosMutation.isPending}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {syncPhotosMutation.isPending ? "Sincronizando..." : "Sincronizar Fotos"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-yellow-600">
                      ⚠️ URL do Google Drive não configurada
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Nenhum ensaio cadastrado ainda.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Ensaio
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
