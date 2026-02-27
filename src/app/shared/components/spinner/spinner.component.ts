import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div class="loading-wrap">
      <div class="spinner"></div>
      <span>Cargando...</span>
    </div>
  `,
  styles: [`
    .loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 3rem;
      color: #475569;
      font-size: 0.88rem;
      font-family: 'DM Sans', sans-serif;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 2px solid rgba(59,130,246,0.15);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SpinnerComponent {}