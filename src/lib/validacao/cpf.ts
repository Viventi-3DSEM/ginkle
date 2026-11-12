/** Utilidades de CPF: o banco guarda só dígitos, o formulário aceita máscara. */

export function soDigitos(valor: string): string {
  return (valor ?? "").replace(/\D/g, "");
}

export function cpfValido(valor: string): boolean {
  const digitos = soDigitos(valor);
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  const verificar = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) {
      soma += Number(base[i]) * (pesoInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const primeiro = verificar(digitos.slice(0, 9), 10);
  const segundo = verificar(digitos.slice(0, 10), 11);

  return primeiro === Number(digitos[9]) && segundo === Number(digitos[10]);
}

/** 12345678901 -> 123.456.789-01 */
export function formatarCpf(valor: string): string {
  const d = soDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}