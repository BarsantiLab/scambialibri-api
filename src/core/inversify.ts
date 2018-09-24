import { Container } from 'inversify';

import { Configuration } from 'core/config';
import { Db } from 'core/db';
import { Logger } from 'core/log';
import { PassportConfiguration } from 'core/passport';
import { Policy } from 'core/policy';

import { AgendaService } from 'services/agenda.service';
import { AuthService } from 'services/auth.service';
import { GeoService } from 'services/geo.service';
import { MailService } from 'services/mail.service';
import { ResponseService } from 'services/response.service';
import { TransactionService } from 'services/transaction.service';

import { BookRoute } from 'api/endpoints/book/book.route';
import { SchoolRoute } from 'api/endpoints/school/school.route';
import { StatsRoute } from 'api/endpoints/stats/stats.route';
import { TransactionRoute } from 'api/endpoints/transaction/transaction.route';
import { UserRoute } from 'api/endpoints/user/user.route';

import { BookController } from 'api/endpoints/book/book.controller';
import { SchoolController } from 'api/endpoints/school/school.controller';
import { StatsController } from 'api/endpoints/stats/stats.controller';
import { TransactionController } from 'api/endpoints/transaction/transaction.controller';
import { UserController } from 'api/endpoints/user/user.controller';

import { BookValidator } from 'api/endpoints/book/book.validator';
import { SchoolValidator } from 'api/endpoints/school/school.validator';
import { TransactionValidator } from 'api/endpoints/transaction/transaction.validator';
import { UserValidator } from 'api/endpoints/user/user.validator';

import { Api } from 'api/api';
import { RouterFactory } from 'api/router';

// tslint:disable-next-line:variable-name
export const InversifyContainer = new Container();

InversifyContainer.bind<Configuration>(Configuration).toSelf().inSingletonScope();
InversifyContainer.bind<Db>(Db).toSelf().inSingletonScope();
InversifyContainer.bind<Logger>(Logger).toSelf().inSingletonScope();

InversifyContainer.bind<PassportConfiguration>(PassportConfiguration).toSelf();
InversifyContainer.bind<Policy>(Policy).toSelf();

InversifyContainer.bind<AgendaService>(AgendaService).toSelf().inSingletonScope();
InversifyContainer.bind<AuthService>(AuthService).toSelf();
InversifyContainer.bind<GeoService>(GeoService).toSelf();
InversifyContainer.bind<MailService>(MailService).toSelf();
InversifyContainer.bind<ResponseService>(ResponseService).toSelf();
InversifyContainer.bind<TransactionService>(TransactionService).toSelf();

InversifyContainer.bind<BookRoute>(BookRoute).toSelf();
InversifyContainer.bind<SchoolRoute>(SchoolRoute).toSelf();
InversifyContainer.bind<StatsRoute>(StatsRoute).toSelf();
InversifyContainer.bind<TransactionRoute>(TransactionRoute).toSelf();
InversifyContainer.bind<UserRoute>(UserRoute).toSelf();

InversifyContainer.bind<BookController>(BookController).toSelf();
InversifyContainer.bind<SchoolController>(SchoolController).toSelf();
InversifyContainer.bind<StatsController>(StatsController).toSelf();
InversifyContainer.bind<TransactionController>(TransactionController).toSelf();
InversifyContainer.bind<UserController>(UserController).toSelf();

InversifyContainer.bind<BookValidator>(BookValidator).toSelf();
InversifyContainer.bind<SchoolValidator>(SchoolValidator).toSelf();
InversifyContainer.bind<TransactionValidator>(TransactionValidator).toSelf();
InversifyContainer.bind<UserValidator>(UserValidator).toSelf();

InversifyContainer.bind<Api>(Api).toSelf();
InversifyContainer.bind<RouterFactory>(RouterFactory).toSelf();
