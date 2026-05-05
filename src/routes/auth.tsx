import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "../lib/auth/AuthContext";

type AuthMode = "login" | "register";

export const Route = createFileRoute("/auth")({
  component: AuthRoute,
  head: () => ({
    meta: [
      { title: "Ingreso | ExportIA" },
      { name: "description", content: "Ingresa o crea tu cuenta para gestionar tu operación exportadora." },
    ],
  }),
});

function AuthRoute() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    originCountry: "",
  });

  const isRegister = mode === "register";
  const title = isRegister ? "Crea tu cuenta" : "Ingresa a ExportIA";
  const submitLabel = isRegister ? "Crear cuenta" : "Ingresar";

  const helperItems = useMemo(
    () => [
      "Perfil exportador",
      "Productos y mercados",
      "Alertas operativas",
    ],
    []
  );

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, loading, navigate]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isRegister) {
        await register({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          originCountry: form.originCountry.trim(),
        });
      } else {
        await login(form.email.trim(), form.password);
      }

      navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen md:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.68fr)]">
        <section className="relative hidden overflow-hidden bg-[oklch(0.24_0.05_260)] px-10 py-12 text-white md:flex md:flex-col md:justify-between">
          <div
            className="absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(circle at 28% 24%, oklch(0.68 0.15 165 / 0.34), transparent 28%), linear-gradient(135deg, oklch(0.28 0.07 258), oklch(0.32 0.08 225) 52%, oklch(0.27 0.09 180))",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/12 text-xl font-black">
                E
              </div>
              <div>
                <p className="text-sm font-semibold text-white/70">ExportIA</p>
                <p className="text-xs text-white/55">Cuenta exportadora</p>
              </div>
            </div>

            <div className="mt-20 max-w-xl">
              <h1 className="text-5xl font-extrabold leading-[1.05] tracking-normal">
                Controla tus decisiones de exportación desde un solo lugar.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/72">
                Tu cuenta mantiene perfil, productos, mercados, alertas y asistencia en una experiencia continua.
              </p>
              <div className="mt-6 flex justify-start">
                <img
                  src="/exportia-mascot-DDULeobD.png"
                  alt="Mascota ExportIA"
                  className="w-44 h-auto object-contain opacity-90 drop-shadow-lg"
                />
              </div>
            </div>
          </div>

          <div className="relative grid max-w-xl gap-3">
            {helperItems.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/14 bg-white/8 px-4 py-3 text-sm font-semibold text-white/82">
                <CheckCircle2 size={18} className="text-[oklch(0.79_0.15_165)]" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md">
            <div className="mb-8 md:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-base font-black text-primary-foreground">
                  E
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">ExportIA</p>
                  <p className="text-xs text-muted-foreground">Cuenta exportadora</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <div className="mb-5 grid grid-cols-2 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className={`h-10 rounded-md text-sm font-bold transition-colors ${!isRegister ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setError(null);
                    }}
                    className={`h-10 rounded-md text-sm font-bold transition-colors ${isRegister ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Registro
                  </button>
                </div>
                <h2 className="text-2xl font-extrabold tracking-normal text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {isRegister
                    ? "Completa tus datos para crear tu perfil exportador."
                    : "Usa tu correo y contraseña para continuar con tu perfil exportador."}
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {isRegister && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-foreground">Nombre</span>
                      <span className="relative block">
                        <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={form.firstName}
                          onChange={(event) => updateField("firstName", event.target.value)}
                          required={isRegister}
                          autoComplete="given-name"
                          className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </span>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-foreground">Apellido</span>
                      <input
                        value={form.lastName}
                        onChange={(event) => updateField("lastName", event.target.value)}
                        required={isRegister}
                        autoComplete="family-name"
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  </div>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">Correo</span>
                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      required
                      autoComplete="email"
                      className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">Contraseña</span>
                  <span className="relative block">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      required
                      minLength={isRegister ? 8 : undefined}
                      autoComplete={isRegister ? "new-password" : "current-password"}
                      className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-11 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>

                {isRegister && (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-foreground">País de origen</span>
                    <input
                      value={form.originCountry}
                      onChange={(event) => updateField("originCountry", event.target.value)}
                      autoComplete="country-name"
                      placeholder="Perú"
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                )}

                {error && (
                  <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Procesando..." : submitLabel}
                  {!submitting && <ArrowRight size={17} />}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
