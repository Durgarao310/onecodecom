import { model, Schema, Document } from 'mongoose';
import { Room } from '@interfaces/rooms.interface';

const roomSchema: Schema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    users: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  { timestamps: true },
);

roomSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    delete returnedObject.__v;
  },
});

const roomModel = model<Room & Document>('Room', roomSchema);

export default roomModel;
