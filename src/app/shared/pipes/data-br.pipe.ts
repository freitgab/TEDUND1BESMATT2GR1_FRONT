import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formata `LocalDate` do Back-End (`yyyy-MM-dd`) como `dd/MM/yyyy` sem passar por
 * `Date`, evitando o deslocamento de fuso (UTC → -03:00 mostraria o dia anterior).
 */
@Pipe({ name: 'dataBr' })
export class DataBrPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
  }
}
