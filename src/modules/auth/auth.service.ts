import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { UpdateAuthDto } from "./dto/update-auth.dto";
import { UserService } from "../user/user.service";
import { JwtService } from "@nestjs/jwt";
import { jwtConstants } from "./constants";
import { ConfigService } from "@nestjs/config";
import { UserResponseDto } from "../user/dto/response-user.dto";
import { plainToInstance } from "class-transformer";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  private readonly secret: string;
  private readonly refreshSecret: string;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    this.secret = this.configService.get("JWT_SECRET");
    this.refreshSecret = this.configService.get("REFRESH_SECRET");
  }

  findAll() {
    return `This action returns all auth`;
  }

  async validateUser(username: string, password: string) {
    const user = await this.userService.findbyUsername(username);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.validateUser(username, pass);
    if (!user) throw new BadRequestException("Username or password incorect.");

    // ✅ Transform before returning
    const userResponse = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true // only include @Expose() fields
    });

    const { password, ...result } = user;
    const payload = { sub: user.userId, username: user.username };

    // Create both tokens
    const expiresIn = this.configService.get("JWT_EXPIRES_IN");
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.secret,
      expiresIn: expiresIn
    });

    const refreshExpired = this.configService.get("REFRESH_EXPIRES_IN");
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: refreshExpired
    });

    return {
      user: userResponse,
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const expiresIn = this.configService.get("JWT_EXPIRES_IN");
      const refreshExpired = this.configService.get("REFRESH_EXPIRES_IN");

      const payload = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret
      });

      const newAccessToken = await this.jwtService.signAsync(
        { sub: payload.sub, username: payload.username },
        { expiresIn: expiresIn }
      );

      const newRefreshToken = await this.jwtService.signAsync(
        { sub: payload.sub, username: payload.username },
        { secret: this.refreshSecret, expiresIn: refreshExpired }
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken
      };
    } catch (error) {
      console.log("refreshToken error:: ", error.message);
      throw new ForbiddenException("Invalid or expired refresh token");
    }
  }
}
