/// <reference types="jest" />

import Express from 'express';

jest.mock('formidable', () => ({
  IncomingForm: jest.fn(),
}));

import request from 'supertest';

const mockGetTeacherWorkloadReport = jest.fn<
  Promise<Record<string, unknown[]>>,
  []
>();

jest.mock('../../../shared/config/logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

jest.mock('../ReportService', () => ({
  __esModule: true,
  default: {
    getTeacherWorkloadReport: () => mockGetTeacherWorkloadReport(),
  },
}));

import ReportController from '../ReportController';

describe('ReportController', () => {
  const createApp = () => {
    const app = Express();
    app.use('/', ReportController);
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the workload report', async () => {
    const app = createApp();
    mockGetTeacherWorkloadReport.mockResolvedValue({
      'Teacher A': [
        {
          subjectCode: 'MATH',
          subjectName: 'Mathematics',
          numberOfClasses: 2,
        },
      ],
    });

    const res = await request(app).get('/reports/workload');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      'Teacher A': [
        {
          subjectCode: 'MATH',
          subjectName: 'Mathematics',
          numberOfClasses: 2,
        },
      ],
    });
  });

  it('should return 500 when report generation fails', async () => {
    const app = createApp();
    mockGetTeacherWorkloadReport.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/reports/workload');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch workload report' });
  });
});
