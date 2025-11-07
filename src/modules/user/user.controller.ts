import { Controller, Get, UseGuards, Post, Body, Patch, Param, Delete, Res } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/auth.guard";
import { UserResponseDto } from "../user/dto/response-user.dto";
import { plainToInstance } from "class-transformer";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    const userData = await this.userService.findAll();
    // ✅ Transform before returning
    const userResponse = plainToInstance(UserResponseDto, userData, {
      excludeExtraneousValues: true // only include @Expose() fields
    });

    return userResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createUser(@Body() body: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const new_user = await this.userService.create(body.email, body.username, body.password);
    return { new_user: new_user };
  }
}
