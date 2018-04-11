import { injectable } from 'inversify';

import * as express from 'express';
import * as passport from 'passport';

export enum Role {
    authenticated,
    administrator,
    user
}

@injectable()
export class Policy {
    is(role: Role): express.Handler {
        return (req, res, next) => {
            this
                ._isRoleValid(req, res, role)
                .then(next)
                .catch(next);
        };
    }

    private _isAuthenticated(req, res): Promise<any> {
        return new Promise((resolve, reject) => {
            passport.authenticate('bearer')(req, res, () => {
                resolve();
            });
        });
    }

    private _isAdministrator(req, res): Promise<any> {
        return new Promise((resolve, reject) => {
            passport.authenticate('bearer')(req, res, () => {
                if (req.user.role !== Role.administrator) reject({ status: 403 });
                else resolve();
            });
        });
    }

    private _isUser(req, res): Promise<any> {
        return new Promise((resolve, reject) => {
            passport.authenticate('bearer')(req, res, () => {
                if (req.user.role !== Role.user) reject({ status: 403 });
                else resolve();
            });
        });
    }

    private _isRoleValid(req, res, role: Role): Promise<boolean> {
        switch (role) {
            case Role.authenticated: return this._isAuthenticated(req, res);
            case Role.administrator: return this._isAdministrator(req, res);
            case Role.user: return this._isUser(req, res);
            default: throw Error('Invalid role ' + role);
        }
    }
}
