"use strict";
/**
 * Unit tests for the F7 Deterministic Validation Layer (AiExtractionService.validateAndCollect)
 * and the P1 cache hash function (cacheService.computeCsvHash).
 *
 * These are the highest-value deterministic targets — they enforce the CRM business rules
 * independently of any AI output, so they should be testable without mocking Gemini.
 *
 * We access validateAndCollect via a test subclass since it's a private method.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const aiExtractionService_1 = require("../src/services/aiExtractionService");
const cacheService_1 = require("../src/services/cacheService");
// ─── Test Harness ───────────────────────────────────────────────────────────
// Expose the private validateAndCollect method for direct unit testing
// without needing to mock a full Gemini API roundtrip.
class TestableAiExtractionService extends aiExtractionService_1.AiExtractionService {
    testValidateAndCollect(rawRow, rowIndex, extracted, parsedList, skippedList) {
        return this.validateAndCollect(rawRow, rowIndex, extracted, parsedList, skippedList);
    }
}
// Minimal stub AIProvider that is never called in these unit tests
const stubProvider = { extractBatch: jest.fn() };
const service = new TestableAiExtractionService(stubProvider);
function run(extracted, rawRow = {}) {
    const parsed = [];
    const skipped = [];
    service.testValidateAndCollect(rawRow, 0, extracted, parsed, skipped);
    return { parsed, skipped };
}
// ─── Skip Rule Tests ─────────────────────────────────────────────────────────
describe('F7 Skip Rule: no email AND no mobile', () => {
    test('skips record when both email and mobile are absent', () => {
        const { parsed, skipped } = run({ name: 'Ramesh Kumar' });
        expect(parsed).toHaveLength(0);
        expect(skipped).toHaveLength(1);
        expect(skipped[0].reason).toMatch(/missing both/i);
    });
    test('keeps record when only email is present', () => {
        const { parsed } = run({ email: 'ramesh@example.com' });
        expect(parsed).toHaveLength(1);
        expect(parsed[0].email).toBe('ramesh@example.com');
    });
    test('keeps record when only mobile is present', () => {
        const { parsed } = run({ mobile_without_country_code: '9876543210' });
        expect(parsed).toHaveLength(1);
        expect(parsed[0].mobile_without_country_code).toBe('9876543210');
    });
    test('skips record when extracted is null (AI explicitly rejected)', () => {
        const { parsed, skipped } = run(null);
        expect(parsed).toHaveLength(0);
        expect(skipped).toHaveLength(1);
        expect(skipped[0].reason).toMatch(/skipped by ai/i);
    });
    test('recovers email from raw row when AI misses it', () => {
        // AI returns blank email but raw row has "Email" column
        const rawRow = { Email: 'fallback@example.com' };
        const { parsed } = run({ name: 'Test User' }, rawRow);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].email).toBe('fallback@example.com');
    });
    test('recovers mobile from raw row when AI misses it', () => {
        const rawRow = { Phone: '9123456789' };
        const { parsed } = run({ name: 'Test User' }, rawRow);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].mobile_without_country_code).toBe('9123456789');
    });
});
// ─── crm_status Enum Sanitization ───────────────────────────────────────────
describe('F7 crm_status enum sanitization', () => {
    const validStatuses = [
        'GOOD_LEAD_FOLLOW_UP',
        'DID_NOT_CONNECT',
        'BAD_LEAD',
        'SALE_DONE',
    ];
    validStatuses.forEach((status) => {
        test(`keeps valid status: ${status}`, () => {
            const { parsed } = run({ email: 'a@b.com', crm_status: status });
            expect(parsed[0].crm_status).toBe(status);
        });
    });
    test('clears invalid crm_status to empty string', () => {
        const { parsed } = run({ email: 'a@b.com', crm_status: 'INTERESTED' });
        expect(parsed[0].crm_status).toBe('');
    });
    test('is case-insensitive for valid statuses', () => {
        const { parsed } = run({ email: 'a@b.com', crm_status: 'bad_lead' });
        expect(parsed[0].crm_status).toBe('BAD_LEAD');
    });
    test('clears completely unknown junk status', () => {
        const { parsed } = run({ email: 'a@b.com', crm_status: 'HOT_PROSPECT' });
        expect(parsed[0].crm_status).toBe('');
    });
});
// ─── data_source Enum Sanitization ──────────────────────────────────────────
describe('F7 data_source enum sanitization', () => {
    const validSources = [
        'leads_on_demand',
        'meridian_tower',
        'eden_park',
        'varah_swamy',
        'sarjapur_plots',
    ];
    validSources.forEach((source) => {
        test(`keeps valid data_source: ${source}`, () => {
            const { parsed } = run({ email: 'a@b.com', data_source: source });
            expect(parsed[0].data_source).toBe(source);
        });
    });
    test('clears invalid data_source to empty string', () => {
        const { parsed } = run({ email: 'a@b.com', data_source: 'facebook' });
        expect(parsed[0].data_source).toBe('');
    });
    test('is case-insensitive for valid sources', () => {
        const { parsed } = run({ email: 'a@b.com', data_source: 'EDEN_PARK' });
        expect(parsed[0].data_source).toBe('eden_park');
    });
});
// ─── Date Parseability ──────────────────────────────────────────────────────
describe('F7 created_at date parseability', () => {
    test('accepts ISO date string and normalizes format', () => {
        const { parsed } = run({ email: 'a@b.com', created_at: '2024-01-15T00:00:00Z' });
        expect(parsed[0].created_at).toBeDefined();
        expect(parsed[0].created_at).toMatch(/^2024-01-15/);
    });
    test('accepts human-readable date string', () => {
        const { parsed } = run({ email: 'a@b.com', created_at: '15 Jan 2024' });
        expect(parsed[0].created_at).toBeDefined();
        expect(parsed[0].created_at).not.toBe('');
    });
    test('clears unparseable date string to empty', () => {
        const { parsed } = run({ email: 'a@b.com', created_at: 'not-a-date-xyz' });
        expect(parsed[0].created_at).toBeUndefined();
    });
    test('passes through empty created_at unchanged', () => {
        const { parsed } = run({ email: 'a@b.com', created_at: '' });
        expect(parsed[0].created_at).toBeUndefined();
    });
});
// ─── Cache Hash Function ─────────────────────────────────────────────────────
describe('P1 computeCsvHash consistency', () => {
    const headers = ['Name', 'Email', 'Phone'];
    const rows = [
        { Name: 'Ramesh Kumar', Email: 'ramesh@example.com', Phone: '9876543210' },
        { Name: 'Priya Sharma', Email: 'priya@example.com', Phone: '9123456789' },
    ];
    test('same content produces same hash', () => {
        expect((0, cacheService_1.computeCsvHash)(headers, rows)).toBe((0, cacheService_1.computeCsvHash)(headers, rows));
    });
    test('hash is consistent across multiple calls', () => {
        const h1 = (0, cacheService_1.computeCsvHash)(headers, rows);
        const h2 = (0, cacheService_1.computeCsvHash)(headers, rows);
        const h3 = (0, cacheService_1.computeCsvHash)(headers, rows);
        expect(h1).toBe(h2);
        expect(h2).toBe(h3);
    });
    test('headers with different casing produce the same hash (normalized)', () => {
        const uppercaseHeaders = ['NAME', 'EMAIL', 'PHONE'];
        const uppercaseRows = [
            { NAME: 'Ramesh Kumar', EMAIL: 'ramesh@example.com', PHONE: '9876543210' },
            { NAME: 'Priya Sharma', EMAIL: 'priya@example.com', PHONE: '9123456789' },
        ];
        expect((0, cacheService_1.computeCsvHash)(uppercaseHeaders, uppercaseRows)).toBe((0, cacheService_1.computeCsvHash)(headers, rows));
    });
    test('different content produces different hash', () => {
        const altRows = [
            { Name: 'Different Name', Email: 'different@example.com', Phone: '0000000000' },
        ];
        expect((0, cacheService_1.computeCsvHash)(headers, altRows)).not.toBe((0, cacheService_1.computeCsvHash)(headers, rows));
    });
    test('extra whitespace in values is normalized (same hash)', () => {
        const spacedRows = [
            { Name: '  Ramesh Kumar  ', Email: '  ramesh@example.com  ', Phone: '  9876543210  ' },
            { Name: '  Priya Sharma  ', Email: '  priya@example.com  ', Phone: '  9123456789  ' },
        ];
        expect((0, cacheService_1.computeCsvHash)(headers, spacedRows)).toBe((0, cacheService_1.computeCsvHash)(headers, rows));
    });
    test('returns a 64-char hex SHA-256 string', () => {
        const hash = (0, cacheService_1.computeCsvHash)(headers, rows);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
});
