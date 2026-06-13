import { vi, beforeEach, describe, expect, it } from 'vitest';
import measurementRepository from '../models/measurementRepository.js';

vi.mock('../db/poolManager.js', () => ({
  getClient: vi.fn(),
}));

import { getClient } from '../db/poolManager.js';

describe('measurementRepository.getCompositeCheckInMeasurements', () => {
  const userId = 'user-123';
  const date = '2026-06-13';

  let mockClient: {
    query: ReturnType<typeof vi.fn>;
    release: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    vi.mocked(getClient).mockResolvedValue(mockClient as any);
  });

  it('returns composite row with per-field most-recent values', async () => {
    mockClient.query.mockResolvedValue({
      rows: [
        {
          weight: '80.5',
          height: '180',
          waist: '85',
          neck: '38',
          hips: '95',
          body_fat_percentage: '18.5',
          steps: 8000,
        },
      ],
    });

    const result = await measurementRepository.getCompositeCheckInMeasurements(
      userId,
      date
    );

    expect(result).toEqual({
      weight: '80.5',
      height: '180',
      waist: '85',
      neck: '38',
      hips: '95',
      body_fat_percentage: '18.5',
      steps: 8000,
    });
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('returns null fields when no historical data exists', async () => {
    mockClient.query.mockResolvedValue({
      rows: [
        {
          weight: null,
          height: null,
          waist: null,
          neck: null,
          hips: null,
          body_fat_percentage: null,
          steps: null,
        },
      ],
    });

    const result = await measurementRepository.getCompositeCheckInMeasurements(
      userId,
      date
    );

    expect(result.weight).toBeNull();
    expect(result.body_fat_percentage).toBeNull();
    expect(result.steps).toBeNull();
  });

  it('returns null when no rows are returned', async () => {
    mockClient.query.mockResolvedValue({ rows: [] });

    const result = await measurementRepository.getCompositeCheckInMeasurements(
      userId,
      date
    );

    expect(result).toBeNull();
  });

  it('passes correct parameters to the SQL query', async () => {
    mockClient.query.mockResolvedValue({ rows: [{}] });

    await measurementRepository.getCompositeCheckInMeasurements(userId, date);

    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('entry_date <= $2'),
      [userId, date]
    );
    // Steps query uses = $2 (not <=)
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('entry_date = $2'),
      [userId, date]
    );
  });

  it('always releases the client', async () => {
    mockClient.query.mockRejectedValue(new Error('DB error'));

    await expect(
      measurementRepository.getCompositeCheckInMeasurements(userId, date)
    ).rejects.toThrow('DB error');

    expect(mockClient.release).toHaveBeenCalled();
  });
});
