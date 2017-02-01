

export function httpStatusType(statusCode: number) {
    //tslint:disable-next-line:no-magic-numbers
    return Math.floor(statusCode / 100);
}

export const HTTP_STATUS_TYPE_INFO = 1;
export const HTTP_STATUS_TYPE_SUCCESS = 2;
export const HTTP_STATUS_TYPE_REDIRECTION = 3;
export const HTTP_STATUS_TYPE_CLIENT_ERROR = 4;
export const HTTP_STATUS_TYPE_SERVER_ERROR = 5;

export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_PARTIAL_CONTENT = 206;

export const HTTP_STATUS_ERROR = 400;
export const HTTP_STATUS_NOT_LOGGED_IN = 401;
export const HTTP_STATUS_UNAUTHORIZED = 403;
export const HTTP_STATUS_NOT_FOUND = 404;
export const HTTP_STATUS_WRONG_RANGE = 416;
export const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
