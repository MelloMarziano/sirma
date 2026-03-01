import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
declare let alertify: any;

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor() {
    // Default configuration for alertify
    if (typeof alertify !== 'undefined') {
      alertify.set('notifier', 'position', 'top-right');
    }
  }

  success(message: string) {
    if (typeof alertify !== 'undefined') {
      alertify.success(message);
    }
  }

  error(message: string) {
    if (typeof alertify !== 'undefined') {
      alertify.error(message);
    }
  }

  warning(message: string) {
    if (typeof alertify !== 'undefined') {
      alertify.warning(message);
    }
  }

  message(message: string) {
    if (typeof alertify !== 'undefined') {
      alertify.message(message);
    }
  }

  // SweetAlert2 for confirmations and blocking alerts
  async confirm(
    title: string,
    text: string,
    confirmButtonText: string = 'Sí, eliminar',
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Cancelar',
    });
    return result.isConfirmed;
  }

  showLoading(title: string = 'Cargando...') {
    Swal.fire({
      title: title,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  close() {
    Swal.close();
  }

  successAlert(title: string, text: string) {
    Swal.fire({
      icon: 'success',
      title: title,
      text: text,
      timer: 1500,
      showConfirmButton: false,
    });
  }
}
