import {
  Contains,
  Equals,
  IsAlphanumeric,
  IsArray,
  IsBoolean,
  IsCreditCard,
  IsDate,
  IsDateString,
  IsDefined,
  IsDivisibleBy,
  IsEmpty,
  IsEnum,
  IsHexColor,
  IsIn,
  IsInt,
  IsLatLong,
  IsNegative,
  IsNotEmpty,
  IsNotIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  NotContains,
  NotEquals,
  registerDecorator,
  Validate,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

enum MovieGenre {
  Fantasy = 'fantasy',
  Action = 'action',
}

// 커스텀 벨리데이터 해보기
@ValidatorConstraint({
  async: true,
})
class PassWordValidator implements ValidatorConstraintInterface {
  validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> | boolean {
    // 비밀번호 길이는 4-8
    return value.length > 4 && value.length < 8;
  }
  defaultMessage(validationArguments?: ValidationArguments): string {
    return '비밀번호의 길이는 4-8자여야 합니다. 현재 입력된 비밀번호: ($value)';
  }
}

function IsPasswordValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      // 타켓,프로퍼티네임,옵션은 디폴트로 들어감
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: PassWordValidator,
    });
  };
}

export class updateMovieDto {
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;

  //@IsDefined()
  // null || undefine인지를 확인

  //@IsOptional()
  // 있어도 그만 없어도 그만으로 만들어줌 옵셔널로

  //@Equals('code factory')
  // 안에 선언해 준 것만 가능

  //   @NotEquals('code factory')
  // 안에 선언해 준 것만 안된다

  //   @IsEmpty()
  // null || undefined || '' 3개의 보기것 만 가능

  //   @IsNotEmpty()
  //@IsEmpty()의 반대

  // Array
  //   @IsIn(['action', 'fantasy'])
  // 배열 안에 있는 것만 가능

  //   @IsNotIn(['action', 'fantasy'])
  // @IsIn(['action', 'fantasy']) 의 반대

  // type validator

  //   @IsBoolean()
  //   불리언이냐 아니냐 체크

  //   @IsString()
  //   문자열만 가능

  //   @IsNumber()
  //    숫자만 가능

  //   @IsInt()
  //   정수만 가능

  //   @IsArray()
  //   배열만 가능

  //   @IsEnum(MovieGenre)
  //   IsIn과 비슷하지만 IsIn은 1회성에 좀 더 어울리고 이넘은 편리하게 사용가능

  //   @IsDateString()
  // 문자열로 보내는 날짜

  //   @IsDivisibleBy(5)
  //   넣어준 값으로 나눠줄 수 있는가

  //   @IsPositive()
  //   양수인가

  // @IsNegative()
  // 음수인가

  // @Min(100)
  // 최소값

  // @Max(100)
  // 최대값

  // 문자열 타입
  //   @Contains('seto')
  //   ()무언가를 담고 있다

  //   @NotContains()
  //   ()무언가를 담고있지 않는 경우

  //   @IsAlphanumeric()
  //   알파벳과 숫자로 이뤄져 있냐

  // @IsCreditCard()
  // 카드번호인지 체크

  //   @IsHexColor()
  //   색깔 받을 때 16진수로

  // @MaxLength(16)
  // ()최대 길이

  //   @MinLength(4)
  //   ()최소 길이

  //   @IsUUID()
  //   UUID의 타입인지 체크할 수 있음

  //   @IsLatLong()
  //   위도 경도

  //   @Validate(PassWordValidator, {
  //     message: '다른 에러 메시지',
  //   })

  @IsPasswordValid()
  test: string;
}
