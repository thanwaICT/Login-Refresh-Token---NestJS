import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { ConflictException } from "@nestjs/common";

describe("UserController", () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn().mockResolvedValue([
              { _id: "some-mongo-id", userId: 1, username: "john", email: "john@email.com", password: "1111" },
              { _id: "some-mongo-id2", userId: 2, username: "maria", email: "maria@email.com", password: "1234" }
            ]),
            findById: jest
              .fn()
              .mockImplementation((id) =>
                Promise.resolve(
                  id === 1
                    ? { _id: "some-mongo-id", userId: 1, username: "john", email: "john@email.com", password: "1111" }
                    : { _id: "some-mongo-id2", userId: 2, username: "maria", email: "maria@email.com", password: "1234" }
                )
              )
          }
        }
      ]
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      const result = await controller.findAll();
      expect(result).toEqual([
        { _id: "some-mongo-id", userId: 1, username: "john", email: "john@email.com" },
        { _id: "some-mongo-id2", userId: 2, username: "maria", email: "maria@email.com" }
      ]);
      expect(userService.findAll).toHaveBeenCalledWith();
    });
  });

  describe("create", () => {
    it("should return a user data", async () => {
      // Mocked hashed password
      const mockHashedPassword = "hashed_1111";
      // Mock the service create method
      (userService.create as jest.Mock).mockResolvedValue({
        email: "john@email.com",
        username: "john",
        password: mockHashedPassword,
        _id: "mockid123"
      });

      const body = { email: "john@email.com", username: "john", password: "1111" };
      const result = await controller.createUser(body, {} as any);
      // expect(result).toEqual({ userId: 1, username: "john", password: "1111" });
      expect(result).toEqual({
        new_user: {
          email: "john@email.com",
          username: "john",
          password: mockHashedPassword,
          _id: "mockid123"
        }
      });

      expect(userService.create).toHaveBeenCalledWith(body.email, body.username, body.password);
    });

    it("should throw ConflictException if username exists", async () => {
      (userService.create as jest.Mock).mockRejectedValue(new ConflictException("Username already exists"));

      const body = { email: "john@email.com", username: "john", password: "1111" };
      await expect(controller.createUser(body, {} as any)).rejects.toThrow(ConflictException);

      expect(userService.create).toHaveBeenCalledWith(body.email, body.username, body.password);
    });
  });
});
