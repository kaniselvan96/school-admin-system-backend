/// <reference types="jest" />

import Express from 'express';

jest.mock('formidable', () => ({
  IncomingForm: jest.fn(),
}));

import request from 'supertest';

const mockGetStudentsByClassCode = jest.fn<
  Promise<{ students: unknown[]; count: number }>,
  [string, number, number]
>();

jest.mock('../../../shared/config/logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

jest.mock('../StudentService', () => ({
  StudentService: jest.fn().mockImplementation(() => ({
    getStudentsByClassCode: (
      classCode: string,
      offset: number,
      limit: number,
    ) => mockGetStudentsByClassCode(classCode, offset, limit),
  })),
}));

import StudentController from '../StudentController';

describe('StudentController', () => {
  const createApp = () => {
    const app = Express();
    app.use('/', StudentController);
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStudentsByClassCode.mockResolvedValue({
      students: [
        {
          id: 1,
          name: 'Alice',
          email: 'alice@example.com',
          isExternal: false,
        },
      ],
      count: 1,
    });
  });

  it('should fetch students and return 200', async () => {
    const app = createApp();

    const res = await request(app).get(
      '/class/P1-1/students?offset=0&limit=10',
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      students: [
        {
          id: 1,
          name: 'Alice',
          email: 'alice@example.com',
          isExternal: false,
        },
      ],
      count: 1,
    });
    expect(mockGetStudentsByClassCode).toHaveBeenCalledWith('P1-1', 0, 10);
  });

  it('should return 400 when the query is invalid', async () => {
    const app = createApp();

    const res = await request(app).get(
      '/class/P1-1/students?offset=-1&limit=10',
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(mockGetStudentsByClassCode).not.toHaveBeenCalled();
  });

  it('should return 500 when fetching students fails', async () => {
    const app = createApp();
    mockGetStudentsByClassCode.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get(
      '/class/P1-1/students?offset=0&limit=10',
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch students' });
  });
});
