// create-database.ts
import { createConnection } from 'typeorm';
import * as process from "node:process";

async function createDatabase() {
    try {
        const connection = await createConnection({
            type: 'postgres',
            host: process.env.TYPEORM_HOST,
            port: Number(process.env.TYPEORM_PORT),
            username: process.env.TYPEORM_USERNAME,
            password: String(process.env.TYPEORM_PASSWORD),
            database: process.env.TYPEORM_DATABASE, // Подключение к базе данных "postgres" вместо вашей базы данных
        });

        await connection.query(`CREATE DATABASE ${process.env.TYPEORM_DATABASE}`);

        console.log(`Database ${process.env.TYPEORM_DATABASE} created successfully`);

        await connection.close();
    } catch (error) {
        console.log('Error creating database:', error);
    }
}

createDatabase();
