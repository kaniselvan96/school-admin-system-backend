import fs from 'fs';
import csv from 'csv-parser';
import { CsvItemDto, CsvItemSchema } from '../../modules/upload/UploadDto';

export const convertCsvToJson = (filePath: string): Promise<CsvItemDto[]> => {
  const results: CsvItemDto[] = [];
  const errors: string[] = [];
  const stream = fs.createReadStream(filePath).pipe(csv());

  return new Promise((resolve, reject) => {
    let rowIndex = 0;
    stream.on('data', (data: unknown) => {
      rowIndex++;

      // Skip empty rows (e.g. trailing newline in CSV)
      if (
        typeof data === 'object' &&
        data !== null &&
        Object.values(data).every((v) => v === '' || v === undefined)
      ) {
        return;
      }

      const result = CsvItemSchema.safeParse(data);
      if (result.success) {
        results.push(result.data);
      } else {
        const issues = result.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        errors.push(`Row ${rowIndex}: ${issues}`);
      }
    });
    stream.on('end', () => {
      if (errors.length > 0) {
        reject(new Error(`CSV validation failed:\n${errors.join('\n')}`));
        return;
      }
      resolve(results);
    });
    stream.on('error', (err) => reject(err));
  });
};
