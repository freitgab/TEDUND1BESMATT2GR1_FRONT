import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, isDevMode, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

interface QuickUser {
  label: string;
  hint: string;
  email: string;
}

const MOTIVOS: Record<string, string> = {
  'sessao-expirada': 'Sua sessão expirou ou é inválida. Faça login novamente.',
  'acesso-negado': 'Acesso negado pelo servidor. Faça login novamente.',
};

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Preenchimento rápido de usuários de teste: apenas em modo de desenvolvimento. */
  protected readonly devMode = isDevMode();
  protected readonly devPassword = '123456';
  protected readonly quickUsers: QuickUser[] = [
    { label: 'Admin Multi-Perfil', hint: 'Administrador + Colaborador + Usuário', email: 'admin@clima.gov.br' },
    { label: 'Administrador', hint: 'Somente perfil Administrador', email: 'gestor@clima.gov.br' },
    { label: 'Colaborador Técnico', hint: 'Somente perfil Colaborador', email: 'tecnico@clima.gov.br' },
    { label: 'Usuário Pesquisador', hint: 'Somente perfil Usuário', email: 'pesquisador@clima.gov.br' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly infoMessage = signal<string | null>(
    MOTIVOS[this.route.snapshot.queryParamMap.get('motivo') ?? ''] ?? null,
  );
  protected readonly showPassword = signal(false);

  protected fillQuickUser(user: QuickUser): void {
    this.form.setValue({ email: user.email, senha: this.devPassword });
    this.errorMessage.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl(this.safeReturnUrl());
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(this.describeError(error));
      },
    });
  }

  /** Só aceita caminhos internos como destino pós-login (evita open redirect). */
  private safeReturnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login') ? url : '/';
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Não foi possível conectar ao back-end. Verifique se ele está em execução em http://localhost:8080.';
      }
      if (error.status === 401) {
        return 'E-mail ou senha inválidos.';
      }
      if (error.status === 403) {
        return 'Acesso negado pelo back-end. Abra o sistema por http://localhost:4200.';
      }
      if (error.status === 400) {
        return 'Dados de login inválidos. Confira o e-mail e a senha informados.';
      }
    }
    return 'Erro inesperado ao autenticar. Tente novamente.';
  }
}
