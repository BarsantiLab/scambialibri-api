import { injectable } from 'inversify';

import * as express from 'express';
import * as passport from 'passport';

import { UserRole } from 'models/user.model';

export enum Roles {
    authenticated,
    administrator,
    user
}

@injectable()
export class Policy {
    is(role: Roles): express.Handler {
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
                if (req.user.role !== UserRole.administrator) reject({ status: 403 });
                else resolve();
            });
        });
    }

    private _isUser(req, res): Promise<any> {
        return new Promise((resolve, reject) => {
            passport.authenticate('bearer')(req, res, () => {
                if (req.user.role !== UserRole.user) reject({ status: 403 });
                else resolve();
            });
        });
    }

    private _isRoleValid(req, res, role: Roles): Promise<boolean> {
        switch (role) {
            case Roles.authenticated: return this._isAuthenticated(req, res);
            case Roles.administrator: return this._isAdministrator(req, res);
            case Roles.user: return this._isUser(req, res);
            default: throw Error('Invalid role ' + role);
        }
    }
}
