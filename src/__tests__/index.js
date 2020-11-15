const nock = require('nock');
const Lightspeed = require('../index');

describe('Lightspeed class', () => {
  it('has all the methods available', () => {
    const lightspeed = new Lightspeed({
      clientId: 'client',
      clientSecret: 'secret',
      refreshToken: 'token',
    });

    expect(typeof lightspeed).toBe('object');
    expect(typeof lightspeed.getAccount).toBe('function');
    expect(typeof lightspeed.getItems).toBe('function');
    expect(typeof lightspeed.getItemById).toBe('function');
    expect(typeof lightspeed.getManufacturers).toBe('function');
    expect(typeof lightspeed.getToken).toBe('function');
  });

  describe('validates constructor values', () => {
    const clientId = 'client';
    const clientSecret = 'secret';
    const refreshToken = 'token';

    it('clientId', () => {
      expect(() => new Lightspeed({ clientSecret, refreshToken })).toThrowError(
        'Param clientId is required'
      );
    });

    it('clientSecret', () => {
      expect(() => new Lightspeed({ clientId, refreshToken })).toThrowError(
        'Param clientSecret is required'
      );
    });

    it('refreshToken', () => {
      expect(() => new Lightspeed({ clientId, clientSecret })).toThrowError(
        'Param refreshToken is required'
      );
    });
  });

  describe('manages rate limit properly', () => {
    let lightspeed;

    beforeAll(() => {
      lightspeed = new Lightspeed({
        clientId: 'client',
        clientSecret: 'secret',
        refreshToken: 'token',
      });
    });

    it('when no last response is available', async () => {
      const unitsToWait = await lightspeed.handleRateLimit({
        method: 'POST',
      });

      expect(unitsToWait).toBe(null);
    });

    it('when last response does not have the rate limit header', async () => {
      lightspeed.setLastResponse({
        headers: {},
      });

      const unitsToWait = await lightspeed.handleRateLimit({
        method: 'POST',
      });

      expect(unitsToWait).toBe(null);
    });

    it('when available units are enough', async () => {
      lightspeed.setLastResponse({
        headers: {
          'x-ls-api-bucket-level': '60/180',
        },
      });

      const unitsToWait = await lightspeed.handleRateLimit({
        method: 'POST',
      });

      expect(unitsToWait).toBe(0);
    });

    it('when available units are not enough', async () => {
      lightspeed.setLastResponse({
        headers: {
          'x-ls-api-bucket-level': '81/90',
        },
      });

      const unitsToWait = await lightspeed.handleRateLimit({
        method: 'POST',
      });

      expect(unitsToWait).toBe(1);
    });
  });

  it('generates access token', async () => {
    const lightspeed = new Lightspeed({
      clientId: 'client',
      clientSecret: 'secret',
      refreshToken: 'token',
    });

    nock('https://cloud.merchantos.com')
      .persist()
      .post(/.*/, (body) => true)
      .reply(200, {
        access_token: 'access_token',
        expires_in: 1800,
        token_type: 'bearer',
        scope: 'employee:all',
      });

    const token = await lightspeed.getToken();

    expect(token.access_token).toEqual('access_token');
  });
});
