import { Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { CreateAuthDto } from "./dto/create-auth.dto";
import { UpdateAuthDto } from "./dto/update-auth.dto";
import { UserService } from "../user/user.service";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

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
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: "access_secret_key",
      expiresIn: "15s"
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: "refresh_secret_key",
      expiresIn: "7d"
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: "refresh_secret_key"
      });

      const newAccessToken = await this.jwtService.signAsync(
        { sub: payload.sub, username: payload.username },
        {
          secret: "access_secret_key",
          expiresIn: "15s"
        }
      );

      return { access_token: newAccessToken };
    } catch (error) {
      throw new ForbiddenException("Invalid or expired refresh token");
    }
  }
}
