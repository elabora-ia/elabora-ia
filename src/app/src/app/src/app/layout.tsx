import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elabora — Gerador de Questões",
  description: "Plataforma profissional de geração de questões para concursos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
