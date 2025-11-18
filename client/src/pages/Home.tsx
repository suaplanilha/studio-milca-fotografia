import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, COMPANY_INFO, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Camera, Heart, Image, Mail, MapPin, Phone, Star } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: portfolioItems, isLoading } = trpc.portfolio.getActive.useQuery();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 object-contain" />
              <span className="font-semibold text-lg hidden sm:inline">{COMPANY_INFO.name}</span>
            </div>
            <nav className="flex items-center gap-6">
              <a href="#sobre" className="text-sm font-medium hover:text-primary transition-colors">
                Sobre
              </a>
              <a href="#portfolio" className="text-sm font-medium hover:text-primary transition-colors">
                Portfólio
              </a>
              <a href="#contato" className="text-sm font-medium hover:text-primary transition-colors">
                Contato
              </a>
              {isAuthenticated ? (
                <Link href={user?.role === "admin" ? "/admin" : "/cliente"}>
                  <Button size="sm">
                    {user?.role === "admin" ? "Painel Admin" : "Minha Área"}
                  </Button>
                </Link>
              ) : (
                <Button size="sm" asChild>
                  <Link href="/login">Área do Cliente</Link>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Capturando Momentos Inesquecíveis
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Transformamos seus momentos especiais em memórias eternas através da arte da fotografia profissional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="#portfolio">Ver Portfólio</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#contato">Entre em Contato</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Profissionalismo</h3>
                <p className="text-muted-foreground">
                  Equipamentos de última geração e técnicas avançadas para resultados excepcionais.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                  <Heart className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Dedicação</h3>
                <p className="text-muted-foreground">
                  Cada ensaio é único e recebe atenção especial para capturar sua essência.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/20 mb-4">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Qualidade</h3>
                <p className="text-muted-foreground">
                  Edição profissional e entrega de fotos em alta resolução para você guardar para sempre.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Sobre o Studio</h2>
            <p className="text-lg text-muted-foreground mb-4">
              O <strong>{COMPANY_INFO.name}</strong> é especializado em capturar os momentos mais importantes da sua vida. 
              Com anos de experiência em fotografia profissional, oferecemos ensaios personalizados que refletem 
              a personalidade e emoção de cada cliente.
            </p>
            <p className="text-lg text-muted-foreground">
              Nosso compromisso é transformar cada sessão em uma experiência memorável, entregando 
              fotos de alta qualidade que você vai querer guardar para sempre.
            </p>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nosso Portfólio</h2>
            <p className="text-lg text-muted-foreground">
              Confira alguns dos nossos trabalhos mais recentes
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : portfolioItems && portfolioItems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioItems.map((item: any) => (
                <Card key={item.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                    {item.category && (
                      <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {item.category}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Em breve novos trabalhos serão adicionados ao portfólio.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Entre em Contato</h2>
              <p className="text-lg text-muted-foreground">
                Estamos prontos para tornar seus momentos inesquecíveis
              </p>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Endereço</h3>
                    <p className="text-muted-foreground">{COMPANY_INFO.fullAddress}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start gap-4 p-6">
                  <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">CNPJ</h3>
                    <p className="text-muted-foreground">{COMPANY_INFO.cnpj}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <Button size="lg" asChild>
                <Link href="/login">Acessar Área do Cliente</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              © {new Date().getFullYear()} {COMPANY_INFO.name} - CNPJ: {COMPANY_INFO.cnpj}
            </p>
            <p>{COMPANY_INFO.fullAddress}</p>
            <p className="mt-4">
              Desenvolvimento: <span className="text-primary font-medium">{COMPANY_INFO.developer}</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
