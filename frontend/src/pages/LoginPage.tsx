import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MaritimeFlags } from "@/components/MaritimeFlags";
import { getErrorMessage } from "@/lib/utils";

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id email displayName role }
    }
  }
`;

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailError = emailTouched && !isEmailValid;

  const [doLogin, { loading }] = useMutation(LOGIN, {
    onCompleted: (data) => {
      login(data.login.token, data.login.user);
      navigate("/");
    },
    onError: (e) => setError(getErrorMessage(e)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!isEmailValid) return;
    setError(null);
    doLogin({ variables: { email, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">RAV Flag Club</CardTitle>
          <p className="text-sm text-muted-foreground mb-2">Reale Associazione Vessillologica</p>
          <MaritimeFlags text="GRAZIEAAL" size="sm" />
          <CardDescription>{t("auth.login")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                aria-invalid={showEmailError}
                className={showEmailError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {showEmailError && (
                <p className="text-xs text-destructive">{t("auth.invalidEmail")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || showEmailError}>
              {loading ? t("common.loading") : t("auth.loginButton")}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                {t("auth.register")}
              </Link>
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {t("auth.forgotPassword")}
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
