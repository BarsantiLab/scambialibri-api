import { injectable } from 'inversify';

import { ITokenModel, TokenLevel } from 'interfaces/token.interface';
import { IUserModel } from 'interfaces/user.interface';

import { Token } from 'models/token.model';

import * as cryptUtils from 'utils/crypt';

@injectable()
export class AuthService {
    /**
     * Create a new random access token on database
     *
     * @param {IUserModel} user User to whom the token will be assigned
     * @param {number} expiration Expiration time in seconds
     * @param {number} level Token level (phase of account state)
     * @returns {Promise<ITokenModel>} Instance of the saved token
     * @memberof AuthService
     */
    async createToken(user: IUserModel, expiration: number, level: TokenLevel): Promise<ITokenModel> {
        const expireAt = new Date();
        expireAt.setTime(expireAt.getTime() + expiration * 1000);

        const token = new Token({
            expireAt,
            level,
            user: user._id,
            value: cryptUtils.uuid(16),
        });

        return await token.save();
    }
}
