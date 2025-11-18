import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_TITLE, COMPANY_INFO } from "@/const";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isAdminLogin ? "/api/auth/admin-login" : "/api/auth/login";
      const body = isAdminLogin ? { email } : { email, code };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login");
      }

      // Redirecionar baseado no role
      if (data.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/cliente");
      }
      
      // Recarregar para atualizar o estado de autenticação
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img src="/logo.png" alt={APP_TITLE} className="h-16 w-16 mx-auto object-contain" />
          </div>
          <CardTitle className="text-2xl">{COMPANY_INFO.name}</CardTitle>
          <CardDescription>
            {isAdminLogin ? "Acesso Administrativo" : "Área do Cliente"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {!isAdminLogin && (
              <div className="space-y-2">
                <Label htmlFor="code">Código de Acesso</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="XXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  disabled={loading}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Código fornecido pelo fotógrafo
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsAdminLogin(!isAdminLogin);
                  setError("");
                  setCode("");
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isAdminLogin ? "Voltar para login de cliente" : "Acesso administrativo"}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>Não tem acesso ainda?</p>
            <p className="mt-1">Entre em contato com o studio</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
