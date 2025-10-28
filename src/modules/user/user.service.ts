import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  // private readonly users = [
  //   {
  //     userId: 1,
  //     username: "john",
  //     password: "1111"
  //   },
  //   {
  //     userId: 2,
  //     username: "maria",
  //     password: "1234"
  //   }
  // ];

  async create(email: string, username: string, password: string): Promise<User | any> {
    const checkUserName = await this.findbyUsername(username);
    if (checkUserName) throw new ConflictException("Username already exists");

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('hashedPassword:: ',hashedPassword);
    
    const newUser = new this.userModel({ email, username, password: hashedPassword });
    return newUser.save();
  }

  async findOne(username: string, password: string): Promise<User | null> {
    return this.userModel.findOne({ username, password }).exec();
  }

  async findbyUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
