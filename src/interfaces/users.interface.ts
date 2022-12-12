export interface User {
  _id: string;
  email: string;
  password?: string;
  verify: boolean;
  token: string;
}
