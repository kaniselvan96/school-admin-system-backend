/// <reference types="jest" />

import Express from 'express';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

jest.mock('formidable', () => ({
  IncomingForm: jest.fn(),
}));

import request from 'supertest';

jest.mock('../../../shared/config/logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

type UploadedFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  stream: NodeJS.ReadableStream;
  buffer: Buffer;
};

const mockProcessCsvData = jest.fn<Promise<void>, [unknown[]]>();
let mockUploadedFile: UploadedFile | undefined;

jest.mock('../../../shared/config/multer', () => ({
  __esModule: true,
  default: {
    single:
      () =>
      (
        req: Express.Request,
        res: Express.Response,
        next: Express.NextFunction,
      ) => {
        if (mockUploadedFile) {
          req.file = mockUploadedFile as never;
        }
        next();
      },
  },
}));

jest.mock('../UploadService', () => ({
  UploadService: jest.fn().mockImplementation(() => ({
    processCsvData: (data: unknown[]) => mockProcessCsvData(data),
  })),
}));

// Mock convertCsvToJson so csv-parser (and formidable) are never touched
const mockConvertCsvToJson = jest.fn<Promise<unknown[]>, [string]>();
jest.mock('../../../shared/utils', () => ({
  convertCsvToJson: (filePath: string) => mockConvertCsvToJson(filePath),
}));

import UploadController from '../UploadController';

describe('UploadController', () => {
  const tmpDir = '/tmp/school-administration-system-uploads';

  const mockFile: UploadedFile = {
    fieldname: 'data',
    originalname: 'test.csv',
    encoding: '7bit',
    mimetype: 'text/csv',
    destination: tmpDir,
    filename: 'data-test',
    path: path.join(tmpDir, 'data-test'),
    size: 100,
    stream: new Readable({
      read() {
        this.push(null);
      },
    }),
    buffer: Buffer.alloc(0),
  };

  const createApp = () => {
    const app = Express();
    app.use('/', UploadController);

    return app;
  };

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockProcessCsvData.mockResolvedValue(undefined);
    mockUploadedFile = undefined;
  });

  it('should return 400 when no file is uploaded', async () => {
    const app = createApp();

    const res = await request(app).post('/upload');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'No file uploaded' });
  });

  it('should return 204 when a valid CSV is uploaded', async () => {
    const app = createApp();
    mockUploadedFile = mockFile;

    fs.writeFileSync(mockFile.path, 'fake-csv-content');
    mockConvertCsvToJson.mockResolvedValue([
      {
        teacherEmail: 'teacher1@gmail.com',
        teacherName: 'Teacher 1',
        studentEmail: 'student1@gmail.com',
        studentName: 'Student 1',
        classCode: 'P1-1',
        classname: 'P1 Integrity',
        subjectCode: 'MATHS',
        subjectName: 'Mathematics',
        toDelete: '0',
      },
    ]);

    const res = await request(app).post('/upload');

    expect(res.status).toBe(204);
    expect(mockProcessCsvData).toHaveBeenCalledTimes(1);
  });

  it('should return 500 when CSV validation fails', async () => {
    const app = createApp();
    mockUploadedFile = mockFile;

    fs.writeFileSync(mockFile.path, 'fake-csv-content');
    mockConvertCsvToJson.mockRejectedValue(
      new Error('CSV validation failed:\nRow 1: teacherEmail: Invalid email'),
    );

    const res = await request(app).post('/upload');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to process file upload');
    expect(String(res.body.details)).toContain('CSV validation failed');
  });

  it('should return 500 when processCsvData throws', async () => {
    const app = createApp();
    mockUploadedFile = mockFile;

    fs.writeFileSync(mockFile.path, 'fake-csv-content');
    mockConvertCsvToJson.mockResolvedValue([]);
    mockProcessCsvData.mockRejectedValue(new Error('DB error'));

    const res = await request(app).post('/upload');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'Failed to process file upload',
      details: 'DB error',
    });
  });

  it('should clean up uploaded file after processing', async () => {
    const app = createApp();
    mockUploadedFile = mockFile;

    fs.writeFileSync(mockFile.path, 'fake-csv-content');
    mockConvertCsvToJson.mockResolvedValue([]);

    await request(app).post('/upload');

    expect(fs.existsSync(mockFile.path)).toBe(false);
  });
});
