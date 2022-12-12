/* eslint-disable @typescript-eslint/no-unused-vars */
import { hash, compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { SECRET_KEY, OTP_KEY, REFRESH_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import userModel from '@models/users.model';
import { isEmpty } from '@utils/util';
import MailService from '@/utils/mail';
import otpModel from '@/models/otps.models';
import { Otp } from '@/interfaces/otps.interface';

class AuthService {
  public users = userModel;
  public otps = otpModel;

  public mail = new MailService();

  public async signup(userData: { email: string; password: string }): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, `userData is empty`);

    const findUser: User = await this.users.findOne({ email: userData.email });

    //if user is create and verified
    if (findUser && findUser.verify) {
      throw new HttpException(409, `This email ${userData.email} already exists`);

      // if user is created and unverified. sending new otp-token along with otp
    } else if (findUser) {
      const hashedPassword = await hash(userData.password, 10);
      // updating  password user.id
      const updatePassword = this.users.findByIdAndUpdate(findUser._id, { password: hashedPassword });

      //otp checking with user.id
      const checkOtpExist = this.otps.findOne({ user: findUser._id });
      const promiseFirst = Promise.all([updatePassword, checkOtpExist]);
      const [userRes, otpRes]: [User, Otp] = await promiseFirst;
      const token: string = this.createOtpToken(userRes);

      // checking otp, if otp exists returning user
      if (otpRes) {
        return {
          _id: userRes._id,
          email: userRes.email,
          verify: false,
          token: token,
        };
      } else {
        const otp: number = Math.floor(100000 + Math.random() * 900000);
        const otpCreateData = this.otps.create({ user: userRes._id, otp: otp });
        const otpSend = this.mail.otp(userData.email, otp);
        const promiseSecond = Promise.all([otpCreateData, otpSend]);
        const [otpRes, otpSendRes]: [Otp, any] = await promiseSecond;

        return {
          _id: userRes._id,
          email: userRes.email,
          verify: false,
          token: token,
        };
      }
      // creating new user, otp-token and sending otp
    } else {
      const hashedPassword = await hash(userData.password, 10);
      const otp: number = Math.floor(100000 + Math.random() * 900000);
      const createUserData: User = await this.users.create({ ...userData, password: hashedPassword });
      const otpCreateData = this.otps.create({ user: createUserData._id, otp: otp });
      const otpSend = this.mail.otp(createUserData.email, otp);
      const promiseFirst = Promise.all([otpCreateData, otpSend]);
      const [otpRes, otpSendRes]: [Otp, any] = await promiseFirst;
      const token: string = this.createOtpToken(createUserData);

      return {
        _id: createUserData._id,
        email: createUserData.email,
        verify: false,
        token: token,
      };
    }
  }

  public async verifyOtp(userData: { token: string; otp: string }): Promise<User> {
    const secretKey: string = OTP_KEY;
    const verificationResponse = (await verify(userData.token, secretKey)) as DataStoredInToken;
    if (!verificationResponse) {
      throw new HttpException(400, `bad request`);
    }
    const userId = verificationResponse._id;
    const otpCheck = await this.otps.findOne({ user: userId, otp: userData.otp });
    if (otpCheck) {
      const user: User = await this.users.findByIdAndUpdate(userId, { verify: true });
      return user;
    } else {
      throw new HttpException(400, `invalid otp`);
    }
  }

  public async resendOtp(userData: { token: string; otp: string }): Promise<User> {
    const secretKey: string = OTP_KEY;
    const verificationResponse = (await verify(userData.token, secretKey)) as DataStoredInToken;
    if (!verificationResponse) {
      throw new HttpException(400, `bad request`);
    }
    const userId = verificationResponse._id;
    const user = this.users.findById(userId);
    const checkOtpExist = this.otps.findOne({ user: userId });
    const promiseAll = Promise.all([user, checkOtpExist]);
    const [userRes, otpRes]: [User, any] = await promiseAll;

    if (!verificationResponse) {
      throw new HttpException(400, `bad request`);
    }
    if (userRes) {
      return userRes;
    } else {
      const otp: number = Math.floor(100000 + Math.random() * 900000);
      const otpCreateData = this.otps.create({ user: userId, otp: otp });
      const otpSend = this.mail.otp(userRes.email, otp);
      const promiseSecond = Promise.all([otpCreateData, otpSend]);
      const [otpRes, otpSendRes]: [Otp, any] = await promiseSecond;
      return userRes;
    }
  }

  public async login(userData: { email: string; password: string }): Promise<{ accessToken: string; user: User; refreshToken: string }> {
    if (isEmpty(userData)) throw new HttpException(400, `userData is empty`);

    const user: User = await this.users.findOne({ email: userData.email });

    if (!user) throw new HttpException(409, `This email ${userData.email} was not found`);

    const isPasswordMatching: boolean = await compare(userData.password, user.password);
    if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

    if (!user.verify) throw new HttpException(409, `This email ${userData.email} was not verified`);

    const accessToken = this.createIdToken(user);
    const refreshToken = this.createRefreshToken(user);

    return { refreshToken, accessToken, user };
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
    const accessToken = this.createIdToken(user);
    return accessToken;
  }

  public async logout(userData: User): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, `userData is empty`);

    const findUser: User = await this.users.findOne({ email: userData.email });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    return findUser;
  }

  public createIdToken(user: User): string {
    const dataStoredInToken: DataStoredInToken = { _id: user._id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60;

    return sign(dataStoredInToken, secretKey, { expiresIn });
  }

  public createRefreshToken(user: User): string {
    const dataStoredInToken: DataStoredInToken = { _id: user._id };
    const secretKey: string = REFRESH_KEY;
    const expiresIn: number = 60 * 60 * 24 * 7;

    return sign(dataStoredInToken, secretKey, { expiresIn });
  }

  public createOtpToken(user: User): string {
    const dataStoredInToken: DataStoredInToken = { _id: user._id };
    const secretKey: string = OTP_KEY;
    const expiresIn: number = 60 * 60;

    return sign(dataStoredInToken, secretKey, { expiresIn });
  }
}

export default AuthService;
