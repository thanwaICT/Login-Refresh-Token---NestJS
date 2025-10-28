import { Exclude, Expose } from "class-transformer";

@Exclude() // exclude all fields by default
export class UserResponseDto {
  @Expose()
  readonly _id: string;

  @Expose()
  readonly userId: string;

  @Expose()
  readonly email: string;

  @Expose()
  readonly username: string;

//   @Expose()
//   readonly createdAt: Date;

//   @Expose()
//   readonly updatedAt: Date;
}
