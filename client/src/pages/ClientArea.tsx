import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, COMPANY_INFO } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, Camera, Image as ImageIcon, Package, User } from "lucide-react";
import { Link, Redirect } from "wouter";

export default function ClientArea() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  
  const { data: photoshoots, isLoading: photoshootsLoading } = trpc.photoshoots.getByClient.useQuery(
    { clientId: user?.id || 0 },
    { enabled: !!user?.id }
  );
  
  const { data: orders, isLoading: ordersLoading } = trpc.orders.getByClient.useQuery(
    { clientId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

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

  if (!isAuthenticated || user?.role === "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-3">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 object-contain" />
                <span className="font-semibold text-lg hidden sm:inline">{COMPANY_INFO.name}</span>
              </a>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Olá, {user?.name || "Cliente"}
              </span>
              <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Minha Área</h1>
          <p className="text-muted-foreground">
            Bem-vindo à sua área exclusiva. Aqui você pode visualizar seus ensaios e acompanhar seus pedidos.
          </p>
        </div>

        {/* User Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Meus Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{user?.name || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email || "Não informado"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photoshoots Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Camera className="w-6 h-6" />
            Meus Ensaios
          </h2>

          {photoshootsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : photoshoots && photoshoots.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photoshoots.map((shoot: any) => (
                <Card key={shoot.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{shoot.title}</CardTitle>
                    {shoot.description && (
                      <CardDescription>{shoot.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {shoot.shootDate ? new Date(shoot.shootDate).toLocaleDateString('pt-BR') : 'Data não definida'}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        shoot.status === 'available' ? 'bg-green-100 text-green-700' :
                        shoot.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {shoot.status === 'available' ? 'Disponível' :
                         shoot.status === 'pending' ? 'Pendente' : 'Arquivado'}
                      </span>
                    </div>
                    {shoot.status === 'available' && (
                      <Link href={`/cliente/ensaio/${shoot.id}`}>
                        <Button className="w-full" size="sm">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Ver Fotos
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Você ainda não possui ensaios disponíveis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Orders Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-6 h-6" />
            Meus Pedidos
          </h2>

          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Pedido #{order.orderNumber}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <p className="font-medium">
                          {order.status === 'awaiting_payment' && 'Aguardando Pagamento'}
                          {order.status === 'payment_approved' && 'Pagamento Aprovado'}
                          {order.status === 'in_editing' && 'Em Edição'}
                          {order.status === 'editing_done' && 'Edição Concluída'}
                          {order.status === 'in_printing' && 'Em Revelação'}
                          {order.status === 'printing_done' && 'Revelação Pronta'}
                          {order.status === 'ready_for_pickup' && 'Pronto para Retirada'}
                          {order.status === 'out_for_delivery' && 'Saiu para Entrega'}
                          {order.status === 'delivered' && 'Entregue'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Total</p>
                        <p className="font-bold text-lg">
                          R$ {(order.totalAmount / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Link href={`/cliente/pedido/${order.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Você ainda não possui pedidos.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
