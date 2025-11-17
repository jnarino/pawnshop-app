import express from 'express';
import { validateJwt } from '../middleware/auth';
import { logger } from '../../log/logger';

const router = express.Router();

// ✅ Lazy load to avoid circular dependencies
const getController = () => {
  try {
    const { inventoryController } = require('../../../container');
    if (!inventoryController) {
      throw new Error('inventoryController not initialized');
    }
    return inventoryController;
  } catch (error) {
    logger.error('Failed to get inventory controller', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
};

// ✅ Wrap all routes with error handling
router.get('/', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    if (typeof controller.list !== 'function') {
      throw new Error('controller.list is not a function');
    }
    return controller.list(req, res, next);
  } catch (error) {
    logger.error('inventory_list_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to list inventory items' });
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
    logger.error('inventory_create_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

router.get('/:id', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    if (typeof controller.get !== 'function') {
      throw new Error('controller.get is not a function');
    }
    return controller.get(req, res, next);
  } catch (error) {
    logger.error('inventory_get_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to get inventory item' });
  }
});

router.put('/:id', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    if (typeof controller.update !== 'function') {
      throw new Error('controller.update is not a function');
    }
    return controller.update(req, res, next);
  } catch (error) {
    logger.error('inventory_update_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

router.delete('/:id', validateJwt, async (req, res, next) => {
  try {
    const controller = getController();
    if (typeof controller.delete !== 'function') {
      throw new Error('controller.delete is not a function');
    }
    return controller.delete(req, res, next);
  } catch (error) {
    logger.error('inventory_delete_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

export default router;
