import * as mongoose from 'mongoose';

import { IToken, ITokenModel, TokenLevel } from 'interfaces/token.interface';
import { IUser } from 'interfaces/user.interface';

export class TokenSchema extends mongoose.Schema implements IToken {
    value?: string;
    expireAt?: Date;
    level?: TokenLevel;
    user?: IUser;

    constructor() {
        super({

            expireAt: {
                required: true,
                type: Date
            },

            level: {
                required: true,
                type: Number
            },

            user: {
                ref: 'User',
                type: mongoose.Schema.Types.ObjectId
            },

            value: {
                required: true,
                type: String
            }
        });
    }
}

// tslint:disable-next-line:variable-name
export const Token = mongoose.model<ITokenModel>('Token', new TokenSchema());
