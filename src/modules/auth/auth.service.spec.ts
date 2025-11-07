import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { ConfigService } from "@nestjs/config";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { UserResponseDto } from "../user/dto/response-user.dto";

// 1. Mock the external 'bcrypt' library
jest.mock("bcrypt", () => ({
  compare: jest.fn()
}));

// 2. Define a mock user for our tests
const mockUser = {
  // Add whatever properties your User object has
  _id: "user-id-123",
  userId: "user-id-123", // Assuming this is used in the payload
  email: "test@example.com",
  username: "testuser",
  password: "hashedpassword123"
  // We don't need .save() or other Mongoose methods
  // because the service layer shouldn't know about them.
  // The service layer gets a plain object from userService.
};

describe("AuthService", () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    // 3. Create a more complete set of mocks for our providers
    const mockUserService = {
      findbyUsername: jest.fn()
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verify: jest.fn()
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        // 4. Provide *all* keys the service needs
        if (key === "JWT_SECRET") return "test_jwt_secret";
        if (key === "REFRESH_SECRET") return "test_refresh_secret";
        if (key === "JWT_EXPIRES_IN") return "60s";
        if (key === "REFRESH_EXPIRES_IN") return "7d";
        return null;
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile();

    service = module.get<AuthService>(AuthService);
    // 5. Get instances of our mocks to use in tests
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // 6. Clear mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // --- Test validateUser() ---
  describe("validateUser", () => {
    it("should return the user if password matches", async () => {
      // ARRANGE
      (userService.findbyUsername as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // ACT
      const result = await service.validateUser("testuser", "password123");

      // ASSERT
      expect(userService.findbyUsername).toHaveBeenCalledWith("testuser");
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it("should return null if user is not found", async () => {
      // ARRANGE
      (userService.findbyUsername as jest.Mock).mockResolvedValue(null);

      // ACT
      const result = await service.validateUser("wronguser", "password123");

      // ASSERT
      expect(userService.findbyUsername).toHaveBeenCalledWith("wronguser");
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should return null if password does not match", async () => {
      // ARRANGE
      (userService.findbyUsername as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // ACT
      const result = await service.validateUser("testuser", "wrongpassword");

      // ASSERT
      expect(userService.findbyUsername).toHaveBeenCalledWith("testuser");
      expect(bcrypt.compare).toHaveBeenCalledWith("wrongpassword", mockUser.password);
      expect(result).toBeNull();
    });
  });

  // --- Test signIn() ---
  describe("signIn", () => {
    it("should return user and tokens on successful sign in", async () => {
      // ARRANGE
      // Mock the dependencies of validateUser
      (userService.findbyUsername as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock the tokens
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce("fake_access_token")
        .mockResolvedValueOnce("fake_refresh_token");

      // ACT
      const result = await service.signIn("testuser", "password123");

      // ASSERT
      // 7. Check that the returned user object is transformed (no password)
      expect(result.user).toBeInstanceOf(UserResponseDto);
      expect(result.user.password).toBeUndefined();
      expect(result.user.username).toBe("testuser");

      // 8. Check that the tokens are correct
      expect(result.access_token).toBe("fake_access_token");
      expect(result.refresh_token).toBe("fake_refresh_token");

      // 9. Check that jwtService was called with correct payloads
      const expectedPayload = { userId: mockUser.userId, username: mockUser.username };

      expect(jwtService.signAsync).toHaveBeenCalledWith(expectedPayload, {
        secret: "test_jwt_secret",
        expiresIn: "60s"
      });

      expect(jwtService.signAsync).toHaveBeenCalledWith(expectedPayload, {
        secret: "test_refresh_secret",
        expiresIn: "7d"
      });
    });

    it("should throw BadRequestException if validation fails", async () => {
      // ARRANGE
      // Mock validateUser to return null
      (userService.findbyUsername as jest.Mock).mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.signIn("testuser", "wrongpassword")).rejects.toThrow(BadRequestException);

      await expect(service.signIn("testuser", "wrongpassword")).rejects.toThrow("Username or password incorect.");
    });
  });

  // --- Test refreshToken() ---
  describe("refreshToken", () => {
    it("should return new tokens for a valid refresh token", async () => {
      // ARRANGE
      const mockPayload = { userId: mockUser.userId, username: mockUser.username };
      const oldRefreshToken = "valid_refresh_token";

      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce("new_access_token")
        .mockResolvedValueOnce("new_refresh_token");

      // ACT
      const result = await service.refreshToken(oldRefreshToken);

      // ASSERT
      expect(jwtService.verify).toHaveBeenCalledWith(oldRefreshToken, {
        secret: "test_refresh_secret"
      });

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result.access_token).toBe("new_access_token");
      expect(result.refresh_token).toBe("new_refresh_token");
    });

    it("should throw ForbiddenException if refresh token is invalid", async () => {
      // ARRANGE
      const invalidToken = "invalid_token";
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Token verification failed");
      });

      // ACT & ASSERT
      await expect(service.refreshToken(invalidToken)).rejects.toThrow(ForbiddenException);

      await expect(service.refreshToken(invalidToken)).rejects.toThrow("Invalid or expired refresh token");
    });
  });
});
