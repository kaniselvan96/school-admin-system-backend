import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

interface ValidationSchemas {
  params?: AnyZodObject;
  body?: AnyZodObject;
  query?: AnyZodObject;
}

const validate = (schemas: ValidationSchemas): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...formatErrors(result.error, 'params'));
      } else {
        req.params = result.data;
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...formatErrors(result.error, 'body'));
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...formatErrors(result.error, 'query'));
      } else {
        req.query = result.data;
      }
    }

    if (errors.length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: 'Validation failed', details: errors });
    }

    next();
  };
};

const formatErrors = (error: ZodError, source: string): string[] => {
  return error.issues.map(
    (issue) => `${source}.${issue.path.join('.')}: ${issue.message}`,
  );
};

export default validate;
