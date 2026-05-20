
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'inventarioCount', pure: false, standalone: false })
export class InventarioCountPipe implements PipeTransform {
  transform(productos: any[], estado: string): number {
    if (!productos) return 0;
    return productos.filter(p => p.estado === estado).length;
  }
}

@Pipe({ name: 'stockSum', pure: false, standalone: false })
export class StockSumPipe implements PipeTransform {
  transform(productos: any[], campo: string): number {
    if (!productos) return 0;
    return productos.reduce((acc, p) => acc + (p[campo] || 0), 0);
  }
}
