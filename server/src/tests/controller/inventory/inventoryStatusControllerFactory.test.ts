import assert from 'assert';
import { makeInventoryStatusController } from '../../../controller/inventory/inventoryStatusControllerFactory';
import { test } from '../../testHarness';

// Mock use cases
const mockUseCases = {
    list: {
        execute: async () => [
            { code: 'A', description: 'Available', isTerminal: false, sortOrder: 10, active: true }
        ]
    },
    create: {
        execute: async (data: any) => ({
            code: data.code,
            description: data.description,
            isTerminal: data.isTerminal || false,
            sortOrder: 10,
            active: true
        })
    },
    deactivate: {
        execute: async (code: string) => code === 'A' // Return boolean
    }
};

function createMockRequest(params = {}, body = {}) {
    return { params, body } as any;
}

function createMockResponse() {
    const res: any = {
        status: function(code: number) { this.statusCode = code; return this; },
        json: function(data: any) { this.jsonData = data; return this; },
        send: function(data?: any) { this.sentData = data; return this; }
    };
    return res;
}

test('inventoryStatusController: list statuses', async () => {
    const controller = makeInventoryStatusController(mockUseCases as any);
    const req = createMockRequest();
    const res = createMockResponse();

    await controller.list(req, res, () => {});

    assert(Array.isArray(res.jsonData));
    assert.strictEqual(res.jsonData[0].code, 'A');
});

test('inventoryStatusController: create status', async () => {
    const controller = makeInventoryStatusController(mockUseCases as any);
    const req = createMockRequest({}, { code: 'TEST', description: 'Test Status' });
    const res = createMockResponse();

    await controller.create(req, res, () => {});

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonData.code, 'TEST');
});

test('inventoryStatusController: deactivate existing status', async () => {
    const controller = makeInventoryStatusController(mockUseCases as any);
    const req = createMockRequest({ code: 'A' });
    const res = createMockResponse();

    await controller.deactivate(req, res, () => {}); // ✅ Use 'deactivate' instead of 'remove'

    assert.strictEqual(res.statusCode, 204);
});

test('inventoryStatusController: deactivate non-existing status', async () => {
    const controller = makeInventoryStatusController(mockUseCases as any);
    const req = createMockRequest({ code: 'NONEXISTENT' });
    const res = createMockResponse();

    await controller.deactivate(req, res, () => {}); // ✅ Use 'deactivate' instead of 'remove'

    assert.strictEqual(res.statusCode, 404);
});
