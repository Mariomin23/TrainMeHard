import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/config/stripe.js', () => ({
  default: {
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        client_secret: 'pi_test_secret_abc',
        id: 'pi_test_123',
      }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock('../../src/utils/logger.util.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { calculateFees, createPaymentIntent } from '../../src/services/payment.service.js';

describe('payment.service', () => {
  describe('calculateFees', () => {
    it('calcula 50% para plataforma y 50% para profesional', () => {
      const fees = calculateFees(100);
      expect(fees.platformFee).toBe(50);
      expect(fees.professionalPayout).toBe(50);
    });

    it('maneja precios con decimales correctamente', () => {
      const fees = calculateFees(30.5);
      expect(fees.platformFee + fees.professionalPayout).toBeCloseTo(30.5, 2);
    });

    it('el payout + fee siempre suma el precio original', () => {
      const prices = [10, 25, 49.99, 150, 200.5];
      prices.forEach((price) => {
        const { platformFee, professionalPayout } = calculateFees(price);
        expect(platformFee + professionalPayout).toBeCloseTo(price, 2);
      });
    });
  });

  describe('createPaymentIntent', () => {
    it('retorna clientSecret y paymentIntentId', async () => {
      const result = await createPaymentIntent('session123', 50, 'acct_stripe123');
      expect(result.clientSecret).toBe('pi_test_secret_abc');
      expect(result.paymentIntentId).toBe('pi_test_123');
    });
  });
});
