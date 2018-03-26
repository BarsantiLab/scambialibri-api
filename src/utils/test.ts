import { Configuration } from 'core/config';
import { InversifyContainer } from 'core/inversify';

import { Api } from 'api/api';
import { Db } from 'core/db';

export interface ITestGlobals {
    db: Db;
    url: string;
    api: Api;
}

export async function init_e2e(): Promise<ITestGlobals> {
    const conf: Configuration = new Configuration();

    conf.mongo = conf.test.mongo;

    const backendConfig = InversifyContainer.get<Configuration>(Configuration);
    backendConfig.setConfiguration(conf);

    const server = InversifyContainer.get<Api>(Api);
    await server.setup();
    await server.listen();

    return {
        api: server,
        db: InversifyContainer.get<Db>(Db),
        url: `http://localhost:${backendConfig.http.port}/`
    };
}
