import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

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
            findAll: jest.fn().mockResolvedValue([
              { userId: 1, username: "john", password: "1111" },
              { userId: 2, username: "maria", password: "1234" }
            ]),
            findById: jest
              .fn()
              .mockImplementation((id) =>
                Promise.resolve(
                  id === 1
                    ? { userId: 1, username: "john", password: "1111" }
                    : { userId: 2, username: "maria", password: "1234" }
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
        {
          userId: 1,
          username: "john",
          password: "1111"
        },
        {
          userId: 2,
          username: "maria",
          password: "1234"
        }
      ]);
      expect(userService.findAll).toHaveBeenCalledWith();
    });
  });

  describe("findOne", () => {
    it("should return a single user by id", async () => {
      const result = await controller.findOne("1");
      expect(result).toEqual({ userId: 1, username: "john", password: "1111" });
      expect(userService.findById).toHaveBeenCalledWith(1);
    });
  });
});
