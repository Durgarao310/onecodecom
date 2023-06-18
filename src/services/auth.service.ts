/* eslint-disable @typescript-eslint/no-unused-vars */
import { sign, verify } from 'jsonwebtoken';
import { SECRET_KEY, REFRESH_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import userModel from '@models/users.model';
import { isEmpty } from '@utils/util';

class AuthService {
  public users = userModel;


    public async signup(userData: { email: string; password: string }): Promise<User> {

        
    }


  public async refreshToken(userData: { token: string }): Promise<string> {
    if (isEmpty(userData)) throw new HttpException(400, `token missing`);
    const secretKey: string = REFRESH_KEY;
    const verificationResponse = (await verify(userData.token, secretKey)) as DataStoredInToken;
    if (!verificationResponse) {
      throw new HttpException(400, `bad request`);
    }
    const userId = verificationResponse._id;
    const user = await this.users.findById(userId);
    // const accessToken = this.createIdToken(user);
    return {token:'sadf'};
  }

  public async logout(userData: User): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, `userData is empty`);

    const findUser: User = await this.users.findOne({ email: userData.email });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    return findUser;
  }



}

export default AuthService;
