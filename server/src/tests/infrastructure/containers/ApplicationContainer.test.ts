import assert from 'assert';
import { ApplicationContainer } from '../../../infrastructure/containers/ApplicationContainer';
import { test } from '../../testHarness';

test('ApplicationContainer: is singleton', () => {
    const container1 = ApplicationContainer.getInstance();
    const container2 = ApplicationContainer.getInstance();
    
    assert.strictEqual(container1, container2);
});

test('ApplicationContainer: provides customer container', () => {
    const container = ApplicationContainer.getInstance();
    const customerContainer = container.customer;
    
    assert(customerContainer);
    assert(typeof customerContainer.getController === 'function');
    assert(typeof customerContainer.getRepository === 'function');
    assert(typeof customerContainer.getUseCases === 'function');
});

test('ApplicationContainer: provides inventory container', () => {
    const container = ApplicationContainer.getInstance();
    const inventoryContainer = container.inventory;
    
    assert(inventoryContainer);
    assert(typeof inventoryContainer.getController === 'function');
    assert(typeof inventoryContainer.getRepository === 'function');
    assert(typeof inventoryContainer.getUseCases === 'function');
    assert(typeof inventoryContainer.getStatusController === 'function');
});

test('ApplicationContainer: provides pawn ticket container', () => {
    const container = ApplicationContainer.getInstance();
    const pawnTicketContainer = container.pawnTicket;
    
    assert(pawnTicketContainer);
    assert(typeof pawnTicketContainer.getController === 'function');
    assert(typeof pawnTicketContainer.getRepository === 'function');
    assert(typeof pawnTicketContainer.getUseCases === 'function');
});

test('ApplicationContainer: provides category container', () => {
    const container = ApplicationContainer.getInstance();
    const categoryContainer = container.category;
    
    assert(categoryContainer);
    assert(typeof categoryContainer.getController === 'function');
    assert(typeof categoryContainer.getCache === 'function');
    assert(typeof categoryContainer.getUseCases === 'function');
});

test('ApplicationContainer: provides payment container', () => {
    const container = ApplicationContainer.getInstance();
    const paymentContainer = container.payment;
    
    assert(paymentContainer);
    assert(typeof paymentContainer.getController === 'function');
    assert(typeof paymentContainer.getUseCases === 'function');
});
