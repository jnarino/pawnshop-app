import express from 'express';
import { validateJwt } from '../middleware/auth';
import { logger } from '../../log/logger';

const router = express.Router();

// ✅ Lazy load to avoid circular dependencies and validate controller exists
const getController = () => {
  try {
    const { inventoryStatusController } = require('../../../container');
    if (!inventoryStatusController) {
      throw new Error('inventoryStatusController not initialized');
    }
    return inventoryStatusController;
  } catch (error) {
    logger.error('Failed to get inventory status controller', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

// ✅ Wrap all routes with error handling and controller validation
router.get('/', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    if (typeof controller.list !== 'function') {
      throw new Error('controller.list is not a function');
    }
    return controller.list(req, res, next);
  } catch (error) {
    logger.error('inventory_status_list_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to list inventory statuses' });
  }
});

router.post('/', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    if (typeof controller.create !== 'function') {
      throw new Error('controller.create is not a function');
    }
    return controller.create(req, res, next);
  } catch (error) {
    logger.error('inventory_status_create_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to create inventory status' });
  }
});

router.delete('/:code', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    if (typeof controller.deactivate !== 'function') {
      throw new Error('controller.deactivate is not a function');
    }
    return controller.deactivate(req, res, next);
  } catch (error) {
    logger.error('inventory_status_delete_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to deactivate inventory status' });
  }
});

export default router;
