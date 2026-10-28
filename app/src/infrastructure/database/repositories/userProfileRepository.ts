import type {
  SessionManager,
  UserSession,
} from '../../../services/session/sessionManager';
import { readText, type SqlExecutor } from '../sqlDatabase';
import { OwnedRepository } from './ownedRepository';

export type UserProfile = {
  userId: string;
  documentTypeCode: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
};

export class UserProfileRepository extends OwnedRepository {
  constructor(executor: SqlExecutor, sessions: SessionManager) {
    super(executor, sessions);
  }

  async getOwnProfile(session: UserSession): Promise<UserProfile | null> {
    const userId = this.ownerOf(session);
    const result = await this.executor.execute(
      `SELECT id, document_type_code, document_number, first_name, last_name, email,
         phone_country_code, phone_number
       FROM users WHERE id = ?`,
      [userId],
    );
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      userId: readText(row, 'id'),
      documentTypeCode: readText(row, 'document_type_code'),
      documentNumber: readText(row, 'document_number'),
      firstName: readText(row, 'first_name'),
      lastName: readText(row, 'last_name'),
      email: readText(row, 'email'),
      phoneCountryCode: readText(row, 'phone_country_code'),
      phoneNumber: readText(row, 'phone_number'),
    };
  }
}
