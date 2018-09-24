# Scambialibri - API

**Scambialibri** è una piattaforma Web per la compravendita di libri scolastici trasversalmente all'istituto di appartenenza, mettendo in comunicazione i venditori con gli eventuali compratori.

### Prerequisiti

Per poter girare correttamente ha bisogno dei seguenti software:

- Node.js v8+
- MongoDB 3+
- Gulp 3.9+ (per la compilazione dei template delle e-mail)
- Shell bash (per lo script di deploy, non fondamentale)

### Installazione

Per installare il progetto si può usare il seguente script:

```sh
git clone git@github.com:BarsantiLab/scambialibri-api.git
cd scambialibri-api
npm install
```

Quando il progetto sarà pullato e i moduli installati lanciare Gulp per compilare i template delle e-mail:

```
gulp mail
```

Una volta completato anche questo processo il server è pronto per essere avviato.

### Avvio

Per avviare il progetto sulla macchina locale è sufficiente lanciare questo comando:

```
npm start
```

Il server cercherà di connettersi automaticamente al database MongoDB all'indirizzo `mongodb://localhost/Scambialibri` e sarà raggiungibile alla porta `8080`. Per cambiare i valori consultare la sezione [Configurazione](#configurazione).

## Configurazione

Il server accetta una serie di parametri di configurazione impostati come variabili d'ambiente. Si possono trovare al file [config.ts](src/core/config.ts) e vengono caricati all'avvio, quindi è necessario un riavvio se vengono variati. Questa è la lista delle opzioni:

Nome variabile|Descrizione
---|---
`SL_GOOGLE_TOKEN`|
`SL_MAILGUN_API_KEY`|
`SL_MAILGUN_DOMAIN`|
`SL_MAIL_DOMAIN`|
`SL_MONGO_DB`|
`SL_MONGO_HOST`|
`SL_MONGO_PASSWORD`|
`SL_MONGO_USER`|

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc

