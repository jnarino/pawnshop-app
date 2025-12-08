// src/interfaces/http/controller/AppUserController.ts
import { Response, NextFunction } from 'express';
import { ListAppUserUseCase } from '../../../../application/use-case/appUser/query/ListAppUserUseCase';

import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { Actor } from '../../../../application/common/Actor';
import { CreateAppUserUseCase } from '../../../../application/use-case/appUser/command/CreateAppUserUseCase';
import { DeleteAppUserUseCase } from '../../../../application/use-case/appUser/command/DeleteAppUserUseCase';
import { UpdateAppUserUseCase } from '../../../../application/use-case/appUser/command/UpdateAppUserUseCase';

export class AppUserController {
  constructor(
    private readonly listUseCase: ListAppUserUseCase,
    private readonly createUseCase: CreateAppUserUseCase,
    private readonly updateUseCase: UpdateAppUserUseCase,
    private readonly deleteUseCase: DeleteAppUserUseCase
  ) { }

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const users = await this.listUseCase.execute(actor);
      return res.json(users);
    } catch (err) {
      return next(err);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const user = await this.createUseCase.execute(actor, req.body);
      return res.status(201).json(user);
    } catch (err) {
      return next(err);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      const payload = { ...req.body, id: req.params.id };
      const user = await this.updateUseCase.execute(actor, payload);
      return res.json(user);
    } catch (err) {
      return next(err);
    }
  };

  remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = this.getActor(req);
      await this.deleteUseCase.execute(actor, req.params.id);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  };

  private getActor(req: AuthenticatedRequest): Actor {
    if (!req.user) {
      throw new Error('Missing authenticated user');
    }
    return {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    };
  }
}
