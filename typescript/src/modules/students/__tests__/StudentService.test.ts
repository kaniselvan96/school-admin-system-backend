/// <reference types="jest" />

jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('../../../shared/models', () => ({
  Student: {},
  Class: { findOne: jest.fn() },
}));

jest.mock('../../../shared/config/logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

import axios from 'axios';
import { StudentService } from '../StudentService';
import { Class } from '../../../shared/models';

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockClass = Class as jest.Mocked<typeof Class>;

describe('StudentService', () => {
  let service: StudentService;

  beforeEach(() => {
    service = new StudentService();
    jest.clearAllMocks();
  });

  it('returns an empty result when the class does not exist', async () => {
    (mockClass.findOne as jest.Mock).mockResolvedValue(null);

    const result = await service.getStudentsByClassCode('P1-1', 0, 10);

    expect(result).toEqual({ students: [], count: 0 });
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('merges, deduplicates, sorts and paginates internal and external students', async () => {
    (mockClass.findOne as jest.Mock).mockResolvedValue({
      students: [
        { id: 1, name: 'Charlie', email: 'charlie@example.com' },
        { id: 2, name: 'Alice', email: 'alice@example.com' },
      ],
    });
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: {
        count: 2,
        students: [
          { id: 20, name: 'Bob', email: 'bob@example.com' },
          { id: 21, name: 'Alice External', email: 'alice@example.com' },
        ],
      },
    } as never);

    const result = await service.getStudentsByClassCode('P1-1', 1, 2);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:5001/students',
      {
        params: { class: 'P1-1', offset: 0, limit: 500 },
        timeout: 5000,
      },
    );
    expect(result).toEqual({
      students: [
        {
          id: 20,
          name: 'Bob',
          email: 'bob@example.com',
          isExternal: true,
        },
        {
          id: 1,
          name: 'Charlie',
          email: 'charlie@example.com',
          isExternal: false,
        },
      ],
      count: 3,
    });
  });

  it('falls back to internal students when the external response is invalid', async () => {
    (mockClass.findOne as jest.Mock).mockResolvedValue({
      students: [{ id: 1, name: 'Alice', email: 'alice@example.com' }],
    });
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: {
        count: 1,
        students: [{ id: 2, name: 'Bob', email: 'invalid-email' }],
      },
    } as never);

    const result = await service.getStudentsByClassCode('P1-1', 0, 10);

    expect(result).toEqual({
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

  it('rethrows errors from the internal class lookup', async () => {
    (mockClass.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

    await expect(service.getStudentsByClassCode('P1-1', 0, 10)).rejects.toThrow(
      'DB error',
    );
  });
});
