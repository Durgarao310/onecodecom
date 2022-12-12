export interface Otp {
  _id: string;
  user: string;
  otp: number;
  expireAt: string;
}
