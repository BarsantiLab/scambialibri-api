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

Il server accetta una serie di parametri di configurazione impostati come variabili d'ambiente. Si possono trovare al file [`config.ts`](src/core/config.ts) e vengono caricati all'avvio, quindi è necessario un riavvio se vengono variati. Questa è la lista delle opzioni:

Nome variabile|Descrizione
---|---
`SL_GOOGLE_TOKEN`|Token delle API di Google per il servizio di geolocalizzazione
`SL_MAILGUN_API_KEY`|API key di Mailgun per l'invio delle e-mail
`SL_MAILGUN_DOMAIN`|Nome del dominio configurato su Mailgun
`SL_MAIL_DOMAIN`|Dominio base che verrà usato come prefisso sui link cliccabili delle e-mail
`SL_MONGO_HOST`|Host che ospita il servizio di MongoDB
`SL_MONGO_USER`|Username per l'accesso a MongoDB. Lasciare vuoto se non utilizzato.
`SL_MONGO_PASSWORD`|Password per l'accesso a MongoDB. Lasciare vuoto se non utilizzata.
`SL_MONGO_DB`|Nome del database
`SL_PREVENT_MAIL_SENDING`|**Debug**: previene l'invio di mail mentre si è in modalità di debug

Le variabili d'ambiente si possono impostare anche in un file chiamato `.env`, caricato poi attraverso [`dotenv`](https://github.com/motdotla/dotenv), formattato nelle modalità descritte dallo stesso.

## Deploy

Per il deploy al momento viene utilizzato un semplice script bash ([`build.sh`](/build.sh)) che compila i sorgenti, crea un archivio compresso con l'output e in base all'environment specificato carica su diverse directory remote tramite `scp`. Dopo aver caricato l'archivio invia un comando via `ssh` per decomprimere l'archivio caricato e riavviare `pm2`, il gestore dei processi.

Per adattarlo alle proprie macchine cambiare le righe 33 e 34 cambiando l'URL, eventualmente l'utente e la path sulla quale vengono caricati gli archivi.

Questo è solo una misura temporanea, in futuro verrà attivato [CircleCI](https://circleci.com/) per le operazioni ci Continuous Integration e Continuous Delivery (vedi [Progetti futuri](#progetti-futuri)).

## Progetti futuri

Questa è una lista delle modifiche future che verranno implementate man mano lato server. Non sono in ordine temporale, né di importanza.

- [ ] Integrazione con [CircleCI](https://circleci.com/) per continuous integration/delivery e [CodeClimate](https://codeclimate.com/) per la quality assurance.
- [ ] Creazione di un container Docker (probabilmente trasversale a tutti i progetti LoScambialibri.it).
- [ ] Integrazione di unit testing per le API.
- [ ] Integrazione di una piattaforma per la documentazione delle API ([Swagger](https://swagger.io/)/[apiDoc](http://apidocjs.com/)).
- [ ] Integrazione di un broker MQTT per la chat real-time.
- [ ] Integrazione delle API di amministrazione/statistiche.
- [ ] Integrazione automatica di una strategia di [SemVer](https://semver.org/).

## Contributori cercasi!

LoScambialibri.it è sempre in cerca di menti che si uniscano nel progetto, in modo di condividere le proprie conoscenze e mettersi a confronto con altri colleghi!

Per avere maggiori informazioni consulta [CONTRIBUTING.md](/CONTRIBUTING.md) e leggi su come fare la tua parte!

## Autori

* **Davide Rossetto** - *Reviewer and first maintainer* - [DavideRoss](https://github.com/DavideRoss)
* **Marco Rubin** - *Presidente di LoScambialibri.it e tester*

## Licenza

Il progetto è coperto dalla licenza MIT - vedere la [LICENSE](LICENSE) per i dettagli.
