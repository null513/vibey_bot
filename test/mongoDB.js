require('dotenv').config();

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const testSchema = new Schema({
  name: { type: String, required: true }
});

const Name = mongoose.model('Name', testSchema);

describe('Database Tests', function() {
  switch (process.env.NODE_ENV) {
    case 'production':
      console.log('PRODUCTION DB');
      mongoose.connect(
        `mongodb+srv://vibey_bot:${process.env.DB_PASS}@cluster0-gtgmw.mongodb.net/vibeybot?retryWrites=true&w=majority`,
        {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      );
      break;

    case 'dev':
      console.log('DEV DB');
      mongoose.connect('mongodb://localhost:27017/vibeybot', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      break;
  }
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error'));
  db.once('open', function() {
    console.log(' We are connected to test database!');
  });
});

describe('Test Database', function() {
  it('New name saved to test database', function(done) {
    var testName = Name({
      name: 'Mike'
    });
    testName.save(done);
  });

  it('Dont save incorrect format to database', function(done) {
    var wrongSave = Name({
      notName: 'Not Mike'
    });

    wrongSave.save(err => {
      if (err) {
        return done();
      }
      throw new Error('Should generate error!');
    });
  });

  it('Should retrieve data from test database', function(done) {
    Name.find({ name: 'Mike' }, (err, name) => {
      if (err) {
        throw err;
      }
      if (name.length === 0) {
        throw new Error('No data!');
      }
      done();
    });
  });

  after(function(done) {
    mongoose.connection.db.dropDatabase(function() {
      mongoose.connection.close(done);
    });
  });
});
