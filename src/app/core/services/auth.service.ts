import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../../models/auth.model';
import { tokenEstaExpirado, decodificarJwt } from './jwt.util'; // Adicionado decodificarJwt

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private chave = 'financeiro.sessao';
  
  // Restaura a sessão, mas passando pela validação
  private sessao = signal<LoginResponse | null>(this.restaurar());
  
  readonly token = computed(() => this.sessao()?.token ?? null);
  
  // AQUI ESTÁ A MUDANÇA DO ITEM A: 
  // Não basta ter token, ele não pode estar expirado
  readonly autenticado = computed(() => {
    const t = this.token();
    return !!t && !tokenEstaExpirado(t);
  });

  // --- MUDANÇAS DO ITEM B AQUI ---
  
  // Lê os dados do token e guarda
  readonly payload = computed(() => {
    const t = this.token();
    return t ? decodificarJwt(t) : null;
  });

  // Pega o nome do payload, ou usa o padrão solicitado pelo professor
  readonly nomeUsuario = computed(() => {
    return this.payload()?.nome ?? 'Usuário autenticado';
  });

  // Pega o perfil do payload (usado no próximo passo para esconder o menu)
  readonly perfil = computed(() => {
    return this.payload()?.perfil ?? null;
  });
  
  // -------------------------------

  login(dados: LoginRequest) {
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/auth/login`, dados
    ).pipe(tap(res => {
      sessionStorage.setItem(this.chave, JSON.stringify(res));
      this.sessao.set(res);
    }));
  }
  
  logout() {
    sessionStorage.removeItem(this.chave);
    this.sessao.set(null);
  }
  
  private restaurar(): LoginResponse | null {
    try {
      const salvo = sessionStorage.getItem(this.chave);
      if (!salvo) return null;
      
      const sessaoSalva = JSON.parse(salvo) as LoginResponse;
      
      // Se o token salvo já estiver expirado, limpa e ignora
      if (tokenEstaExpirado(sessaoSalva.token)) {
        sessionStorage.removeItem(this.chave);
        return null;
      }
      
      return sessaoSalva;
    } catch { 
      return null; 
    }
  }
}