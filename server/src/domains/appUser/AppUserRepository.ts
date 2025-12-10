import { AppUser } from './AppUser';

export interface AppUserRepository {
  findByUsername(username: string): Promise<AppUser | null>;
  findById(id: string): Promise<AppUser | null>;
  listAll(): Promise<AppUser[]>;
  create(user: AppUser): Promise<AppUser>;
  update(user: AppUser): Promise<AppUser>;
  delete(id: string): Promise<void>;
}
