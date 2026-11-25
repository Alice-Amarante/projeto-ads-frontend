import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const base = environment.apiUrl.replace(/\/$/, '');
  const url = req.url.split('?')[0];

  // Ignora o cabeçalho para rotas que não são da API ou para o próprio login
  if (!url.startsWith(base + '/') || url === base + '/auth/login')
    return next(req);

  const token = auth.token();
  const enviada = token ? req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }) : req;

  return next(enviada).pipe(catchError(erro => {
    
    // ITEM C: Tratamento do 401 (Token expirado/inválido)
    if (erro.status === 401 && auth.token() === token) {
      auth.logout(); 
      router.navigate(['/login']);
    }
    
    // ITEM C: Tratamento do 403 (Sem permissão)
    // Preserva a sessão e exibe um alerta
    else if (erro.status === 403) {
      alert('Acesso negado: Você não tem permissão para realizar esta ação.');
    }

    return throwError(() => erro);
  }));
};