import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_LOGO, COMPANY_INFO } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Package } from "lucide-react";
import { Link, Redirect } from "wouter";
import { toast } from "sonner";

export default function AdminOrders() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: orders, isLoading, refetch } = trpc.orders.getAll.useQuery();

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do pedido atualizado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

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

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus as any });
  };

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
                <span className="font-semibold text-lg hidden sm:inline">Gerenciar Pedidos</span>
              </a>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gerenciar Pedidos</h1>
          <p className="text-muted-foreground">
            Visualize e atualize o status de todos os pedidos
          </p>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pedido #{order.orderNumber}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="font-bold text-lg">R$ {(order.totalAmount / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pagamento</p>
                      <p className="font-medium">
                        {order.paymentMethod === "pix" && "PIX"}
                        {order.paymentMethod === "credit" && `Crédito (${order.installments}x)`}
                        {order.paymentMethod === "debit" && "Débito"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entrega</p>
                      <p className="font-medium">
                        {order.deliveryMethod === "pickup" ? "Retirada" : "Entrega"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente ID</p>
                      <p className="font-medium">#{order.clientId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">Status do Pedido</p>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="awaiting_payment">Aguardando Pagamento</SelectItem>
                          <SelectItem value="payment_approved">Pagamento Aprovado</SelectItem>
                          <SelectItem value="in_editing">Em Edição</SelectItem>
                          <SelectItem value="editing_done">Edição Concluída</SelectItem>
                          <SelectItem value="in_printing">Em Revelação</SelectItem>
                          <SelectItem value="printing_done">Revelação Pronta</SelectItem>
                          <SelectItem value="ready_for_pickup">Pronto para Retirada</SelectItem>
                          <SelectItem value="out_for_delivery">Saiu para Entrega</SelectItem>
                          <SelectItem value="delivered">Entregue</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
      </main>
    </div>
  );
}
