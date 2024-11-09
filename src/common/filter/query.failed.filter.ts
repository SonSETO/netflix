import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { timeStamp } from 'console';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // forbidden은 status를 가지고 있지만 QueryFailedError는 typeorm에서 가져오는거라 없어서 임의적으로 만들어줘야 함
    const status = 400;

    let message = '데이터베이스 에러 발생!';

    if (exception.message.includes('duplicate key')) {
      message = '중복 키 에러!';
    }

    response.status(status).json({
      statusCode: status,
      timeStamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
