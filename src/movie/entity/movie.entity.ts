import { Exclude, Expose, Transform } from 'class-transformer';

// @Exclude()
// 보안에 민감할 때 노출시키지 않을 수 있다
// @Expose()
// 애는 노출시킴

// @Transform(({ value }) => 'ㅁㄴㅇ')
// 전부 ''안의 값으로 하겠다

// @Transform(({ value }) => value.toString().toUpperCase())
// 전부 대문자로 바꾸겠다

export class Movie {
  id: number;

  title: string;

  genre: string;
}
