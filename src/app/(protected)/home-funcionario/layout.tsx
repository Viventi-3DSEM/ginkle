// não declare <html>/<body> aqui: o root layout já faz, e repetir quebra a hidratação
export default function HomeFuncionarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
