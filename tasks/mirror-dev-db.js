conn = new Mongo();
db = conn.getDB('ScambialibriDev');
db.dropDatabase();
db = conn.getDB('Scambialibri');
db.copyDatabase('Scambialibri', 'ScambialibriDev');