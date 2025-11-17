import express from 'express';
import { validateJwt } from '../middleware/auth';
import { logger } from '../../log/logger';

const router = express.Router();

// ✅ Lazy load to avoid circular dependencies
const getController = () => {
  try {
    const { customerController } = require('../../../container');
    if (!customerController) {
      throw new Error('customerController not initialized');
    }
    return customerController;
  } catch (error) {
    logger.error('Failed to get customer controller', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

router.get('/', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    return controller.list(req, res, next);
  } catch (error) {
    logger.error('customer_list_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to list customers' });
  }
});

router.post('/', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    return controller.create(req, res, next);
  } catch (error) {
    logger.error('customer_create_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.get('/:id', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    return controller.get(req, res, next);
  } catch (error) {
    logger.error('customer_get_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to get customer' });
  }
});

router.put('/:id', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    return controller.update(req, res, next);
  } catch (error) {
    logger.error('customer_update_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to update customer' });
  }
});

router.delete('/:id', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    return controller.delete(req, res, next);
  } catch (error) {
    logger.error('customer_delete_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;