import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, COMPANY_INFO } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, Clock, Package, Printer, Truck } from "lucide-react";
import { Link, Redirect, useParams } from "wouter";

const ORDER_STATUSES = [
  { key: "awaiting_payment", label: "Aguardando Pagamento", icon: Clock },
  { key: "payment_approved", label: "Pagamento Aprovado", icon: Check },
  { key: "in_editing", label: "Em Edição", icon: Package },
  { key: "editing_done", label: "Edição Concluída", icon: Check },
  { key: "in_printing", label: "Enviada para Revelação", icon: Printer },
  { key: "printing_done", label: "Revelação Pronta", icon: Check },
  { key: "ready_for_pickup", label: "Pronto para Retirada", icon: Package },
  { key: "out_for_delivery", label: "Saiu para Entrega", icon: Truck },
  { key: "delivered", label: "Entregue", icon: Check },
];

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const { user, loading, isAuthenticated } = useAuth();
  const orderId = parseInt(id || "0");

  const { data: order, isLoading: orderLoading } = trpc.orders.getById.useQuery(
    { id: orderId },
    { enabled: !!orderId }
  );

  const { data: orderItems, isLoading: itemsLoading } = trpc.orders.getById.useQuery(
    { id: orderId },
    { enabled: !!orderId }
  );

  if (loading || orderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !order) {
    return <Redirect to="/cliente" />;
  }

  // Check if user has permission to view this order
  if (user?.role !== "admin" && user?.id !== order.clientId) {
    return <Redirect to="/cliente" />;
  }

  const getCurrentStatusIndex = () => {
    return ORDER_STATUSES.findIndex((s) => s.key === order.status);
  };

  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <Link href="/cliente">
              <a className="flex items-center gap-3">
                <ArrowLeft className="w-5 h-5" />
                <img src={APP_LOGO} alt={COMPANY_INFO.name} className="h-10 w-10 object-contain" />
                <span className="font-semibold text-lg hidden sm:inline">Voltar</span>
              </a>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Acompanhamento do Pedido</h1>
          <p className="text-muted-foreground">Pedido #{order.orderNumber}</p>
        </div>

        {/* Order Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data do Pedido</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-medium text-lg">R$ {(order.totalAmount / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
              <p className="font-medium">
                {order.paymentMethod === "pix" && "PIX"}
                {order.paymentMethod === "credit" && `Cartão de Crédito (${order.installments}x)`}
                {order.paymentMethod === "debit" && "Cartão de Débito"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Forma de Entrega</p>
              <p className="font-medium">
                {order.deliveryMethod === "pickup" ? "Retirar no Studio" : "Entrega em Casa"}
              </p>
            </div>
            {order.deliveryAddress && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Endereço de Entrega</p>
                <p className="font-medium">{order.deliveryAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Status do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ORDER_STATUSES.map((status, index) => {
                const Icon = status.icon;
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={status.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {index < ORDER_STATUSES.length - 1 && (
                        <div
                          className={`w-0.5 h-12 ${
                            isCompleted ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p
                        className={`font-medium ${
                          isCompleted ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {status.label}
                      </p>
                      {isCurrent && (
                        <p className="text-sm text-primary mt-1">Status atual</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {order.status === "awaiting_payment" && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⏳ Aguardando confirmação do pagamento. Assim que o pagamento for confirmado, 
                  iniciaremos o processo de edição das suas fotos.
                </p>
              </div>
            )}

            {(order.status === "in_editing" || order.status === "editing_done") && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  🎨 Suas fotos estão sendo editadas com todo cuidado e atenção aos detalhes.
                </p>
              </div>
            )}

            {(order.status === "in_printing" || order.status === "printing_done") && (
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  🖨️ Suas fotos estão sendo reveladas com a melhor qualidade.
                </p>
              </div>
            )}

            {order.status === "ready_for_pickup" && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ Seu pedido está pronto! Você pode retirá-lo no {COMPANY_INFO.name}.
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                  📍 {COMPANY_INFO.fullAddress}
                </p>
              </div>
            )}

            {order.status === "out_for_delivery" && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  🚚 Seu pedido saiu para entrega e chegará em breve!
                </p>
              </div>
            )}

            {order.status === "delivered" && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  🎉 Pedido entregue! Esperamos que você aproveite suas fotos!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prazo de Entrega */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium mb-1">Prazo de Entrega</p>
                <p className="text-sm text-muted-foreground">
                  As fotos escolhidas serão editadas e enviadas para revelação. 
                  O prazo de entrega é de até <strong>15 dias úteis</strong> após a confirmação do pagamento.
                </p>
                {order.paymentConfirmedAt && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Pagamento confirmado em: {new Date(order.paymentConfirmedAt).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
