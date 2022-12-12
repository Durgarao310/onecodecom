import { Otp } from '@/interfaces/otps.interface';
import { model, Schema, Document } from 'mongoose';

const otpSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  expireAt: { type: Date, expires: 60, default: Date.now },
  otp: Number,
});

otpSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject._v;
  },
});

const otpModel = model<Otp & Document>('Otp', otpSchema);

export default otpModel;
