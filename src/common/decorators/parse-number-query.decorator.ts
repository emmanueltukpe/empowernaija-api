import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to parse query parameters as numbers
 * Usage: @ParseNumberQuery('year') year: number
 */
export const ParseNumberQuery = createParamDecorator(
  (paramName: string, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const value = request.query[paramName];
    
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    
    const parsed = Number(value);
    return isNaN(parsed) ? undefined : parsed;
  },
);

