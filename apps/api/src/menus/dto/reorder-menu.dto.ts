import { IsString, IsNotEmpty } from 'class-validator';

export class ReorderMenuDto {
  @IsString()
  @IsNotEmpty()
  direction: 'up' | 'down';
}
