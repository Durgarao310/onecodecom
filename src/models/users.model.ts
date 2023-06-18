import { model, Schema, Document } from 'mongoose';
import { User } from '@interfaces/users.interface';

const userSchema: Schema = new Schema(
  {
    email: { type: String, trim: true, index: true, unique: true, sparse: true },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: null,
    }
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.password;
    delete returnedObject.__v;
    delete returnedObject.verify;
  },
});

const userModel = model<User & Document>('User', userSchema);

export default userModel;
