import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';

export const AppDataSource = new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
});
