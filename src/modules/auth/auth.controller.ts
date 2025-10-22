import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { UpdateAuthDto } from "./dto/update-auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post("login")
  async signIn(@Body() signInDto: Record<string, any>, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.signIn(signInDto.username, signInDto.password);

    res.cookie("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return { access_token: tokens.access_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(@Body("refresh_token") refreshToken: string, @Res({ passthrough: true }) res: Response) {
    const token = refreshToken;
    const newAccessTk = await this.authService.refreshToken(token);

    return newAccessTk;
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }
}
