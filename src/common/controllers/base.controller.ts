import { User } from '../../users/entities/user.entity';

/**
 * Base controller class with common utility methods
 * All controllers can extend this class to inherit shared functionality
 */
export abstract class BaseController {
  /**
   * Extract user ID from authenticated user
   */
  protected getUserId(user: User): string {
    return user.id;
  }

  /**
   * Format success response with message
   */
  protected successResponse(message: string): { message: string } {
    return { message };
  }

  /**
   * Format delete success response
   */
  protected deleteSuccessResponse(entityName: string): { message: string } {
    return { message: `${entityName} deleted successfully` };
  }
}

