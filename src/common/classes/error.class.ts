export class BaseHttpError extends Error {
  statusCode: number;
  error: string;

  constructor(message: string, status: number) {
    super(message);
    this.error = this.constructor.name;
    this.statusCode = status;
  }
}

export class BadRequestError extends BaseHttpError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends BaseHttpError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddeError extends BaseHttpError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends BaseHttpError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends BaseHttpError {
  constructor(message: string) {
    super(message, 409);
  }
}
