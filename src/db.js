import seq from 'sequelize';
const { Sequelize, Model, DataTypes } = seq;

const db = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // <<<<<<< YOU NEED THIS
    }
  }
});

export class AuthTokenEmail extends Model { }
AuthTokenEmail.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  email: DataTypes.STRING
}, { sequelize: db, modelName: 'auth_token_email' });

export class WaitForEmail extends Model { }
WaitForEmail.init({
  id: { type: DataTypes.STRING, primaryKey: true }
}, { sequelize: db, modelName: 'wait_for_email' });


export class WaitForPassword extends Model { }
WaitForPassword.init({
  id: { type: DataTypes.STRING, primaryKey: true }
}, { sequelize: db, modelName: 'wait_for_password' });

export class AccessToken extends Model { }
AccessToken.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  value: DataTypes.STRING
}, { sequelize: db, modelName: 'access_token' });

export { db }