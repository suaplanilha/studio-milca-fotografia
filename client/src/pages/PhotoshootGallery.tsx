import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { APP_LOGO, COMPANY_INFO } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Redirect, useParams } from "wouter";
import { toast } from "sonner";

interface CartItem {
  photoId: number;
  filename: string;
  thumbnailUrl: string;
  format: "digital" | "digital_printed";
  printSize?: "10x15" | "15x21" | "20x25" | "20x30";
  quantity: number;
}

export default function PhotoshootGallery() {
  const { id } = useParams<{ id: string }>();
  const { user, loading, isAuthenticated } = useAuth();
  const photoshootId = parseInt(id || "0");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${photoshootId}`);
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCart(parsedCart);
      setSelectedPhotos(new Set(parsedCart.map((item: CartItem) => item.photoId)));
    }
  }, [photoshootId]);

  const { data: photoshoot, isLoading: photoshootLoading } = trpc.photoshoots.getById.useQuery(
    { id: photoshootId },
    { enabled: !!photoshootId }
  );

  const { data: photos, isLoading: photosLoading } = trpc.photos.getByPhotoshoot.useQuery(
    { photoshootId },
    { enabled: !!photoshootId }
  );

  // Disable right-click and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Print Screen, Ctrl+P, Ctrl+S, Ctrl+Shift+S
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.key === "p") ||
        (e.ctrlKey && e.key === "s") ||
        (e.ctrlKey && e.shiftKey && e.key === "s")
      ) {
        e.preventDefault();
        toast.error("Esta ação não é permitida para proteger os direitos autorais.");
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const togglePhotoSelection = (photo: any) => {
    const newSelected = new Set(selectedPhotos);
    let newCart: CartItem[];
    
    if (newSelected.has(photo.id)) {
      newSelected.delete(photo.id);
      newCart = cart.filter((item) => item.photoId !== photo.id);
    } else {
      newSelected.add(photo.id);
      newCart = [
        ...cart,
        {
          photoId: photo.id,
          filename: photo.filename,
          thumbnailUrl: photo.watermarkedUrl || photo.thumbnailUrl,
          format: "digital" as const,
          quantity: 1,
        },
      ];
    }
    
    setCart(newCart);
    setSelectedPhotos(newSelected);
    localStorage.setItem(`cart_${photoshootId}`, JSON.stringify(newCart));
  };

  if (loading || photoshootLoading) {
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

  if (!photoshoot) {
    return <Redirect to="/cliente" />;
  }

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
            <Link href={`/cliente/carrinho/${photoshootId}`}>
              <Button size="sm" className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Carrinho
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{photoshoot.title}</h1>
          {photoshoot.description && (
            <p className="text-muted-foreground">{photoshoot.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Selecione as fotos que deseja adicionar ao seu álbum
          </p>
        </div>

        {photosLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo: any) => (
              <Card
                key={photo.id}
                className={`overflow-hidden cursor-pointer transition-all ${
                  selectedPhotos.has(photo.id) ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => togglePhotoSelection(photo)}
              >
                <div className="aspect-square relative protected-image-container bg-muted">
                  {/* Photo number */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                    #{photo.fileOrder}
                  </div>

                  {/* Selection checkbox */}
                  <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedPhotos.has(photo.id)}
                      onCheckedChange={() => togglePhotoSelection(photo)}
                      className="bg-white"
                    />
                  </div>

                  {/* Photo with watermark */}
                  <img
                    src={photo.watermarkedUrl || photo.thumbnailUrl || photo.originalUrl}
                    alt={photo.filename}
                    className="w-full h-full object-cover protected-image"
                    draggable={false}
                  />

                  {/* Watermark overlay */}
                  <div className="watermark-overlay">
                    {COMPANY_INFO.name}
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs text-muted-foreground truncate">{photo.filename}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma foto disponível neste ensaio.</p>
            </CardContent>
          </Card>
        )}

        {/* Floating cart button on mobile */}
        {cart.length > 0 && (
          <div className="fixed bottom-6 right-6 md:hidden">
            <Link href={`/cliente/carrinho/${photoshootId}`}>
              <Button size="lg" className="rounded-full shadow-lg relative">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Ver Carrinho
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.length}
                </span>
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
