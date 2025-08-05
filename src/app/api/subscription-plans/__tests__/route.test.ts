import { GET } from '../route';
import { getAllSubscriptionPlans } from '@/models/subscription-plans';

// Mock the subscription plans model
jest.mock('@/models/subscription-plans');
const mockGetAllSubscriptionPlans = getAllSubscriptionPlans as jest.MockedFunction<typeof getAllSubscriptionPlans>;

describe('/api/subscription-plans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return subscription plans successfully', async () => {
    const mockPlans = [
      {
        id: 1,
        name: 'Basic Plan',
        type: 'basic',
        price: 999,
        currency: 'USD',
        period: 'monthly',
        product_id: 'basic_monthly',
        created_at: new Date('2024-01-01')
      }
    ];

    mockGetAllSubscriptionPlans.mockResolvedValue(mockPlans);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.code).toBe(0);
    expect(data.data).toEqual(mockPlans);
  });

  it('should handle database errors', async () => {
    mockGetAllSubscriptionPlans.mockRejectedValue(new Error('Database connection failed'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.code).toBe(-1);
    expect(data.message).toContain('Failed to fetch subscription plans');
  });
});