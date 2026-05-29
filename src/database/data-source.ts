import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

import { SnakeNamingStrategy } from './snake-naming.strategy';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
  migrationsRun: true,
  logging: process.env.NODE_ENV !== 'production',
};

export default new DataSource(dataSourceOptions);
