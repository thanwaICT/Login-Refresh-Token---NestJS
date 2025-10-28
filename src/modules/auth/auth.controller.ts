import { Controller, Get, Post, Body, Req, Patch, Param, Delete, HttpCode, HttpStatus, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { UpdateAuthDto } from "./dto/update-auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post("login")
  async signIn(@Body() signInDto: Record<string, any>, @Res({ passthrough: true }) res: Response) {
    const loginData = await this.authService.signIn(signInDto.username, signInDto.password);

    res.cookie("refresh_token", loginData.refresh_token, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return { user: loginData.user, access_token: loginData.access_token };
  }

  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies["refresh_token"];
    const newAccessTk = await this.authService.refreshToken(refreshToken);

    res.cookie("refresh_token", newAccessTk.refresh_token, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return { access_token: newAccessTk.access_token };
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }
}
