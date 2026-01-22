import { EscrowModel } from '../models/Escrow';
import { CreateEscrowRequest, EscrowStatus } from '../types';
import pool from '../config/database';

// Mock the database pool
jest.mock('../config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

describe('EscrowModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new escrow with generated delivery code', async () => {
      const mockEscrow = {
        id: 1,
        transaction_id: 1,
        auction_id: 100,
        buyer_id: 10,
        seller_id: 20,
        amount: 500.00,
        status: 'held',
        delivery_code: '123456',
        locked_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockEscrow],
      });

      const data: CreateEscrowRequest = {
        transaction_id: 1,
        auction_id: 100,
        buyer_id: 10,
        seller_id: 20,
        amount: 500.00,
      };

      const result = await EscrowModel.create(data);

      expect(result).toHaveProperty('delivery_code');
      expect(result.status).toBe('held');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should find escrow by ID', async () => {
      const mockEscrow = {
        id: 1,
        status: 'held',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockEscrow],
      });

      const result = await EscrowModel.findById(1);

      expect(result).toEqual(mockEscrow);
    });

    it('should return null if escrow not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      const result = await EscrowModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByTransactionId', () => {
    it('should find escrow by transaction ID', async () => {
      const mockEscrow = {
        id: 1,
        transaction_id: 100,
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockEscrow],
      });

      const result = await EscrowModel.findByTransactionId(100);

      expect(result).toEqual(mockEscrow);
    });
  });

  describe('updateStatus', () => {
    it('should update escrow status', async () => {
      const mockEscrow = {
        id: 1,
        status: 'released',
        released_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockEscrow],
      });

      const result = await EscrowModel.updateStatus(1, 'released');

      expect(result.status).toBe('released');
    });

    it('should throw error if escrow not found', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await expect(EscrowModel.updateStatus(999, 'released')).rejects.toThrow(
        'Escrow not found'
      );
    });
  });

  describe('releaseWithDeliveryCode', () => {
    it('should release escrow with valid delivery code', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1, status: 'held', delivery_code: '123456' }] }) // SELECT
          .mockResolvedValueOnce({ rows: [{ id: 1, status: 'released', released_at: new Date() }] }) // UPDATE
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };

      (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);

      const result = await EscrowModel.releaseWithDeliveryCode(1, '123456');

      expect(result.status).toBe('released');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error for invalid delivery code', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [] }) // SELECT - no match
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn(),
      };

      (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);

      await expect(
        EscrowModel.releaseWithDeliveryCode(1, 'wrong-code')
      ).rejects.toThrow('Invalid escrow ID or delivery code');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw error for escrow with invalid status', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [{ id: 1, status: 'released', delivery_code: '123456' }],
          }) // SELECT
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn(),
      };

      (pool.connect as jest.Mock).mockResolvedValueOnce(mockClient);

      await expect(
        EscrowModel.releaseWithDeliveryCode(1, '123456')
      ).rejects.toThrow('Cannot release escrow with status: released');
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('findAllHeld', () => {
    it('should return all held escrows', async () => {
      const mockEscrows = [
        { id: 1, status: 'held', amount: 100 },
        { id: 2, status: 'held', amount: 200 },
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockEscrows,
      });

      const result = await EscrowModel.findAllHeld();

      expect(result).toEqual(mockEscrows);
      expect(result.length).toBe(2);
    });
  });
});
