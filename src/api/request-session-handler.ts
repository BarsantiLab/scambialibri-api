import { Request } from 'express';
import { IUserModel } from 'interfaces/user.interface';

export interface IRequestSessionHandler extends Request {
    user?: IUserModel;
}
