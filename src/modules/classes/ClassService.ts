import Logger from '../../shared/config/logger';
import { Class } from '../../shared/models';

const LOG = new Logger('ClassService.js');

export class ClassService {
  async updateClassByClassCode(
    classCode: string,
    updateName: string,
  ): Promise<void> {
    try {
      const classInstance = await Class.findOne({
        where: { code: classCode },
      });

      if (!classInstance) {
        throw new Error(`Class with code ${classCode} not found`);
      }

      await classInstance.update({ name: updateName });
    } catch (error) {
      LOG.error(
        `Error updating class with code ${classCode}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new Error(`Failed to update class with code ${classCode}`);
    }
  }
}
