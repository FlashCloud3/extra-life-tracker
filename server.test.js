import { jest } from '@jest/globals';

// --- MOCKS ---
const mockFetch = jest.fn();
const mockSay = jest.fn();
const mockConnect = jest.fn();
const mockOn = jest.fn();

// Mock tmi.js (Twitch Client)
jest.unstable_mockModule('tmi.js', () => {
  return {
    default: {
      Client: jest.fn().mockImplementation(() => ({
        connect: mockConnect,
        disconnect: jest.fn(),
        say: mockSay,
        on: mockOn,
        readyState: () => 'OPEN' // Simulate connected
      }))
    }
  };
});

// Mock node-fetch
jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch
}));

// Mock fs/promises
jest.unstable_mockModule('fs/promises', () => {
  const mockFunctions = {
    readFile: jest.fn().mockResolvedValue('{}'),
    writeFile: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
  };
  return {
    __esModule: true,
    ...mockFunctions,
    default: mockFunctions,
  };
});

// Import the module under test
const { fetchData, config, data, seenDonationIds, io, resetState, setupTwitchClient } = await import('./server.js');

describe('Backend Logic', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockSay.mockReset();
    mockOn.mockReset();
    resetState();
    
    // Default Test Config
    config.participantId = '12345';
    config.twitchChannel = 'test_channel';
    config.twitchToken = 'oauth:123';
    config.twitchEnabled = true;
    config.twitchEnableAlerts = true;
    config.twitchEnableCommands = true;
    config.currency = 'USD';
    config.refreshInterval = 60;
  });

  const mockApiResponse = (sumDonations, goal, donationsList, milestonesList = []) => {
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve({ sumDonations, fundraisingGoal: goal, teamID: 999 }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(donationsList) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(milestonesList) });
  };

  describe('Donation Sync', () => {
    test('Subsequent fetch emits event for NEW donation', async () => {
      const emitSpy = jest.spyOn(io, 'emit');
      
      // Initial Load
      mockApiResponse(100, 500, [{ donationID: 'd1', amount: 50 }]);
      await fetchData();
      emitSpy.mockClear();

      // New Donation
      mockApiResponse(125, 500, [
        { donationID: 'd2', amount: 25, displayName: 'Bob', message: 'Hi', createdDateUTC: '2023-01-02' },
        { donationID: 'd1', amount: 50 }
      ]);

      await fetchData();

      expect(data.totalRaised).toBe(125);
      expect(emitSpy).toHaveBeenCalledWith('event:donation', expect.objectContaining({
        donation: expect.objectContaining({ donationID: 'd2', amount: 25 })
      }));
    });
  });

  describe('Twitch Integration', () => {
    test('Sends chat message when donation received and alerts enabled', async () => {
      // Setup Twitch Client
      await setupTwitchClient();
      
      // 1. Initial Fetch (No alert)
      mockApiResponse(100, 500, [{ donationID: 'd1', amount: 100 }]);
      await fetchData();
      expect(mockSay).not.toHaveBeenCalled();

      // 2. New Donation (Should Alert)
      mockApiResponse(150, 500, [
        { donationID: 'd2', amount: 50, displayName: 'DonorGuy', message: 'Hype' },
        { donationID: 'd1', amount: 100 }
      ]);
      await fetchData();

      expect(mockSay).toHaveBeenCalledWith(
        'test_channel',
        expect.stringContaining('🚨 New Donation! DonorGuy just donated $50.00! "Hype"')
      );
    });

    test('Does NOT send chat message if twitchEnableAlerts is false', async () => {
      config.twitchEnableAlerts = false;
      await setupTwitchClient();

      // Initial
      mockApiResponse(100, 500, [{ donationID: 'd1', amount: 100 }]);
      await fetchData();

      // New Donation
      mockApiResponse(150, 500, [
        { donationID: 'd2', amount: 50 },
        { donationID: 'd1', amount: 100 }
      ]);
      await fetchData();

      expect(mockSay).not.toHaveBeenCalled();
    });

    test('Responds to !total command', async () => {
      await setupTwitchClient();
      data.totalRaised = 999.99;

      // Simulate incoming message
      // The mockOn was called with 'message', callback
      // We need to find that callback and execute it
      const messageHandler = mockOn.mock.calls.find(call => call[0] === 'message')[1];
      
      // Execute handler: (channel, tags, message, self)
      messageHandler('test_channel', {}, '!total', false);

      expect(mockSay).toHaveBeenCalledWith(
        'test_channel',
        expect.stringContaining('$999.99')
      );
    });
  });
});