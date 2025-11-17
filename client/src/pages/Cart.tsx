import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, COMPANY_INFO } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Trash2, ShoppingCart, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, Redirect, useParams, useLocation } from "wouter";
import { toast } from "sonner";

interface CartItem {
  photoId: number;
  filename: string;
  thumbnailUrl: string;
  format: "digital" | "digital_printed";
  printSize?: "10x15" | "15x21" | "20x25" | "20x30";
  quantity: number;
}

export default function Cart() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();
  const photoshootId = parseInt(id || "0");

  // Load cart from localStorage
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit" | "debit">("pix");
  const [installments, setInstallments] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${photoshootId}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [photoshootId]);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(`cart_${photoshootId}`, JSON.stringify(newCart));
  };

  const updateItemFormat = (photoId: number, format: "digital" | "digital_printed") => {
    const newCart = cart.map((item) =>
      item.photoId === photoId ? { ...item, format, printSize: format === "digital" ? undefined : item.printSize } : item
    );
    saveCart(newCart);
  };

  const updateItemPrintSize = (photoId: number, printSize: "10x15" | "15x21" | "20x25" | "20x30") => {
    const newCart = cart.map((item) => (item.photoId === photoId ? { ...item, printSize } : item));
    saveCart(newCart);
  };

  const removeItem = (photoId: number) => {
    const newCart = cart.filter((item) => item.photoId !== photoId);
    saveCart(newCart);
    toast.success("Foto removida do carrinho");
  };

  const calculateItemPrice = (item: CartItem) => {
    let price = 1000; // R$ 10,00 for digital
    if (item.format === "digital_printed") {
      price = 1500; // Base price for digital + printed
      if (item.printSize === "15x21") price += 500;
      if (item.printSize === "20x25") price += 1000;
      if (item.printSize === "20x30") price += 1500;
    }
    return price * item.quantity;
  };

  const totalAmount = cart.reduce((sum, item) => sum + calculateItemPrice(item), 0);

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Pedido ${data.orderNumber} criado com sucesso!`);
      localStorage.removeItem(`cart_${photoshootId}`);
      setLocation("/cliente");
    },
    onError: (error) => {
      toast.error("Erro ao criar pedido: " + error.message);
    },
  });

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }

    if (deliveryMethod === "delivery" && !deliveryAddress.trim()) {
      toast.error("Por favor, informe o endereço de entrega");
      return;
    }

    // Validate print sizes
    const hasInvalidItems = cart.some(
      (item) => item.format === "digital_printed" && !item.printSize
    );
    if (hasInvalidItems) {
      toast.error("Por favor, selecione o tamanho para todas as fotos reveladas");
      return;
    }

    createOrderMutation.mutate({
      photoshootId,
      items: cart.map((item) => ({
        photoId: item.photoId,
        format: item.format,
        printSize: item.printSize,
        quantity: item.quantity,
      })),
      paymentMethod,
      installments: paymentMethod === "credit" ? installments : 1,
      deliveryMethod,
      deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : undefined,
    });
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

  if (!isAuthenticated || user?.role === "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <Link href={`/cliente/ensaio/${photoshootId}`}>
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
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <ShoppingCart className="w-8 h-8" />
          Meu Álbum de Fotos
        </h1>

        {cart.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Seu carrinho está vazio</p>
              <Link href={`/cliente/ensaio/${photoshootId}`}>
                <Button>Voltar para a Galeria</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <Card key={item.photoId}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 flex-shrink-0 bg-muted rounded overflow-hidden">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{item.filename}</p>
                            <p className="text-sm text-muted-foreground">Foto #{item.photoId}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.photoId)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>Formato</Label>
                          <RadioGroup
                            value={item.format}
                            onValueChange={(value) =>
                              updateItemFormat(item.photoId, value as "digital" | "digital_printed")
                            }
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="digital" id={`digital-${item.photoId}`} />
                              <Label htmlFor={`digital-${item.photoId}`} className="font-normal">
                                Somente Digital (R$ 10,00)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="digital_printed" id={`printed-${item.photoId}`} />
                              <Label htmlFor={`printed-${item.photoId}`} className="font-normal">
                                Digital + Revelada
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {item.format === "digital_printed" && (
                          <div className="space-y-2">
                            <Label>Tamanho da Foto Revelada</Label>
                            <Select
                              value={item.printSize}
                              onValueChange={(value) =>
                                updateItemPrintSize(item.photoId, value as any)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tamanho" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="10x15">10×15 cm (R$ 15,00)</SelectItem>
                                <SelectItem value="15x21">15×21 cm (R$ 20,00)</SelectItem>
                                <SelectItem value="20x25">20×25 cm (R$ 25,00)</SelectItem>
                                <SelectItem value="20x30">20×30 cm (R$ 30,00)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="pt-2 border-t">
                          <p className="text-sm font-semibold">
                            Subtotal: R$ {(calculateItemPrice(item) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Checkout Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fotos selecionadas:</span>
                      <span>{cart.length}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span>R$ {(totalAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="font-normal">PIX</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credit" id="credit" />
                        <Label htmlFor="credit" className="font-normal">Cartão de Crédito</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="debit" id="debit" />
                        <Label htmlFor="debit" className="font-normal">Cartão de Débito</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {paymentMethod === "credit" && (
                    <div className="space-y-2">
                      <Label>Parcelamento</Label>
                      <Select value={installments.toString()} onValueChange={(v) => setInstallments(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1x de R$ {(totalAmount / 100).toFixed(2)}</SelectItem>
                          <SelectItem value="2">2x de R$ {(totalAmount / 200).toFixed(2)}</SelectItem>
                          <SelectItem value="3">3x de R$ {(totalAmount / 300).toFixed(2)}</SelectItem>
                          <SelectItem value="4">4x de R$ {(totalAmount / 400).toFixed(2)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Forma de Entrega</Label>
                    <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="font-normal">Retirar no Studio</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="font-normal">Entrega em Casa</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {deliveryMethod === "delivery" && (
                    <div className="space-y-2">
                      <Label>Endereço de Entrega</Label>
                      <Textarea
                        placeholder="Digite seu endereço completo"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                    <p>
                      ⏱️ As fotos escolhidas serão editadas e enviadas para revelação.
                    </p>
                    <p>
                      📅 Prazo de entrega: 15 dias úteis após confirmação do pagamento.
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={createOrderMutation.isPending}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {createOrderMutation.isPending ? "Processando..." : "Finalizar Compra"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
