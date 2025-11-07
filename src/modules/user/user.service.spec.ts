import { Test, TestingModule } from "@nestjs/testing";
import { UserService } from "./user.service";
import * as bcrypt from "bcrypt";
import { Model } from "mongoose";
import { User } from "./schemas/user.schema";
import { getModelToken } from "@nestjs/mongoose";
import { ConflictException } from "@nestjs/common";

// 1. Mock the external 'bcrypt' library
jest.mock("bcrypt", () => ({
  hash: jest.fn()
}));

// 2. Define a mock user object for our tests
const mockUser = {
  _id: "some-mongo-id",
  email: "test@example.com",
  username: "testuser",
  password: "hashedpassword123",
  save: jest.fn() // We need to mock the .save() method
};

// 3. --- THIS IS THE MAIN FIX ---
// We will define our mock *type* to make TypeScript happy.
// It's a Model<User> AND each of its methods is a Jest Mock.
type MockModelType = Model<User> & {
  new: jest.Mock; // Mock the constructor
  findOne: jest.Mock;
  find: jest.Mock;
};
// --- END FIX ---

describe("UserService", () => {
  let service: UserService;
  let model: MockModelType; // Use our new mock type here

  // 3. Define the mock model provider
  // This object will simulate the Mongoose Model
  const mockUserModel = {
    new: jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue(mockUser) // Mock the save method
    })),
    findOne: jest.fn(),
    find: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          // 4. --- THIS IS THE OTHER PART OF THE FIX ---
          // Use 'Object.assign' to build a single mock object
          // that is both a constructor and has static methods.
          useValue: Object.assign(
            // A. The constructor part
            jest.fn().mockImplementation(() => ({
              save: jest.fn().mockResolvedValue(mockUser)
            })),
            // B. The static methods part
            {
              findOne: jest.fn(),
              find: jest.fn()
            }
          )
        }
      ]
    }).compile();

    service = module.get<UserService>(UserService);
    // 5. Get the mock from the module
    model = module.get<MockModelType>(getModelToken(User.name));

    // 5. Reset mocks before each test to ensure they are clean
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // --- Test the create() method ---
  describe("create", () => {
    it("should create a new user and return it", async () => {
      const email = "test@example.com";
      const username = "testuser";
      const password = "password123";
      const hashedPassword = "hashedpassword123";

      // --- ARRANGE ---

      // 7. Use the `model` variable (which is our mock)
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null) // User does not exist
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      // --- ACT ---
      const result = await service.create(email, username, password);

      // --- ASSERT ---
      // 8. Assert against the `model` variable
      expect(model.findOne).toHaveBeenCalledWith({ username });
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);

      // Check if the model constructor was called with the right data
      expect(model).toHaveBeenCalledWith({
        email,
        username,
        password: hashedPassword
      });

      // The result of create() is the result of newUser.save()
      expect(result).toEqual(mockUser);
    });

    it("should throw a ConflictException if username already exists", async () => {
      // --- ARRANGE ---
      model.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser) // User *does* exist
      });

      // --- ACT & ASSERT ---
      await expect(service.create("new@mail.com", "testuser", "password123")).rejects.toThrow(ConflictException);

      await expect(service.create("new@mail.com", "testuser", "password123")).rejects.toThrow(
        "Username already exists"
      );

      // Ensure we didn't try to hash a password or save a new user
      expect(bcrypt.hash).not.toHaveBeenCalled();
      // Check that the constructor was NOT called
      expect(model).not.toHaveBeenCalled();
    });
  });

  // --- Test the findAll() method ---
  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUserArray = [mockUser, mockUser];
      
      // --- ARRANGE ---
      model.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserArray),
      });

      // --- ACT ---
      const result = await service.findAll();

      // --- ASSERT ---
      expect(model.find).toHaveBeenCalled();
      expect(result).toEqual(mockUserArray);
    });
  });
});
