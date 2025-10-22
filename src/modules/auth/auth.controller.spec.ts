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
            findAll: jest.fn()
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

  describe("signIn", () => {
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
});
