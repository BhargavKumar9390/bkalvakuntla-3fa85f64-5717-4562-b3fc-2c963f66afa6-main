import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('accessToken');
    try {
      console.debug('[AuthInterceptor] token present:', !!token, 'url:', req.url);
    } catch {}

    if (token) {
      const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      try {
        console.debug('[AuthInterceptor] attaching Authorization header for', req.url);
      } catch {}
      return next.handle(cloned);
    }

    try {
      console.debug('[AuthInterceptor] no token, sending request without Authorization header for', req.url);
    } catch {}
    return next.handle(req);
  }
}
