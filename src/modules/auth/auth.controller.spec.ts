import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn(),
            refreshToken: jest.fn(),
            findAll: jest.fn().mockResolvedValue("This action returns all auth")
          }
        }
      ]
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("login", () => {
    it("should call AuthService.signIn and return tokens", async () => {
      const mockTokens = { access_token: "access", refresh_token: "refresh" };
      jest.spyOn(authService, "signIn").mockResolvedValue(mockTokens);

      const result = await controller.signIn({ username: "john", password: "1111" }, {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any);
      expect(result).toEqual({ access_token: "access" });
      expect(authService.signIn).toHaveBeenCalledWith("john", "1111");
    });
  });

  describe("refresh", () => {
    it("should call AuthService.refreshToken and return new access tokens", async () => {
      const mockTokens = { access_token: "access", refresh_token: "refresh" };
      jest.spyOn(authService, "refreshToken").mockResolvedValue(mockTokens);

      // Mocked request object with cookies
      const mockReq: any = {
        cookies: {
          refresh_token: "old_refresh_token"
        }
      };

      // Mocked response object
      const mockRes: any = {
        cookie: jest.fn() // mock cookie function
      };

      const result = await controller.refresh(mockReq, mockRes);
      expect(result).toEqual({ access_token: "access" });
      // Should call refreshToken with the correct refresh token
      expect(authService.refreshToken).toHaveBeenCalledWith("old_refresh_token");

      // Should set the new refresh token in cookies
      expect(mockRes.cookie).toHaveBeenCalledWith("refresh_token", "refresh", expect.any(Object));
    });
  });

  describe("findall", () => {
    it("should call AuthService.findAll and return message", async () => {
      const result = await controller.findAll();
      expect(result).toEqual("This action returns all auth");
    });
  });
});
