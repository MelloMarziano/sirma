import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';


@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  horizontalPosition: MatSnackBarHorizontalPosition = 'end'; // Derecha
  verticalPosition: MatSnackBarVerticalPosition = 'top';     // Arriba
  


  constructor(
    private snakBar: MatSnackBar,
  ) { }
  private showSnak = async (message: string, className: string, duration: number = 2000) => {
    await this.snakBar.open(message, '', {
      verticalPosition: this.verticalPosition,
      horizontalPosition: this.horizontalPosition,
      panelClass: [className],
      duration
    });
  }
  public async presentToastDanger(message: string, duration: number = 2000) {
    await this.showSnak(message, 'danger-snackbar', duration);
  }
  public async presentToastWarning(message: string, duration: number = 2000) {
    await this.showSnak(message, 'warning-snackbar', duration);
  }
  public async presentToastSuccess(message: string, duration: number = 2000) {
    await this.showSnak(message, 'success-snackbar', duration);
  }
}
