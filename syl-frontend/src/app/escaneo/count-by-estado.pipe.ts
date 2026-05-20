import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'countByEstado',
  pure: false,   // necesario porque el array muta con unshift
  standalone: true 
})
export class CountByEstadoPipe implements PipeTransform {
  transform(log: any[], estado: string): number {
    if (!log) return 0;
    return log.filter(item => item.estado === estado).length;
  }
}
