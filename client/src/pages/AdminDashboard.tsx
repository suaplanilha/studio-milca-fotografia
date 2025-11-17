import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, COMPANY_INFO } from "@/const";
import { trpc } from "@/lib/trpc";
import { Camera, DollarSign, Home, Image as ImageIcon, LogOut, Package, Users } from "lucide-react";
import { Link, Redirect } from "wouter";

export default function AdminDashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  const { data: clients } = trpc.clients.getAll.useQuery();
  const { data: photoshoots } = trpc.photoshoots.getAll.useQuery();
  const { data: orders } = trpc.orders.getAll.useQuery();
  const { data: portfolioItems } = trpc.portfolio.getAll.useQuery();

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

  if (!isAuthenticated || user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const totalRevenue = orders?.reduce((sum, order: any) => {
    if (order.status !== "cancelled") {
      return sum + order.totalAmount;
    }
    return sum;
  }, 0) || 0;

  const pendingOrders = orders?.filter((o: any) => o.status === "awaiting_payment").length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={APP_LOGO} alt={COMPANY_INFO.name} className="h-10 w-10 object-contain" />
              <span className="font-semibold text-lg hidden sm:inline">{COMPANY_INFO.name} - Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Site
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de gerenciamento do Studio Milca Lopes Fotografia
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ensaios Ativos</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {photoshoots?.filter((p: any) => p.status === "available").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {(totalRevenue / 100).toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Ações Rápidas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/clientes">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Gerenciar Clientes
                  </CardTitle>
                  <CardDescription>Ver e gerenciar todos os clientes</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/ensaios">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Gerenciar Ensaios
                  </CardTitle>
                  <CardDescription>Ver e criar ensaios fotográficos</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/pedidos">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Gerenciar Pedidos
                  </CardTitle>
                  <CardDescription>Acompanhar e atualizar pedidos</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/admin/portfolio">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Gerenciar Portfólio
                  </CardTitle>
                  <CardDescription>Editar trabalhos do portfólio público</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Pedidos Recentes</h2>
            <Link href="/admin/pedidos">
              <Button variant="outline" size="sm">Ver Todos</Button>
            </Link>
          </div>

          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order: any) => (
                <Card key={order.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">Pedido #{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R$ {(order.totalAmount / 100).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.status === "awaiting_payment" && "Aguardando Pagamento"}
                        {order.status === "payment_approved" && "Pago"}
                        {order.status === "in_editing" && "Em Edição"}
                        {order.status === "delivered" && "Entregue"}
                      </p>
                    </div>
                    <Link href={`/admin/pedidos/${order.id}`}>
                      <Button variant="outline" size="sm">Ver Detalhes</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum pedido registrado ainda.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
