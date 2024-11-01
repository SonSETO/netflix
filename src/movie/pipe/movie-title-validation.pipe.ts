import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

// PipeTransform<> <= 여기엔 들어오는 값, 나가는 값에 대한 제너릭을 무조건 넣어줘야 함
@Injectable()
export class MovieTitleValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    // 만약 글자 길이가 2보다 작으면 에러 던지기

    if (!value) {
      return value;
    }

    if (value.length <= 2) {
      throw new BadRequestException('영화의 제목은 3자 이상 작성해주세요');
    }
    return value;
  }
}
