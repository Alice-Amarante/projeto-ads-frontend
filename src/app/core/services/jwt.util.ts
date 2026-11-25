// src/app/core/jwt.util.ts

export interface JwtPayload {
  iss?: string;
  sub?: string;
  iat?: number;
  exp?: number;
  nome?: string;   // Prevenindo o Item B
  perfil?: string; // Prevenindo o Item B
  [key: string]: any;
}

export function decodificarJwt(token: string): JwtPayload | null {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) {
      throw new Error('Token malformado: não tem 3 partes');
    }
    
    // Pista do professor: trocar - por + e _ por /
    const base64Url = partes[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Completar padding
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    
    // Decodificar
    const binaryString = atob(padded);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Usar TextDecoder para UTF-8
    const jsonPayload = new TextDecoder().decode(bytes);
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}

export function tokenEstaExpirado(token: string | null): boolean {
  if (!token) return true;
  
  const payload = decodificarJwt(token);
  
  // Se não decodificou ou não tem 'exp', consideramos expirado por segurança
  if (!payload || !payload.exp) {
    return true;
  }
  
  // Date.now() retorna em milissegundos, exp em segundos
  return Date.now() >= payload.exp * 1000;
}