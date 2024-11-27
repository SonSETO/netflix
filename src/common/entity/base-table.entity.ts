import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export class BaseTable {
  @CreateDateColumn()
  @Exclude()
  @ApiHideProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  @ApiHideProperty()
  updatedAt: Date;

  @Exclude()
  @ApiHideProperty()
  @VersionColumn()
  version: number;
}
