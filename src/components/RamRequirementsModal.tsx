import { useEffect, useMemo, useState } from "react";
import { FileText, Globe2, Hash, Leaf } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import type { RamRequirementsData } from "../lib/api/ramApi";

interface RamRequirementSummary {
  product: string;
  country: string;
  hsCode: string;
  scientificName: string;
  totalRequirements: string;
  sections: Array<{ title: string; description: string }>;
  details: Array<{ title: string; text: string }>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asText(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function htmlToText(value: unknown): string {
  return decodeEntities(asText(value))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseRamRequirements(data: RamRequirementsData, fallbackCountry: string): RamRequirementSummary {
  const payload = Array.isArray(data.requirements) ? data.requirements[0] : data.requirements;
  const root = asRecord(payload);
  const sectionsRaw = Array.isArray(root.requisitos) ? root.requisitos : [];
  const detailsRaw = Array.isArray(root.requisitosDetalles) ? root.requisitosDetalles : [];
  const sections = sectionsRaw
    .map((item) => {
      const section = asRecord(item);
      return {
        title: asText(section.REQ_TITULO),
        description: htmlToText(section.REQ_DESCRIPCION),
      };
    })
    .filter((item) => item.title || item.description);

  return {
    product: asText(root.PRODUCTO) || "Producto RAM",
    country: asText(root.PAIS) || fallbackCountry,
    hsCode: asText(root.PARTIDA),
    scientificName: asText(root.NOMBRE_CIENTIFICO),
    totalRequirements: asText(root.TOTAL_REQUISITOS),
    sections,
    details: detailsRaw
      .map((item, idx) => {
        const detail = asRecord(item);
        return {
          title: asText(detail.REQ_TITULO) || asText(detail.TITULO) || sections[idx]?.title || "Requisito",
          text: htmlToText(detail.REQ_DETALLE ?? detail.DETALLE),
        };
      })
      .filter((item) => item.text),
  };
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
      <span className="shrink-0 text-primary">{icon}</span>
      <div className="min-w-0">
        <p className="text-[0.6rem] font-bold uppercase text-muted-foreground">{label}</p>
        <p className="truncate text-xs font-semibold text-card-foreground">{value}</p>
      </div>
    </div>
  );
}

function RequirementText({ text }: { text: string }) {
  const blocks = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (blocks.length <= 1) {
    return <p className="text-xs leading-6 text-muted-foreground">{text}</p>;
  }

  return (
    <div className="space-y-2">
      {blocks.map((line, idx) => (
        <div key={`${line}-${idx}`} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          <p className="text-xs leading-6 text-muted-foreground">{line}</p>
        </div>
      ))}
    </div>
  );
}

export function RamRequirementsModal({
  data,
  countryName,
  openKey,
}: {
  data: RamRequirementsData;
  countryName: string;
  openKey?: string | number;
}) {
  const [open, setOpen] = useState(false);
  const summary = useMemo(() => parseRamRequirements(data, countryName), [data, countryName]);

  useEffect(() => {
    setOpen(true);
  }, [data, countryName, openKey]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[88vh] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border bg-muted/30 px-5 py-4">
          <div className="flex items-start gap-3 pr-8">
            <span className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
              <FileText size={18} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-base leading-6">{summary.product}</DialogTitle>
              <DialogDescription className="mt-1">
                Requisitos de entrada al mercado registrados por RAM Promperú.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[72vh]">
          <div className="space-y-5 px-5 py-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <InfoPill icon={<Globe2 size={14} />} label="Mercado" value={summary.country} />
              <InfoPill icon={<Hash size={14} />} label="Partida" value={summary.hsCode} />
              <InfoPill icon={<Leaf size={14} />} label="Nombre científico" value={summary.scientificName} />
            </div>

            {summary.sections.length > 0 && (
              <section className="rounded-md border border-border bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    Categorías evaluadas
                  </p>
                  {summary.totalRequirements && (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[0.65rem] font-bold text-primary">
                      {summary.totalRequirements} requisitos
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.sections.map((section, idx) => (
                    <div
                      key={`${section.title}-${idx}`}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-card-foreground"
                    >
                      {section.title}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {summary.details.length > 0 ? (
              <div className="space-y-3">
                {summary.details.map((detail, idx) => (
                  <section key={`${detail.title}-${idx}`} className="overflow-hidden rounded-md border border-border bg-background">
                    <div className="border-b border-border bg-muted/30 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[0.7rem] font-bold text-primary-foreground">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-bold text-card-foreground">{detail.title}</p>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <RequirementText text={detail.text} />
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                RAM Promperú confirmó información para este producto y país, pero no devolvió detalles para mostrar.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
