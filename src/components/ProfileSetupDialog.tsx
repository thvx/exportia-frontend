import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Loader2, PackagePlus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { alertsApi, type WtoMember } from "../lib/api/alertsApi";
import { authApi } from "../lib/api/authApi";
import { productsApi } from "../lib/api/productsApi";
import type { QRProduct } from "../types/alerts";

interface ProfileSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => Promise<void> | void;
  dismissible?: boolean;
  title?: string;
}

type ProductMatches = Record<string, QRProduct[]>;
type SelectedProducts = Record<string, QRProduct>;

interface ClassifyFields {
  descripcion: string;
  usos: string;
  presentacion: string;
  materiales: string;
  origen: string;
  estado_fisico: string;
  grado_procesamiento: string;
  informacion_adicional: string;
}

function splitTerms(value: string): string[] {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function productDescription(product: QRProduct): string {
  if (typeof product.description === "string") return product.description;
  return product.description.es || product.description.en || product.description.fr || product.code;
}

function hasUsableHsCode(product: QRProduct): boolean {
  const code = product.code.replace(/\D/g, "");
  const description = normalize(productDescription(product));
  return code.length >= 4 && code.length <= 10 && description !== "n/a";
}

function findCountry(term: string, members: WtoMember[]): WtoMember | null {
  const clean = normalize(term);
  return (
    members.find((member) => normalize(member.text) === clean || normalize(member.value) === clean) ??
    members.find((member) => normalize(member.text).includes(clean)) ??
    null
  );
}

const CLASSIFY_FIELDS: { key: keyof ClassifyFields; label: string; placeholder: string; required?: boolean }[] = [
  { key: "descripcion",           label: "Descripción",          required: true, placeholder: "Ej: Aceite de oliva virgen extra obtenido por procesos mecánicos" },
  { key: "usos",                  label: "Usos",                                 placeholder: "Ej: Consumo humano, uso culinario" },
  { key: "presentacion",          label: "Presentación",                         placeholder: "Ej: Botella de vidrio de 750 ml" },
  { key: "materiales",            label: "Materiales / Ingredientes",            placeholder: "Ej: 100% aceite de oliva, sin aditivos" },
  { key: "origen",                label: "Origen",                               placeholder: "Ej: Perú" },
  { key: "estado_fisico",         label: "Estado físico",                        placeholder: "Ej: Sólido, líquido, polvo" },
  { key: "grado_procesamiento",   label: "Grado de procesamiento",               placeholder: "Ej: Producto procesado, semiprocesado" },
  { key: "informacion_adicional", label: "Información adicional",                placeholder: "Ej: Certificación orgánica, acidez máxima 0.8%" },
];

const EMPTY_CLASSIFY: ClassifyFields = {
  descripcion: "", usos: "", presentacion: "", materiales: "",
  origen: "", estado_fisico: "", grado_procesamiento: "", informacion_adicional: "",
};

export function ProfileSetupDialog({
  open,
  onOpenChange,
  onCompleted,
  dismissible = true,
  title = "Configura tu perfil exportador",
}: ProfileSetupDialogProps) {
  const [productInput, setProductInput] = useState("");
  const [countryInput, setCountryInput] = useState("");
  const [members, setMembers] = useState<WtoMember[]>([]);
  const [matches, setMatches] = useState<ProductMatches>({});
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>({});
  const [selectedCountries, setSelectedCountries] = useState<WtoMember[]>([]);
  const [classifyFields, setClassifyFields] = useState<ClassifyFields>(EMPTY_CLASSIFY);
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [validatingCountries, setValidatingCountries] = useState(false);
  const [saving, setSaving] = useState(false);

  const productTerms = useMemo(() => splitTerms(productInput), [productInput]);
  const countryTerms = useMemo(() => splitTerms(countryInput), [countryInput]);
  const canSave = Object.keys(selectedProducts).length > 0 && selectedCountries.length > 0;
  const hasProductSelected = Object.keys(selectedProducts).length > 0;

  useEffect(() => {
    if (!open || members.length > 0) return;
    alertsApi
      .getQuotaMembers()
      .then((res) => setMembers(res.data))
      .catch(() => toast.error("No se pudo cargar el catálogo de países."));
  }, [members.length, open]);

  if (!open) return null;

  async function searchProducts() {
    if (productTerms.length === 0) {
      toast.error("Escribe al menos un producto.");
      return;
    }
    setSearching(true);
    try {
      const results = await Promise.all(
        productTerms.map(async (term) => {
          const res = await productsApi.searchMatches(term);
          return [term, res.data.filter(hasUsableHsCode).slice(0, 6)] as const;
        })
      );
      const nextMatches = Object.fromEntries(results);
      const autoSelected = Object.fromEntries(
        results
          .filter(([, items]) => items.length === 1)
          .map(([term, items]) => [term, items[0]])
      );
      setMatches(nextMatches);
      setSelectedProducts((current) => ({ ...current, ...autoSelected }));
      const withoutMatches = results.filter(([, items]) => items.length === 0).map(([term]) => term);
      if (withoutMatches.length > 0) {
        toast.warning(`Sin coincidencias para: ${withoutMatches.join(", ")}`);
      }
      if (Object.keys(nextMatches).length > 0) setClassifyOpen(true);
    } finally {
      setSearching(false);
    }
  }

  async function validateCountries() {
    if (countryTerms.length === 0) {
      toast.error("Escribe al menos un país.");
      return;
    }
    setValidatingCountries(true);
    try {
      const resolved = countryTerms.map((term) => findCountry(term, members));
      const missing = countryTerms.filter((_, index) => !resolved[index]);
      if (missing.length > 0) {
        toast.error(`No encontré estos países en WTO: ${missing.join(", ")}`);
      }
      const unique = new Map<string, WtoMember>();
      resolved.forEach((country) => {
        if (country) unique.set(country.value, country);
      });
      setSelectedCountries(Array.from(unique.values()));
    } finally {
      setValidatingCountries(false);
    }
  }

  function setClassifyField(key: keyof ClassifyFields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setClassifyFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      toast.error("Elige al menos un producto y un país validado.");
      return;
    }
    setSaving(true);
    try {
      const nonEmptyFields = Object.fromEntries(
        Object.entries(classifyFields).filter(([, v]) => v.trim() !== "")
      ) as Record<string, string>;
      const classificationData = Object.keys(nonEmptyFields).length > 0
        ? { fields: nonEmptyFields, savedAt: new Date().toISOString() }
        : undefined;

      await Promise.all(
        Object.entries(selectedProducts).map(([term, product]) =>
          productsApi.create({
            name: productDescription(product) || term,
            hs_code: product.code.replace(/\D/g, ""),
            category: "WTO",
            description: `Coincidencia seleccionada para "${term}"`,
            classification_data: classificationData,
          })
        )
      );

      await Promise.all(
        selectedCountries.map((country) =>
          authApi.addDestinationCountry({
            country_code: country.value,
            country_name: country.text,
          })
        )
      );

      toast.success("Perfil actualizado");
      await onCompleted?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/35 px-4 py-6">
      <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <PackagePlus size={20} className="text-primary" />
              <h2 className="text-lg font-extrabold text-card-foreground">{title}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Busca productos, elige su partida arancelaria y valida tus países destino.
            </p>
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={saveProfile} className="space-y-5 px-5 py-5">
          {/* ── Step 1: Product search ── */}
          <section>
            <label className="text-sm font-bold text-card-foreground">Productos a exportar</label>
            <textarea
              value={productInput}
              onChange={(event) => setProductInput(event.target.value)}
              rows={3}
              placeholder="Ej: café orgánico, cacao, textiles de algodón"
              className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => void searchProducts()}
              disabled={searching}
              className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground disabled:opacity-70"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Buscar coincidencias
            </button>
          </section>

          {/* ── Step 2: Select HS match ── */}
          {Object.keys(matches).length > 0 && (
            <section className="space-y-3">
              <p className="text-sm font-bold text-card-foreground">Elige la mejor coincidencia</p>
              {Object.entries(matches).map(([term, items]) => (
                <div key={term} className="rounded-lg border border-border bg-background p-3">
                  <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">{term}</p>
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin coincidencias.</p>
                  ) : (
                    <div className="grid gap-2">
                      {items.map((item) => {
                        const active = selectedProducts[term]?.code === item.code;
                        return (
                          <button
                            type="button"
                            key={`${term}-${item.code}`}
                            onClick={() => setSelectedProducts((current) => ({ ...current, [term]: item }))}
                            className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                              active ? "border-primary bg-primary/8" : "border-border bg-card hover:bg-muted"
                            }`}
                          >
                            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
                              {active && <Check size={13} />}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-card-foreground">{item.code}</span>
                              <span className="block text-xs leading-5 text-muted-foreground">{productDescription(item)}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* ── Step 3: Classification data ── */}
          {hasProductSelected && (
            <section className="rounded-lg border border-border bg-background">
              <button
                type="button"
                onClick={() => setClassifyOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-bold text-card-foreground">Datos para clasificación arancelaria</p>
                  <p className="text-xs text-muted-foreground">Ayuda a la IA a confirmar la partida correcta. Recomendado.</p>
                </div>
                {classifyOpen ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
              </button>

              {classifyOpen && (
                <div className="border-t border-border px-4 pb-4 pt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {CLASSIFY_FIELDS.map(({ key, label, placeholder, required }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-muted-foreground">
                        {label}{required && <span className="text-signal-red ml-0.5">*</span>}
                      </label>
                      <input
                        type="text"
                        value={classifyFields[key]}
                        onChange={setClassifyField(key)}
                        placeholder={placeholder}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Step 4: Destination countries ── */}
          <section>
            <label className="text-sm font-bold text-card-foreground">Países destino</label>
            <p className="text-xs text-muted-foreground mt-0.5">Puedes ingresar uno o varios países separados por comas o saltos de línea.</p>
            <textarea
              value={countryInput}
              onChange={(event) => setCountryInput(event.target.value)}
              rows={2}
              placeholder="Ej: Canadá, Estados Unidos, Chile, Alemania"
              className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => void validateCountries()}
              disabled={validatingCountries || members.length === 0}
              className="mt-2 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground disabled:opacity-70"
            >
              {validatingCountries ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Validar países
            </button>
          </section>

          {selectedCountries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCountries.map((country) => (
                <span key={country.value} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                  {country.text}
                  <button
                    type="button"
                    onClick={() => setSelectedCountries((prev) => prev.filter((c) => c.value !== country.value))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Quitar ${country.text}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            {dismissible && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 rounded-lg border border-border px-4 text-sm font-bold text-foreground hover:bg-muted"
              >
                Después
              </button>
            )}
            <button
              type="submit"
              disabled={!canSave || saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Guardar perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
