import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { ConfigService } from "@nestjs/config";

describe("AuthService", () => {
  let service: AuthService;
  // let jwt: JwtStrategy;
  // let user: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn()
          }
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === "JWT_SECRET") return "test_secret";
              if (key === "JWT_EXPIRES_IN") return "60s";
            }),
          },
        },
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    // jwt = module.get<JwtStrategy>(JwtStrategy);
    // user = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
