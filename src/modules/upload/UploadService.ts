import { CsvItem } from 'CsvItem';

export class UploadService {
  async processCsvData(csvData: CsvItem[]): Promise<void> {
    try {
      const teachers = new Map<string, { name: string; email: string }>();
      const students = new Map<
        string,
        { email: string; name: string; toDelete: number }
      >();
      const classes = new Map<
        string,
        {
          code: string;
          name: string;
          teacherEmail: string;
          subjectCode: string;
        }
      >();
      const subjects = new Map<string, { code: string; name: string }>();
      const classStudentLinks = new Set<string>(); //class-student relationships

      console.log('Processing CSV data...', csvData);
    } catch (error) {
      console.error('Error processing CSV data:', error);
      // LOG.error(
      //   `Error uploading CSV data: ${error instanceof Error ? error.message : String(error)}`,
      // );
      throw error;
    }
  }
}
