import { Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { UpdateAuthDto } from "./dto/update-auth.dto";
import { UserService } from "../user/user.service";
import { JwtService } from "@nestjs/jwt";
import { jwtConstants } from "./constants";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  private readonly secret: string;
  private readonly refreshSecret: string;
  private readonly secretExpired: string;
  private readonly refreshExpired: string;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    this.secret = this.configService.get("JWT_SECRET");
    this.secretExpired = this.configService.get("JWT_EXPIRES_IN");

    this.refreshSecret = this.configService.get("REFRESH_SECRET");
    this.refreshExpired = this.configService.get("REFRESH_EXPIRES_IN");
  }

  findAll() {
    return `This action returns all auth`;
  }

  async signIn(username: string, pass: string): Promise<any> {
    console.log("username:: ", username, "pass: ", pass);
    const user = await this.userService.findOne(username);
    console.log("user:: ", user);

    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }

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
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const expiresIn = this.configService.get("JWT_EXPIRES_IN");
      const refreshExpired = this.configService.get("REFRESH_EXPIRES_IN");

      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtConstants.refreshSecret
      });

      const newAccessToken = await this.jwtService.signAsync(
        { sub: payload.sub, username: payload.username },
        { expiresIn: expiresIn }
      );

      const newRefreshToken = await this.jwtService.signAsync(
        { sub: payload.sub, username: payload.username },
        { secret: jwtConstants.refreshSecret, expiresIn: refreshExpired }
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken
      };
    } catch (error) {
      throw new ForbiddenException("Invalid or expired refresh token");
    }
  }
}
