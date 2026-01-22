import { EscrowService } from '../services/EscrowService';
import { EscrowModel } from '../models/Escrow';
import { TransactionModel } from '../models/Transaction';

jest.mock('../models/Escrow');
jest.mock('../models/Transaction');

describe('EscrowService', () => {
  let escrowService: EscrowService;

  beforeEach(() => {
    escrowService = new EscrowService();
    jest.clearAllMocks();
  });

  describe('createEscrow', () => {
    it('should create escrow for completed transaction', async () => {
      const mockTransaction = {
        id: 1,
        status: 'completed',
        amount: 100,
      };

      const mockEscrow = {
        id: 1,
        transaction_id: 1,
        auction_id: 100,
        buyer_id: 10,
        seller_id: 20,
        amount: 100,
        status: 'held',
        delivery_code: '123456',
      };

      (TransactionModel.findById as jest.Mock).mockResolvedValueOnce(mockTransaction);
      (EscrowModel.findByTransactionId as jest.Mock).mockResolvedValueOnce(null);
      (EscrowModel.create as jest.Mock).mockResolvedValueOnce(mockEscrow);

      const result = await escrowService.createEscrow({
        transaction_id: 1,
        auction_id: 100,
        buyer_id: 10,
        seller_id: 20,
        amount: 100,
      });

      expect(result).toEqual(mockEscrow);
      expect(TransactionModel.findById).toHaveBeenCalledWith(1);
      expect(EscrowModel.create).toHaveBeenCalled();
    });

    it('should throw error if transaction not completed', async () => {
      const mockTransaction = {
        id: 1,
        status: 'pending',
      };

      (TransactionModel.findById as jest.Mock).mockResolvedValueOnce(mockTransaction);

      await expect(
        escrowService.createEscrow({
          transaction_id: 1,
          auction_id: 100,
          buyer_id: 10,
          seller_id: 20,
          amount: 100,
        })
      ).rejects.toThrow('Cannot create escrow for incomplete transaction');
    });

    it('should return existing escrow if already created', async () => {
      const mockTransaction = {
        id: 1,
        status: 'completed',
      };

      const existingEscrow = {
        id: 1,
        transaction_id: 1,
        status: 'held',
      };

      (TransactionModel.findById as jest.Mock).mockResolvedValueOnce(mockTransaction);
      (EscrowModel.findByTransactionId as jest.Mock).mockResolvedValueOnce(existingEscrow);

      const result = await escrowService.createEscrow({
        transaction_id: 1,
        auction_id: 100,
        buyer_id: 10,
        seller_id: 20,
        amount: 100,
      });

      expect(result).toEqual(existingEscrow);
      expect(EscrowModel.create).not.toHaveBeenCalled();
    });
  });

  describe('releaseEscrow', () => {
    it('should release escrow with valid delivery code', async () => {
      const mockEscrow = {
        id: 1,
        status: 'held',
        delivery_code: '123456',
      };

      const releasedEscrow = {
        ...mockEscrow,
        status: 'released',
        released_at: new Date(),
      };

      (EscrowModel.findById as jest.Mock).mockResolvedValueOnce(mockEscrow);
      (EscrowModel.releaseWithDeliveryCode as jest.Mock).mockResolvedValueOnce(releasedEscrow);

      const result = await escrowService.releaseEscrow(1, '123456');

      expect(result.status).toBe('released');
      expect(EscrowModel.releaseWithDeliveryCode).toHaveBeenCalledWith(1, '123456');
    });

    it('should throw error if escrow already released', async () => {
      const mockEscrow = {
        id: 1,
        status: 'released',
      };

      (EscrowModel.findById as jest.Mock).mockResolvedValueOnce(mockEscrow);

      await expect(escrowService.releaseEscrow(1, '123456')).rejects.toThrow(
        'Escrow already released'
      );
    });

    it('should throw error if escrow already refunded', async () => {
      const mockEscrow = {
        id: 1,
        status: 'refunded',
      };

      (EscrowModel.findById as jest.Mock).mockResolvedValueOnce(mockEscrow);

      await expect(escrowService.releaseEscrow(1, '123456')).rejects.toThrow(
        'Escrow already refunded'
      );
    });
  });

  describe('refundEscrow', () => {
    it('should refund held escrow', async () => {
      const mockEscrow = {
        id: 1,
        status: 'held',
        amount: 100,
      };

      const refundedEscrow = {
        ...mockEscrow,
        status: 'refunded',
      };

      (EscrowModel.findById as jest.Mock).mockResolvedValueOnce(mockEscrow);
      (EscrowModel.updateStatus as jest.Mock).mockResolvedValueOnce(refundedEscrow);

      const result = await escrowService.refundEscrow(1, 'Order cancelled');

      expect(result.status).toBe('refunded');
      expect(EscrowModel.updateStatus).toHaveBeenCalledWith(1, 'refunded');
    });

    it('should throw error if escrow already released', async () => {
      const mockEscrow = {
        id: 1,
        status: 'released',
      };

      (EscrowModel.findById as jest.Mock).mockResolvedValueOnce(mockEscrow);

      await expect(escrowService.refundEscrow(1)).rejects.toThrow(
        'Cannot refund released escrow'
      );
    });
  });

  describe('canWithdraw', () => {
    it('should return true if no funds are locked', async () => {
      (EscrowModel.findAllHeld as jest.Mock).mockResolvedValueOnce([]);

      const result = await escrowService.canWithdraw(1, 100);

      expect(result).toBe(true);
    });

    it('should return false if funds are locked for seller', async () => {
      const heldEscrows = [
        { id: 1, seller_id: 1, amount: 100 },
        { id: 2, seller_id: 1, amount: 50 },
      ];

      (EscrowModel.findAllHeld as jest.Mock).mockResolvedValueOnce(heldEscrows);

      const result = await escrowService.canWithdraw(1, 200);

      expect(result).toBe(false);
    });
  });

  describe('disputeEscrow', () => {
    it('should mark escrow as disputed', async () => {
      const mockEscrow = {
        id: 1,
        status: 'held',
      };

      const disputedEscrow = {
        ...mockEscrow,
        status: 'disputed',
      };

      (EscrowModel.findById as jest.Mock).mockResolvedValueOnce(mockEscrow);
      (EscrowModel.updateStatus as jest.Mock).mockResolvedValueOnce(disputedEscrow);

      const result = await escrowService.disputeEscrow(1, 'Item not as described');

      expect(result.status).toBe('disputed');
    });

    it('should throw error for escrow with invalid status', async () => {
      const mockEscrow = {
        id: 1,
        status: 'released',
      };

      (EscrowModel.findById as jest.Mock).mockResolvedValueOnce(mockEscrow);

      await expect(
        escrowService.disputeEscrow(1, 'Dispute reason')
      ).rejects.toThrow('Cannot dispute escrow with status: released');
    });
  });
});
