import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";

export const Route = createFileRoute("/asistente")({
  component: AsistentePage,
  head: () => ({
    meta: [
      { title: "Asistente — Exporta Fácil" },
      { name: "description", content: "Pregunta lo que necesites sobre exportación." },
    ],
  }),
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

const initialMessages: Message[] = [
  { role: "assistant", content: "¡Hola! 👋 Soy tu asistente de exportación. Pregúntame lo que necesites, por ejemplo:\n\n• ¿Puedo exportar café a Canadá?\n• ¿Qué necesito para vender en EE.UU.?\n• ¿Cuáles son los mejores mercados?" },
];

function AsistentePage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const fakeReply: Message = {
      role: "assistant",
      content: getReply(input.trim()),
    };
    setMessages((prev) => [...prev, userMsg, fakeReply]);
    setInput("");
  };

  return (
    <div className="app-shell !pb-0 flex flex-col h-dvh max-h-dvh">
      {/* Header */}
      <div className="page-header flex-shrink-0">
        <h1 className="page-title">🤖 Asistente</h1>
        <p className="page-subtitle">Pregunta sobre exportación</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 pb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card text-card-foreground rounded-bl-md shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 pb-[calc(5rem+env(safe-area-inset-bottom))] bg-background border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Escribe tu pregunta..."
            className="flex-1 px-3.5 py-2.5 rounded-full bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={send} className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function getReply(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("café") && lower.includes("canadá")) {
    return "☕ ¡Buenas noticias! Canadá tiene alta demanda de café.\n\n🟢 Demanda alta\n🟡 Requisitos moderados\n⚠️ Nueva regulación sanitaria\n\n👉 Puedes exportar, pero revisa los nuevos requisitos sanitarios antes de enviar tu primer lote.";
  }
  if (lower.includes("ee.uu") || lower.includes("estados unidos")) {
    return "🇺🇸 Para exportar a EE.UU. necesitas:\n\n1. Registro ante la FDA (si es alimento)\n2. Certificado de origen\n3. Etiquetado en inglés\n\n⚠️ Hay una nueva regulación sanitaria vigente. Te recomiendo revisarla en la sección de Alertas.";
  }
  if (lower.includes("mejor") && lower.includes("mercado")) {
    return "📊 Según tu producto, los mejores mercados son:\n\n🇨🇦 Canadá — Alta demanda, fácil de exportar\n🇩🇪 Alemania — Sector orgánico creciendo\n🇲🇽 México — Cercanía geográfica\n\n👉 Te recomiendo empezar por Canadá.";
  }
  return "Gracias por tu pregunta. Basándome en los datos disponibles, te recomiendo revisar la sección de Mercados para ver las oportunidades actuales y la sección de Alertas para estar al día con regulaciones.\n\n¿Hay algo específico que quieras saber?";
}
