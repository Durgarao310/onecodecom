import { NextFunction, Request, Response } from 'express';
import { RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import AuthService from '@services/auth.service';

class AuthController {
  public authService = new AuthService();

  public signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signUpUserData: User = await this.authService.signup(req.body);
      res.status(201).json({ data: signUpUserData, message: 'signup' });
    } catch (error) {
      next(error);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const headerToken = req.cookies['refreshToken'];
      const bodyToken = req.body.refreshToken;
      req.body.token = bodyToken || headerToken;
      const accessToken: string = await this.authService.refreshToken(req.body);
      if (headerToken) {
        const tokenOptions: string = 'accessToken=' + accessToken + ';expires=' + '; Max-Age=' + 60 * 60 + '; HttpOnly; Secure';
        res.setHeader('Set-Cookie', [tokenOptions]);
      }
      res.status(200).json({ accessToken: accessToken });
    } catch (error) {
      if (error.message === 'jwt expired') {
        error.status = 401;
        error.message = 'Wrong authentication token';
      }
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const logOutUserData: User = await this.authService.logout(req.body);
      res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
      res.status(200).json({ data: logOutUserData, message: 'logout' });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
