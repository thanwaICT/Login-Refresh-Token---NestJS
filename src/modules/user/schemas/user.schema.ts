import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ default: uuidv4, unique: true })
  userId: string;

  @Prop({ required: true })
  email?: string;

  @Prop()
  username?: string;

  @Prop({ required: true })
  password?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
