import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formata `LocalDate` (`yyyy-MM-dd`) ou `LocalDateTime` (`yyyy-MM-ddTHH:mm:ss`) do Back-End
 * como `dd/MM/yyyy`, `dd/MM/yyyy HH:mm` (quando `includeTime = true`) ou
 * `dd/MM/yyyy HH:mm:ss` (quando `includeSeconds = true`), evitando deslocamento de fuso.
 */
@Pipe({ name: 'dataBr' })
export class DataBrPipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    includeTime = false,
    includeSeconds = false,
  ): string {
    if (!value) return '—';
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value);
    if (!match) return value;
    const datePart = `${match[3]}/${match[2]}/${match[1]}`;
    if (includeTime && match[4] && match[5]) {
      const sec = includeSeconds ? `:${match[6] ?? '00'}` : '';
      return `${datePart} ${match[4]}:${match[5]}${sec}`;
    }
    return datePart;
  }
}
