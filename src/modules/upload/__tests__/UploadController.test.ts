/// <reference types="jest" />

import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

jest.mock('../../../shared/config/logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

// Mock convertCsvToJson so csv-parser (and formidable) are never touched
const mockConvertCsvToJson = jest.fn<Promise<unknown[]>, [string]>();
jest.mock('../../../shared/utils', () => ({
  convertCsvToJson: (filePath: string) => mockConvertCsvToJson(filePath),
}));

import { createUploadHandler } from '../UploadController';

type MockRequest = Partial<Request> & {
  file?: {
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
};

type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
  sendStatus: jest.Mock;
  statusCode?: number;
  body?: Record<string, unknown>;
};

describe('UploadController', () => {
  let processCsvData: jest.Mock;
  const tmpDir = '/tmp/school-administration-system-uploads';

  const MOCK_FILE = {
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

  const createResponse = (): MockResponse => {
    const res: MockResponse = {
      status: jest.fn(),
      json: jest.fn(),
      sendStatus: jest.fn(),
    };

    res.status.mockImplementation((statusCode: number) => {
      res.statusCode = statusCode;
      return res;
    });

    res.json.mockImplementation((body: Record<string, unknown>) => {
      res.body = body;
      return res;
    });

    res.sendStatus.mockImplementation((statusCode: number) => {
      res.statusCode = statusCode;
      return res;
    });

    return res;
  };

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    processCsvData = jest.fn().mockResolvedValue(undefined);
  });

  it('should return 400 when no file is uploaded', async () => {
    const req: MockRequest = {};
    const res = createResponse();
    const handler = createUploadHandler({ processCsvData });

    await handler(
      req as Request,
      res as unknown as Response,
      jest.fn() as unknown as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body?.error).toBe('No file uploaded');
  });

  it('should return 204 when a valid CSV is uploaded', async () => {
    const req: MockRequest = { file: MOCK_FILE };
    const res = createResponse();
    const handler = createUploadHandler({ processCsvData });

    fs.writeFileSync(MOCK_FILE.path, 'fake-csv-content');
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

    await handler(
      req as Request,
      res as unknown as Response,
      jest.fn() as unknown as NextFunction,
    );

    expect(processCsvData).toHaveBeenCalledTimes(1);
    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });

  it('should return 500 when CSV validation fails', async () => {
    const req: MockRequest = { file: MOCK_FILE };
    const res = createResponse();
    const handler = createUploadHandler({ processCsvData });

    fs.writeFileSync(MOCK_FILE.path, 'fake-csv-content');
    mockConvertCsvToJson.mockRejectedValue(
      new Error('CSV validation failed:\nRow 1: teacherEmail: Invalid email'),
    );

    await handler(
      req as Request,
      res as unknown as Response,
      jest.fn() as unknown as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body?.error).toBe('Failed to process file upload');
    expect(String(res.body?.details)).toContain('CSV validation failed');
  });

  it('should return 500 when processCsvData throws', async () => {
    const req: MockRequest = { file: MOCK_FILE };
    const res = createResponse();
    const handler = createUploadHandler({
      processCsvData: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    fs.writeFileSync(MOCK_FILE.path, 'fake-csv-content');
    mockConvertCsvToJson.mockResolvedValue([]);

    await handler(
      req as Request,
      res as unknown as Response,
      jest.fn() as unknown as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body?.error).toBe('Failed to process file upload');
    expect(res.body?.details).toBe('DB error');
  });

  it('should clean up uploaded file after processing', async () => {
    const req: MockRequest = { file: MOCK_FILE };
    const res = createResponse();
    const handler = createUploadHandler({ processCsvData });

    fs.writeFileSync(MOCK_FILE.path, 'fake-csv-content');
    mockConvertCsvToJson.mockResolvedValue([]);

    await handler(
      req as Request,
      res as unknown as Response,
      jest.fn() as unknown as NextFunction,
    );

    expect(fs.existsSync(MOCK_FILE.path)).toBe(false);
  });
});
